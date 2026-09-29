import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../../services/authService";
import { getAvailableRFQs, getMyQuotations } from "../../services/supplierRFQService";
import { formatDate } from "../../utils/format";
import "./supplier.css";

const metrics = [
    ["Available RFQs", "file-earmark-text", "0", "Open opportunities", "/supplier/rfqs"],
    ["My Quotations", "file-earmark-check", "—", "Your submitted quotations", "/supplier/quotations"],
    ["Pending Evaluation", "hourglass-split", "—", "Awaiting buyer review"],
    ["Awards", "trophy", "—", "Your successful bids"],
];

export function SupplierEmptyState({ icon, title, children }) {
    return <div className="supplierEmpty">
        <span className="supplierEmptyIcon"><i className={`bi bi-${icon}`} aria-hidden="true" /></span>
        <h3>{title}</h3><p>{children}</p>
    </div>;
}

export default function SupplierDashboard() {
    const name = getCurrentUser()?.full_name;
    const [rfqs, setRfqs] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            const [rfqResult, quotationResult] = await Promise.allSettled([
                getAvailableRFQs(),
                getMyQuotations(),
            ]);

            if (!active) return;
            if (rfqResult.status === "fulfilled") setRfqs(rfqResult.value);
            // A supplier can browse opportunities before completing a profile;
            // in that case the profile-required quotation request simply has no data.
            if (quotationResult.status === "fulfilled") setQuotations(quotationResult.value);
            setLoading(false);
        }

        loadDashboard();
        return () => {
            active = false;
        };
    }, []);

    const statusCounts = useMemo(() => quotations.reduce((counts, quotation) => {
        counts[quotation.status] = (counts[quotation.status] || 0) + 1;
        return counts;
    }, {}), [quotations]);

    const dashboardMetrics = metrics.map(([label, icon, , note, path]) => {
        const liveValue = {
            "Available RFQs": rfqs.length,
            "My Quotations": quotations.length,
            "Pending Evaluation": statusCounts.SUBMITTED || 0,
            Awards: statusCounts.AWARDED || 0,
        }[label];

        return [label, icon, loading ? "…" : liveValue, note, path];
    });

    return (
        <div className="supplierPage">
            <header className="supplierPageHeading">
                <div><p className="supplierEyebrow">Supplier Overview</p>
                    <h1>Welcome Back{name ? `, ${name}` : ""}!</h1>
                    <p>Discover opportunities and keep track of your quotations.</p>
                </div>
                <Link className="supplierButton" to="/supplier/rfqs">View Available RFQs <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
            </header>
            <div className="supplierMetrics">
                {dashboardMetrics.map(([label, icon, value, note, path]) => (
                    <section className="supplierCard supplierMetric" key={label} aria-label={label}>
                        <div className="supplierMetricTop"><h2>{label}</h2><span className="supplierMetricIcon"><i className={`bi bi-${icon}`} aria-hidden="true" /></span></div>
                        <strong aria-label={value === "—" ? "Not available" : undefined}>{value}</strong>
                        <p>{path ? <Link to={path}>{note} <i className="bi bi-arrow-up-right" aria-hidden="true" /></Link> : note}</p>
                    </section>
                ))}
            </div>
            <div className="supplierOverviewGrid">
                <section className="supplierCard supplierPanel">
                    <header className="supplierPanelHeading"><div><h2>Latest RFQ Opportunities</h2><p>Find your next opportunity to supply.</p></div><Link to="/supplier/rfqs">View all <i className="bi bi-arrow-right" aria-hidden="true" /></Link></header>
                    {loading ? (
                        <div className="supplierLoading"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading opportunities...</div>
                    ) : rfqs.length === 0 ? (
                        <SupplierEmptyState icon="file-earmark-text" title="No RFQs available">New opportunities will appear here when available.</SupplierEmptyState>
                    ) : (
                        <div className="supplierOpportunityPreview">
                            {rfqs.slice(0, 3).map((rfq) => (
                                <Link key={rfq.id} className="supplierOpportunityRow" to={`/supplier/rfqs/${rfq.id}`}>
                                    <span><strong>{rfq.product_name}</strong><small>{rfq.rfq_number} · {rfq.quantity} units</small></span>
                                    <span>Closes {formatDate(rfq.deadline)} <i className="bi bi-arrow-right" aria-hidden="true" /></span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
                <section className="supplierCard supplierPanel">
                    <header className="supplierPanelHeading"><div><h2>Quotation Status Overview</h2><p>Follow your quotations through each stage.</p></div><Link to="/supplier/quotations">View all <i className="bi bi-arrow-right" aria-hidden="true" /></Link></header>
                    <div className="supplierStatuses">
                        {[["Submitted", "send"], ["Eligible", "check-circle"], ["Awarded", "trophy"], ["Ineligible", "x-circle"]].map(([label, icon]) => (
                            <div className="supplierStatus" key={label}>
                                <span className={`supplierStatusIcon ${label.toLowerCase()}`}><i className={`bi bi-${icon}`} aria-hidden="true" /></span>
                                <span>{label}</span>
                                <strong>{loading ? "…" : statusCounts[label.toUpperCase()] || 0}</strong>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            <section className="supplierCard supplierPanel supplierDeadlines">
                <header className="supplierPanelHeading"><div><h2>Upcoming Deadlines</h2><p>Stay on top of RFQ closing dates.</p></div><span className="supplierMetricIcon"><i className="bi bi-calendar3" aria-hidden="true" /></span></header>
                {loading ? (
                    <div className="supplierLoading"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading deadlines...</div>
                ) : rfqs.length === 0 ? (
                    <SupplierEmptyState icon="calendar-check" title="No upcoming deadlines">Upcoming RFQ deadlines will appear here.</SupplierEmptyState>
                ) : (
                    <div className="supplierDeadlineList">
                        {rfqs.slice(0, 5).map((rfq) => <Link key={rfq.id} to={`/supplier/rfqs/${rfq.id}`}><strong>{rfq.product_name}</strong><span>{rfq.rfq_number} · closes {formatDate(rfq.deadline)}</span></Link>)}
                    </div>
                )}
            </section>
        </div>
    );
}
