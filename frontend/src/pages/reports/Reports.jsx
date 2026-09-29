import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { getCurrentUser } from "../../services/authService";
import { downloadReport, getReportDashboard, REPORT_TYPES, reportsBasePath } from "../../services/reportService";
import { formatLKR, formatNumber } from "../../utils/format";
import { BarList, ColumnChart } from "./ReportCharts";

import "./reports.css";


const ELIGIBILITY_TONES = {
    Eligible: { tone: "good", icon: "bi-check-circle" },
    Ineligible: { tone: "critical", icon: "bi-x-circle" },
    Pending: { tone: "neutral", icon: "bi-hourglass-split" }
};



// Accent tone and illustration for each report card.
// tone: "green" | "blue" | "purple" | "orange"; badge: Bootstrap icon shown on the drawn document.
// image (optional) replaces the drawn document with a picture.
const REPORT_VISUALS = {
    // TODO(human)
};

const DEFAULT_VISUAL = { tone: "green", badge: "bi-file-earmark-text" };


// Small drawn scene: a document with a round badge, framed by leaves.
function ReportIllustration({ visual }) {
    if (visual.image) {
        return (
            <div className="nallabid-report-illustration">
                <img src={visual.image} alt="" />
            </div>
        );
    }

    return (
        <div className={`nallabid-report-illustration nallabid-report-tone-${visual.tone}`} aria-hidden="true">
            <span className="nallabid-report-leaf nallabid-report-leaf-left"></span>
            <span className="nallabid-report-leaf nallabid-report-leaf-right"></span>
            <span className="nallabid-report-doc">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </span>
            <span className="nallabid-report-doc-badge">
                <i className={`bi ${visual.badge}`}></i>
            </span>
        </div>
    );
}


function ReportCard({ type, basePath }) {
    const report = REPORT_TYPES[type];
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");

    // RFQ comparison is per-RFQ, so its exports need an RFQ picked in the report view.
    const needsRFQ = type === "rfq-comparison";
    const visual = { ...DEFAULT_VISUAL, ...REPORT_VISUALS[type] };

    async function handleDownload(format) {
        setBusy(format);
        setError("");

        try {
            await downloadReport(type, format, {});
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusy("");
        }
    }

    return (
        <article className="nallabid-report-card">
            <div className="nallabid-report-card-head">
                <div className={`nallabid-report-card-icon nallabid-report-tone-${visual.tone}`}>
                    <i className={`bi ${report.icon}`}></i>
                </div>

                <div>
                    <h3>{report.title}</h3>
                    <p>{report.description}</p>
                </div>
            </div>

            <ReportIllustration visual={visual} />

            {needsRFQ && (
                <small className="nallabid-report-card-hint">
                    <i className="bi bi-info-circle"></i>
                    Open the report and pick an RFQ to export it.
                </small>
            )}

            {error && <small className="nallabid-report-card-error">{error}</small>}

            <div className="nallabid-report-card-actions">
                <Link to={`${basePath}/${type}`} className="nallabid-report-button nallabid-report-button-primary">
                    <i className="bi bi-eye"></i>
                    View Report
                </Link>

                <button
                    type="button"
                    className="nallabid-report-button"
                    disabled={needsRFQ || Boolean(busy)}
                    onClick={() => handleDownload("pdf")}
                >
                    <i className={busy === "pdf" ? "bi bi-hourglass-split" : "bi bi-file-earmark-pdf"}></i>
                    Download PDF
                </button>

                <button
                    type="button"
                    className="nallabid-report-button nallabid-report-button-wide"
                    disabled={needsRFQ || Boolean(busy)}
                    onClick={() => handleDownload("csv")}
                >
                    <i className={busy === "csv" ? "bi bi-hourglass-split" : "bi bi-filetype-csv"}></i>
                    Export CSV
                </button>
            </div>
        </article>
    );
}


function PanelHead({ icon, tone, title, subtitle, period }) {
    return (
        <header className="nallabid-report-panel-head">
            <div className="nallabid-report-panel-title">
                <div className={`nallabid-report-panel-icon nallabid-report-tone-${tone}`}>
                    <i className={`bi ${icon}`}></i>
                </div>

                <div>
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
            </div>

            {period && (
                <span className="nallabid-report-period">
                    <i className="bi bi-calendar3"></i>
                    {period}
                </span>
            )}
        </header>
    );
}


function SummaryCard({ icon, tone, label, value }) {
    return (
        <div className="nallabid-report-stat">
            <div className={`nallabid-report-stat-icon nallabid-report-tone-${tone}`}>
                <i className={`bi ${icon}`}></i>
            </div>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
            </div>
        </div>
    );
}


function BuyerDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // setState only runs in promise callbacks, never synchronously inside the effect.
    const loadDashboard = useCallback(() => getReportDashboard()
        .then((data) => {
            setDashboard(data);
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), []);

    function retryDashboard() {
        setLoading(true);
        setError(null);
        loadDashboard();
    }

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    if (loading && !dashboard) {
        return (
            <section className="nallabid-report-panel">
                <Loading message="Loading analytics..." />
            </section>
        );
    }

    if (error) {
        return (
            <section className="nallabid-report-panel">
                <ErrorMessage error={error} onRetry={retryDashboard} />
            </section>
        );
    }

    return (
        <>
            <div className="nallabid-report-stats">
                <SummaryCard icon="bi-file-earmark-text" tone="primary" label="Total RFQs" value={formatNumber(dashboard.total_rfqs)} />
                <SummaryCard icon="bi-file-earmark-check" tone="orange" label="Total Quotations" value={formatNumber(dashboard.total_quotations)} />
                <SummaryCard icon="bi-shield-check" tone="good" label="Eligible Quotations" value={formatNumber(dashboard.eligible_quotations)} />
                <SummaryCard icon="bi-trophy" tone="purple" label="Awards" value={formatNumber(dashboard.total_awards)} />
                <SummaryCard icon="bi-cash-stack" tone="blue" label="Awarded Value" value={formatLKR(dashboard.total_awarded_value)} />
            </div>

            <div className="nallabid-report-charts">
                <section className="nallabid-report-panel">
                    <PanelHead
                        icon="bi-pie-chart"
                        tone="green"
                        title="RFQ Status"
                        subtitle="How many of your RFQs are in each stage."
                    />
                    <BarList items={dashboard.rfq_status_distribution} emptyMessage="No RFQs yet" />
                </section>

                <section className="nallabid-report-panel">
                    <PanelHead
                        icon="bi-graph-up-arrow"
                        tone="blue"
                        title="Quotation Trend"
                        subtitle="Quotations received per month."
                        period="Last 12 Months"
                    />
                    <ColumnChart
                        items={dashboard.monthly_quotation_count}
                        seriesLabel="Quotations"
                        emptyMessage="No quotations in the last 12 months"
                    />
                </section>

                <section className="nallabid-report-panel">
                    <PanelHead
                        icon="bi-shield-check"
                        tone="green"
                        title="Eligibility Analysis"
                        subtitle="Evaluation outcome of quotations on your RFQs."
                    />
                    <BarList
                        items={dashboard.eligibility_distribution.map((item) => ({
                            ...item,
                            ...ELIGIBILITY_TONES[item.label]
                        }))}
                        emptyMessage="No quotations yet"
                    />
                </section>

                <section className="nallabid-report-panel">
                    <PanelHead
                        icon="bi-trophy"
                        tone="orange"
                        title="Award Analysis"
                        subtitle="Total awarded value by supplier."
                    />
                    <BarList
                        items={dashboard.awards_by_supplier.map((item) => ({
                            label: `${item.supplier_name} (${item.award_count})`,
                            value: item.total_value
                        }))}
                        formatValue={formatLKR}
                        emptyMessage="No awards yet"
                    />
                </section>
            </div>
        </>
    );
}


function Reports() {
    const role = getCurrentUser()?.role;
    const isBuyer = role === "BUYER";
    const basePath = reportsBasePath(role);

    const reportTypes = Object.keys(REPORT_TYPES).filter(
        (type) => isBuyer || !REPORT_TYPES[type].buyerOnly
    );

    return (
        <div className="nallabid-reports-page">
            <header className="nallabid-report-header">
                <div>
                    <h1>Reports &amp; Analytics</h1>
                    <p>
                        {isBuyer
                            ? "Live procurement analytics from your RFQs, quotations and awards."
                            : "Reports on your own quotations and awards."}
                    </p>
                </div>
            </header>

            {isBuyer && <BuyerDashboard />}

            <div className="nallabid-report-section">
                <h2 className="nallabid-report-section-title">Reports</h2>
                <p>Generate and download detailed reports from your procurement data.</p>
            </div>

            <div className="nallabid-report-cards">
                {reportTypes.map((type) => (
                    <ReportCard key={type} type={type} basePath={basePath} />
                ))}
            </div>
        </div>
    );
}


export default Reports;
