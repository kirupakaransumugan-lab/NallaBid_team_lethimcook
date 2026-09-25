import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { getCurrentUser } from "../../services/authService";
import { downloadReport, getReport, REPORT_TYPES, reportsBasePath } from "../../services/reportService";
import { formatDate, formatLKR, formatNumber } from "../../utils/format";
import { BarList } from "./ReportCharts";

import "./reports.css";


// Which URL query parameters each report accepts (mirrors the backend filters).
const FILTER_KEYS = {
    "rfq-comparison": ["rfq_id"],
    "supplier-eligibility": ["rfq_id", "eligibility"],
    "award-summary": ["date_from", "date_to", "status"]
};


function EligibilityBadge({ value }) {
    return (
        <span className={`nallabid-report-badge nallabid-report-badge-${value.toLowerCase()}`}>
            {value === "PENDING" ? "Not evaluated" : value}
        </span>
    );
}


const TABLES = {
    "rfq-comparison": {
        columns: [
            ["Supplier", (row) => row.supplier_name],
            ["Quotation", (row) => row.quotation_number],
            ["Unit price", (row) => formatLKR(row.unit_price), true],
            ["Total price", (row) => formatLKR(row.total_price), true],
            ["Delivery", (row) => `${row.delivery_days} days`, true],
            ["Warranty", (row) => `${row.warranty_months} months`, true],
            ["Eligibility", (row) => <EligibilityBadge value={row.eligibility} />],
            ["Evaluation result", (row) => row.evaluation_result]
        ],
        rowKey: (row) => row.quotation_id
    },
    "supplier-eligibility": {
        columns: [
            ["Supplier", (row) => row.supplier_name],
            ["RFQ", (row) => row.rfq_number],
            ["Quotation", (row) => row.quotation_number],
            ["Product", (row) => row.product_name],
            ["Requested qty", (row) => formatNumber(row.requested_quantity), true],
            ["Available qty", (row) => formatNumber(row.available_quantity), true],
            ["Quoted price", (row) => formatLKR(row.quoted_price), true],
            ["Delivery (req / actual)", (row) => `≤ ${row.delivery_requirement} / ${row.actual_delivery} days`, true],
            ["Warranty (req / actual)", (row) => `≥ ${row.warranty_requirement} / ${row.actual_warranty} months`, true],
            ["Eligibility", (row) => <EligibilityBadge value={row.eligibility} />],
            ["Failure reason", (row) => row.failure_reason || "-"]
        ],
        rowKey: (row) => row.quotation_number
    },
    "award-summary": {
        columns: [
            ["RFQ", (row) => row.rfq_number],
            ["Product", (row) => row.product_name],
            ["Supplier", (row) => row.supplier_name],
            ["Quotation", (row) => row.quotation_number],
            ["Awarded amount", (row) => formatLKR(row.awarded_amount), true],
            ["Delivery", (row) => `${row.delivery_days} days`, true],
            ["Warranty", (row) => `${row.warranty_months} months`, true],
            ["Award date", (row) => formatDate(row.awarded_at)],
            ["Awarded by", (row) => row.awarded_by_name],
            ["Status", (row) => (
                <span className={`nallabid-report-badge nallabid-report-badge-${row.status.toLowerCase()}`}>
                    {row.status}
                </span>
            )]
        ],
        rowKey: (row) => row.award_id
    }
};


function SummaryTiles({ tiles }) {
    return (
        <div className="nallabid-report-tiles">
            {tiles.map(([label, value]) => (
                <div key={label} className="nallabid-report-tile">
                    <span>{label}</span>
                    <strong>{value}</strong>
                </div>
            ))}
        </div>
    );
}


function summaryTilesFor(type, summary) {
    if (!summary) {
        return [];
    }

    if (type === "rfq-comparison") {
        return [
            ["Quotations", summary.quotation_count],
            ["Lowest price", formatLKR(summary.lowest_price)],
            ["Highest price", formatLKR(summary.highest_price)],
            ["Average price", formatLKR(summary.average_price)],
            ["Fastest delivery", summary.fastest_delivery_days === null ? "-" : `${summary.fastest_delivery_days} days`],
            ["Highest warranty", summary.highest_warranty_months === null ? "-" : `${summary.highest_warranty_months} months`],
            ["Eligible", summary.eligible_count],
            ["Ineligible", summary.ineligible_count]
        ];
    }

    if (type === "supplier-eligibility") {
        return [
            ["Evaluated quotations", summary.total_quotations],
            ["Eligible", summary.eligible_quotations],
            ["Ineligible", summary.ineligible_quotations],
            ["Eligibility rate", `${summary.eligibility_percentage}%`]
        ];
    }

    return [
        ["Total awards", summary.total_awards],
        ["Total awarded value", formatLKR(summary.total_awarded_value)],
        ["Average award value", formatLKR(summary.average_award_value)]
    ];
}


function Filters({ type, report, params, onChange }) {
    const rfqOptions = report?.rfq_options ?? [];

    return (
        <div className="nallabid-report-filters">
            {(type === "rfq-comparison" || type === "supplier-eligibility") && (
                <label className="nallabid-report-field">
                    <span>RFQ</span>
                    <select value={params.rfq_id ?? ""} onChange={(event) => onChange("rfq_id", event.target.value)}>
                        <option value="">
                            {type === "rfq-comparison" ? "Select an RFQ..." : "All RFQs"}
                        </option>
                        {rfqOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.rfq_number} · {option.product_name} ({option.quotation_count} quotations)
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {type === "supplier-eligibility" && (
                <label className="nallabid-report-field">
                    <span>Eligibility</span>
                    <select value={params.eligibility ?? ""} onChange={(event) => onChange("eligibility", event.target.value)}>
                        <option value="">All</option>
                        <option value="ELIGIBLE">Eligible</option>
                        <option value="INELIGIBLE">Ineligible</option>
                    </select>
                </label>
            )}

            {type === "award-summary" && (
                <>
                    <label className="nallabid-report-field">
                        <span>From</span>
                        <input type="date" value={params.date_from ?? ""} onChange={(event) => onChange("date_from", event.target.value)} />
                    </label>

                    <label className="nallabid-report-field">
                        <span>To</span>
                        <input type="date" value={params.date_to ?? ""} onChange={(event) => onChange("date_to", event.target.value)} />
                    </label>

                    <label className="nallabid-report-field">
                        <span>Status</span>
                        <select value={params.status ?? ""} onChange={(event) => onChange("status", event.target.value)}>
                            <option value="">All</option>
                            <option value="AWARDED">Awarded</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </label>
                </>
            )}
        </div>
    );
}


function ReportDetail() {
    const { reportType } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const role = getCurrentUser()?.role;
    const basePath = reportsBasePath(role);
    const definition = REPORT_TYPES[reportType];

    // Each result remembers which request produced it, so a different report
    // type's rows are never rendered with this report's columns.
    const [result, setResult] = useState({ key: null, data: null, error: null });
    const [reloadCount, setReloadCount] = useState(0);
    const [downloading, setDownloading] = useState("");
    const [downloadError, setDownloadError] = useState("");

    const params = useMemo(() => {
        const values = {};

        (FILTER_KEYS[reportType] ?? []).forEach((key) => {
            if (searchParams.get(key)) {
                values[key] = searchParams.get(key);
            }
        });

        return values;
    }, [reportType, searchParams]);

    const requestKey = `${reportType}?${new URLSearchParams(params)}#${reloadCount}`;

    useEffect(() => {
        if (!definition) {
            return undefined;
        }

        let active = true;

        getReport(reportType, params)
            .then((data) => active && setResult({ key: requestKey, data, error: null }))
            .catch((error) => active && setResult({ key: requestKey, data: null, error }));

        // Ignore responses from superseded requests (filters changed meanwhile).
        return () => {
            active = false;
        };
    }, [definition, reportType, params, requestKey]);

    const isCurrent = result.key === requestKey;
    const loading = !isCurrent;
    const report = isCurrent ? result.data : null;
    const error = isCurrent ? result.error : null;

    // While a filter change reloads, keep the last dropdown options of the same report.
    const filterSource = report ?? (result.key?.startsWith(`${reportType}?`) ? result.data : null);

    function retryReport() {
        setReloadCount((count) => count + 1);
    }

    function updateFilter(key, value) {
        const next = new URLSearchParams(searchParams);

        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }

        setSearchParams(next, { replace: true });
    }

    async function handleDownload(format) {
        setDownloading(format);
        setDownloadError("");

        try {
            await downloadReport(reportType, format, params);
        } catch (requestError) {
            setDownloadError(requestError.message);
        } finally {
            setDownloading("");
        }
    }

    if (!definition) {
        return (
            <div className="nallabid-reports-page">
                <ErrorMessage
                    error={{ status: 404, message: "This report does not exist." }}
                    backTo={basePath}
                    backLabel="Back to Reports"
                />
            </div>
        );
    }

    const table = TABLES[reportType];
    const rows = report?.rows ?? [];
    const exportBlocked = reportType === "rfq-comparison" && !params.rfq_id;

    return (
        <div className="nallabid-reports-page">
            <Link to={basePath} className="nallabid-report-back">
                <i className="bi bi-arrow-left"></i>
                Back to Reports
            </Link>

            <header className="nallabid-report-header">
                <div>
                    <h1>{definition.title}</h1>
                    <p>{definition.description}</p>
                </div>

                <div className="nallabid-report-header-actions">
                    <button
                        type="button"
                        className="nallabid-report-button"
                        disabled={exportBlocked || Boolean(downloading) || Boolean(error)}
                        onClick={() => handleDownload("pdf")}
                        title={exportBlocked ? "Select an RFQ first" : undefined}
                    >
                        <i className={downloading === "pdf" ? "bi bi-hourglass-split" : "bi bi-file-earmark-pdf"}></i>
                        Download PDF
                    </button>

                    <button
                        type="button"
                        className="nallabid-report-button"
                        disabled={exportBlocked || Boolean(downloading) || Boolean(error)}
                        onClick={() => handleDownload("csv")}
                        title={exportBlocked ? "Select an RFQ first" : undefined}
                    >
                        <i className={downloading === "csv" ? "bi bi-hourglass-split" : "bi bi-filetype-csv"}></i>
                        Export CSV
                    </button>
                </div>
            </header>

            {downloadError && (
                <div className="nallabid-report-alert" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    {downloadError}
                </div>
            )}

            {error ? (
                <section className="nallabid-report-panel">
                    <ErrorMessage error={error} onRetry={retryReport} backTo={basePath} backLabel="Back to Reports" />
                </section>
            ) : (
                <>
                    <Filters type={reportType} report={filterSource} params={params} onChange={updateFilter} />

                    {loading ? (
                        <section className="nallabid-report-panel">
                            <Loading message="Loading report..." />
                        </section>
                    ) : reportType === "rfq-comparison" && !params.rfq_id ? (
                        <section className="nallabid-report-panel">
                            <EmptyState
                                icon="bi-layout-three-columns"
                                title="Select an RFQ"
                                message={
                                    report?.rfq_options?.length
                                        ? "Choose an RFQ above to compare its quotations."
                                        : "You have no RFQs yet."
                                }
                            />
                        </section>
                    ) : (
                        <div>
                            <SummaryTiles tiles={summaryTilesFor(reportType, report.summary)} />

                            {reportType === "supplier-eligibility" && rows.length > 0 && (
                                <section className="nallabid-report-panel">
                                    <header className="nallabid-report-panel-head">
                                        <h2>Failure reasons</h2>
                                        <p>How many evaluated quotations failed each requirement.</p>
                                    </header>
                                    <BarList
                                        items={report.summary.failure_reason_counts.map((item) => ({
                                            label: item.reason,
                                            value: item.count,
                                            tone: "critical"
                                        }))}
                                        emptyMessage="No failures"
                                    />
                                </section>
                            )}

                            {reportType === "award-summary" && rows.length > 0 && (
                                <div className="nallabid-report-charts">
                                    <section className="nallabid-report-panel">
                                        <header className="nallabid-report-panel-head">
                                            <h2>Awards by supplier</h2>
                                            <p>Total awarded value per supplier.</p>
                                        </header>
                                        <BarList
                                            items={report.summary.awards_by_supplier.map((item) => ({
                                                label: `${item.supplier_name} (${item.award_count})`,
                                                value: item.total_value
                                            }))}
                                            formatValue={formatLKR}
                                        />
                                    </section>

                                    <section className="nallabid-report-panel">
                                        <header className="nallabid-report-panel-head">
                                            <h2>Awards by month</h2>
                                            <p>Total awarded value per month.</p>
                                        </header>
                                        <BarList
                                            items={report.summary.awards_by_month.map((item) => ({
                                                label: `${item.month} (${item.award_count})`,
                                                value: item.total_value
                                            }))}
                                            formatValue={formatLKR}
                                        />
                                    </section>
                                </div>
                            )}

                            <section className="nallabid-report-panel">
                                <header className="nallabid-report-panel-head">
                                    <h2>Report data</h2>
                                    <p>
                                        {Object.entries(report.filters)
                                            .map(([key, value]) => `${key}: ${value}`)
                                            .join(" · ")}
                                    </p>
                                </header>

                                {rows.length === 0 ? (
                                    <EmptyState
                                        icon="bi-inbox"
                                        title="No records"
                                        message="Nothing matches the selected filters yet."
                                    />
                                ) : (
                                    <div className="nallabid-report-table-wrap">
                                        <table className="nallabid-report-table">
                                            <thead>
                                                <tr>
                                                    {table.columns.map(([label, , numeric]) => (
                                                        <th key={label} className={numeric ? "nallabid-report-num" : undefined}>
                                                            {label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row) => (
                                                    <tr key={table.rowKey(row)}>
                                                        {table.columns.map(([label, render, numeric]) => (
                                                            <td key={label} className={numeric ? "nallabid-report-num" : undefined}>
                                                                {render(row)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


export default ReportDetail;
