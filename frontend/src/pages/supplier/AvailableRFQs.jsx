import { Link } from "react-router-dom";
import { SupplierEmptyState } from "./SupplierDashboard";
import "./supplier.css";

export default function AvailableRFQs() {
    return (
        <div className="supplierPage">
            <header className="supplierPageHeading">
                <div><p className="supplierEyebrow">Supplier Workspace</p><h1>Available RFQs</h1><p>Explore requests and find opportunities for your business.</p></div>
                <Link className="supplierTextLink" to="/supplier"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to Overview</Link>
            </header>
            <section className="supplierCard supplierPanel">
                <header className="supplierPanelHeading"><div><h2>RFQ Opportunities</h2><p>Available requests for quotation.</p></div><span className="supplierCount">0 available</span></header>
                <SupplierEmptyState icon="file-earmark-text" title="No RFQs available">Available RFQs will appear here.</SupplierEmptyState>
            </section>
        </div>
    );
}
