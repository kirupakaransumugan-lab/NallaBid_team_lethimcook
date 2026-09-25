import csv
import io
from datetime import datetime
from decimal import Decimal
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor("#03172f")
BLUE = colors.HexColor("#087cff")
BORDER = colors.HexColor("#c9d6e6")
STRIPE = colors.HexColor("#f2f6fb")
MUTED = colors.HexColor("#5b7189")


# =========================================================
# Value formatting
# =========================================================

def _csv_value(value) -> str:
    if value is None:
        return ""

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M")

    return str(value)


def _pdf_value(value) -> str:
    if value is None:
        return "-"

    if isinstance(value, Decimal):
        return f"{value:,.2f}"

    if isinstance(value, datetime):
        return value.strftime("%d %b %Y")

    return str(value)


# =========================================================
# CSV
# =========================================================

def build_csv(columns: list[tuple[str, str]], rows: list[dict]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([label for _, label in columns])

    for row in rows:
        writer.writerow([_csv_value(row.get(key)) for key, _ in columns])

    # utf-8-sig adds a BOM so Excel opens non-ASCII supplier names correctly.
    return buffer.getvalue().encode("utf-8-sig")


# =========================================================
# PDF
# =========================================================

def _column_widths(columns: list[tuple[str, str]], rows: list[dict], total_width: float) -> list[float]:
    """Share the page width by typical content length, so long text columns
    (e.g. failure reasons) get room and short numeric ones stay narrow."""
    weights = []

    for key, label in columns:
        longest_word = max(len(word) for word in label.split())
        content = max((len(_pdf_value(row.get(key))) for row in rows), default=0)
        weights.append(max(longest_word, min(content, 40), 6))

    total = sum(weights)
    return [total_width * weight / total for weight in weights]


class _NumberedCanvas(pdf_canvas.Canvas):
    """Defers page output until the end so every page can show "Page X of Y"."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_pages = []

    def showPage(self):
        self._saved_pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_pages)

        for page_state in self._saved_pages:
            self.__dict__.update(page_state)
            self._draw_footer(total)
            super().showPage()

        super().save()

    def _draw_footer(self, total: int):
        width, _ = self._pagesize
        self.setFont("Helvetica", 8)
        self.setFillColor(MUTED)
        self.drawString(15 * mm, 10 * mm, "NallaBid - SME RFQ & Supplier Evaluation Platform")
        self.drawRightString(width - 15 * mm, 10 * mm, f"Page {self._pageNumber} of {total}")


def build_pdf(
    title: str,
    filters: dict[str, str],
    columns: list[tuple[str, str]],
    rows: list[dict],
    summary: list[tuple[str, object]],
    generated_at: datetime,
) -> bytes:
    buffer = io.BytesIO()
    page_size = landscape(A4)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=18 * mm,
        title=f"NallaBid - {title}",
        author="NallaBid",
    )

    styles = getSampleStyleSheet()
    brand = ParagraphStyle("Brand", parent=styles["Title"], fontSize=22, textColor=NAVY, alignment=0, spaceAfter=2)
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], textColor=BLUE, spaceBefore=0, spaceAfter=4)
    meta = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=9, textColor=MUTED, leading=12)
    section = ParagraphStyle("Section", parent=styles["Heading4"], textColor=NAVY, spaceBefore=8, spaceAfter=4)
    cell = ParagraphStyle("Cell", parent=styles["Normal"], fontSize=7.5, leading=9)
    head_cell = ParagraphStyle("HeadCell", parent=cell, textColor=colors.white, fontName="Helvetica-Bold")

    story = [
        Paragraph('Nalla<font color="#087cff">Bid</font>', brand),
        Paragraph(escape(title), heading),
        Paragraph(f"Generated: {generated_at.strftime('%d %B %Y, %H:%M')} UTC", meta),
        Paragraph(
            "Filters: " + escape(" | ".join(f"{key}: {value}" for key, value in filters.items())),
            meta,
        ),
        Spacer(1, 6 * mm),
    ]

    if summary:
        story.append(Paragraph("Summary", section))
        summary_rows = [
            [Paragraph(escape(str(label)), cell), Paragraph(escape(_pdf_value(value)), cell)]
            for label, value in summary
        ]
        summary_table = Table(summary_rows, colWidths=[80 * mm, 50 * mm], hAlign="LEFT")
        summary_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("BACKGROUND", (0, 0), (0, -1), STRIPE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story += [summary_table, Spacer(1, 5 * mm)]

    story.append(Paragraph("Report Data", section))

    if not rows:
        story.append(Paragraph("No records match the selected filters.", meta))
    else:
        # Paragraph cells wrap long text instead of overflowing the page.
        data = [[Paragraph(escape(label), head_cell) for _, label in columns]]
        data += [
            [Paragraph(escape(_pdf_value(row.get(key))), cell) for key, _ in columns]
            for row in rows
        ]

        table = Table(data, repeatRows=1, colWidths=_column_widths(columns, rows, doc.width))
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, STRIPE]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(table)

    doc.build(story, canvasmaker=_NumberedCanvas)
    return buffer.getvalue()
