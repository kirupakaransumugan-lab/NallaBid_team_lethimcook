import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SupplierEmptyState } from "./SupplierDashboard";
import { getAvailableRFQs } from "../../services/supplierRFQService";
import { formatDate, formatNumber } from "../../utils/format";
import "./supplier.css";

const TABS = [
    { key: "open", label: "Open RFQs", icon: "bi-unlock" },
    { key: "closed", label: "Deadline Passed", icon: "bi-lock" }
];

export default function AvailableRFQs() {
    const [tab, setTab] = useState("open");
    const [rfqsByTab, setRfqsByTab] = useState({ open: [], closed: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Both lists load up front so each tab can show its count.
    useEffect(() => {
        let active = true;

        Promise.all([getAvailableRFQs("open"), getAvailableRFQs("closed")])
            .then(([open, closed]) => active && setRfqsByTab({ open, closed }))
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, []);

    const rfqs = rfqsByTab[tab];
    const isClosedTab = tab === "closed";

    return (
        <div className="supplierPage">
            <header className="supplierPageHeading">
                <div><p className="supplierEyebrow">Supplier Workspace</p><h1>Available RFQs</h1><p>Explore requests and find opportunities for your business.</p></div>
                <Link className="supplierTextLink" to="/supplier"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to Overview</Link>
            </header>

            <div className="supplierTabs" role="tablist" aria-label="RFQ status">
                {TABS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === item.key}
                        className={`supplierTab ${item.key} ${tab === item.key ? "active" : ""}`}
                        onClick={() => setTab(item.key)}
                    >
                        <i className={`bi ${item.icon}`} aria-hidden="true" /> {item.label}
                        <span className="supplierTabCount">{loading ? "…" : rfqsByTab[item.key].length}</span>
                    </button>
                ))}
            </div>

            <section className="supplierCard supplierPanel">
                <header className="supplierPanelHeading">
                    <div>
                        <h2>{isClosedTab ? "Closed RFQs" : "RFQ Opportunities"}</h2>
                        <p>{isClosedTab ? "These RFQs no longer accept quotations." : "Available requests for quotation."}</p>
                    </div>
                    <span className={`supplierCount ${isClosedTab ? "closed" : ""}`}>{rfqs.length} {isClosedTab ? "closed" : "available"}</span>
                </header>
                {loading ? (
                    <div className="supplierLoading"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading RFQs...</div>
                ) : error ? (
                    <div className="supplierAlert" role="alert">{error}</div>
                ) : rfqs.length === 0 ? (
                    isClosedTab
                        ? <SupplierEmptyState icon="lock" title="No closed RFQs">RFQs whose deadline has passed will appear here.</SupplierEmptyState>
                        : <SupplierEmptyState icon="file-earmark-text" title="No RFQs available">Available RFQs will appear here.</SupplierEmptyState>
                ) : (
                    <div className="supplierRfqList">
                        {rfqs.map((rfq) => (
                            <article className={`supplierRfqItem ${isClosedTab ? "expired" : ""}`} key={rfq.id}>
                                <div className="supplierRfqItemMain">
                                    <span className="supplierRfqNumber">{rfq.rfq_number}</span>
                                    <h3>{rfq.product_name}</h3>
                                    <p>{rfq.description || "No additional description provided."}</p>
                                    <div className="supplierRfqMeta">
                                        <span><i className="bi bi-box-seam" aria-hidden="true" /> {formatNumber(rfq.quantity)} units</span>
                                        <span><i className="bi bi-truck" aria-hidden="true" /> Within {rfq.max_delivery_days} days</span>
                                        <span><i className="bi bi-shield-check" aria-hidden="true" /> {rfq.min_warranty_months} months warranty</span>
                                        <span><i className="bi bi-calendar3" aria-hidden="true" /> {isClosedTab ? "Closed" : "Closes"} {formatDate(rfq.deadline)}</span>
                                    </div>
                                </div>
                                <div className="supplierRfqItemAction">
                                    {isClosedTab ? (
                                        <>
                                            <span className="supplierExpired"><i className="bi bi-clock-history" aria-hidden="true" /> Deadline passed</span>
                                            {rfq.has_submitted
                                                ? <Link className="supplierTextLink" to="/supplier/quotations">View my quotation <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
                                                : <span className="supplierMissed">No quotation submitted</span>}
                                        </>
                                    ) : (
                                        <>
                                            {rfq.has_submitted && <span className="supplierSubmitted">Quotation submitted</span>}
                                            <Link className="supplierButton" to={`/supplier/rfqs/${rfq.id}`}>View RFQ <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
                                        </>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
