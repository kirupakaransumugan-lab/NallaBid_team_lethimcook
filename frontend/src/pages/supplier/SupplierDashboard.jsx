import { Link } from "react-router-dom";
import { getCurrentUser } from "../../services/authService";
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
                {metrics.map(([label, icon, value, note, path]) => (
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
                    <SupplierEmptyState icon="file-earmark-text" title="No RFQs available">New opportunities will appear here when available.</SupplierEmptyState>
                </section>
                <section className="supplierCard supplierPanel">
                    <header className="supplierPanelHeading"><div><h2>Quotation Status Overview</h2><p>Follow your quotations through each stage.</p></div><Link to="/supplier/quotations">View all <i className="bi bi-arrow-right" aria-hidden="true" /></Link></header>
                    <div className="supplierStatuses">
                        {[["Submitted", "send"], ["Eligible", "check-circle"], ["Awarded", "trophy"], ["Ineligible", "x-circle"]].map(([label, icon]) => (
                            <div className="supplierStatus" key={label}><span className={`supplierStatusIcon ${label.toLowerCase()}`}><i className={`bi bi-${icon}`} aria-hidden="true" /></span><span>{label}</span><strong aria-label="Not available">—</strong></div>
                        ))}
                    </div>
                </section>
            </div>
            <section className="supplierCard supplierPanel supplierDeadlines">
                <header className="supplierPanelHeading"><div><h2>Upcoming Deadlines</h2><p>Stay on top of RFQ closing dates.</p></div><span className="supplierMetricIcon"><i className="bi bi-calendar3" aria-hidden="true" /></span></header>
                <SupplierEmptyState icon="calendar-check" title="No upcoming deadlines">Upcoming RFQ deadlines will appear here.</SupplierEmptyState>
            </section>
        </div>
    );
}
