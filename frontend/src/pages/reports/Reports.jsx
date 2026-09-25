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



function ReportCard({ type, basePath }) {
    const report = REPORT_TYPES[type];
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");

    // RFQ comparison is per-RFQ, so its exports need an RFQ picked in the report view.
    const needsRFQ = type === "rfq-comparison";

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
            <div className="nallabid-report-card-icon">
                <i className={`bi ${report.icon}`}></i>
            </div>

            <h3>{report.title}</h3>
            <p>{report.description}</p>

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
                    className="nallabid-report-button"
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
                <SummaryCard icon="bi-file-earmark-check" tone="primary" label="Total Quotations" value={formatNumber(dashboard.total_quotations)} />
                <SummaryCard icon="bi-shield-check" tone="good" label="Eligible Quotations" value={formatNumber(dashboard.eligible_quotations)} />
                <SummaryCard icon="bi-trophy" tone="warning" label="Awards" value={formatNumber(dashboard.total_awards)} />
                <SummaryCard icon="bi-cash-stack" tone="primary" label="Awarded Value" value={formatLKR(dashboard.total_awarded_value)} />
            </div>

            <div className="nallabid-report-charts">
                <section className="nallabid-report-panel">
                    <header className="nallabid-report-panel-head">
                        <h2>RFQ Status</h2>
                        <p>How many of your RFQs are in each stage.</p>
                    </header>
                    <BarList items={dashboard.rfq_status_distribution} emptyMessage="No RFQs yet" />
                </section>

                <section className="nallabid-report-panel">
                    <header className="nallabid-report-panel-head">
                        <h2>Quotation Trend</h2>
                        <p>Quotations received per month, last 12 months.</p>
                    </header>
                    <ColumnChart
                        items={dashboard.monthly_quotation_count}
                        seriesLabel="Quotations"
                        emptyMessage="No quotations in the last 12 months"
                    />
                </section>

                <section className="nallabid-report-panel">
                    <header className="nallabid-report-panel-head">
                        <h2>Eligibility Analysis</h2>
                        <p>Evaluation outcome of quotations on your RFQs.</p>
                    </header>
                    <BarList
                        items={dashboard.eligibility_distribution.map((item) => ({
                            ...item,
                            ...ELIGIBILITY_TONES[item.label]
                        }))}
                        emptyMessage="No quotations yet"
                    />
                </section>

                <section className="nallabid-report-panel">
                    <header className="nallabid-report-panel-head">
                        <h2>Award Analysis</h2>
                        <p>Total awarded value by supplier.</p>
                    </header>
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

            <h2 className="nallabid-report-section-title">Reports</h2>

            <div className="nallabid-report-cards">
                {reportTypes.map((type) => (
                    <ReportCard key={type} type={type} basePath={basePath} />
                ))}
            </div>
        </div>
    );
}


export default Reports;
