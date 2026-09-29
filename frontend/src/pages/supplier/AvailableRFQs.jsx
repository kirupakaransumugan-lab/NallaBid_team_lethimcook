import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SupplierEmptyState } from "./SupplierDashboard";
import { getAvailableRFQs } from "../../services/supplierRFQService";
import { formatDate, formatNumber } from "../../utils/format";
import "./supplier.css";

export default function AvailableRFQs() {
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getAvailableRFQs()
            .then((data) => {
                if (active) setRfqs(data);
            })
            .catch((requestError) => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="supplierPage">
            <header className="supplierPageHeading">
                <div><p className="supplierEyebrow">Supplier Workspace</p><h1>Available RFQs</h1><p>Explore requests and find opportunities for your business.</p></div>
                <Link className="supplierTextLink" to="/supplier"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to Overview</Link>
            </header>
            <section className="supplierCard supplierPanel">
                <header className="supplierPanelHeading"><div><h2>RFQ Opportunities</h2><p>Available requests for quotation.</p></div><span className="supplierCount">{rfqs.length} available</span></header>
                {loading ? (
                    <div className="supplierLoading" role="status"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading RFQs...</div>
                ) : error ? (
                    <div className="supplierAlert" role="alert">{error}</div>
                ) : rfqs.length === 0 ? (
                    <SupplierEmptyState icon="file-earmark-text" title="No RFQs available">Available RFQs will appear here.</SupplierEmptyState>
                ) : (
                    <div className="supplierRfqList">
                        {rfqs.map((rfq) => <article className="supplierRfqItem" key={rfq.id}>
                            <div className="supplierRfqItemMain">
                                <span className="supplierRfqNumber">{rfq.rfq_number}</span>
                                <h3>{rfq.product_name}</h3>
                                <div className="supplierRfqMeta">
                                    <span><i className="bi bi-box-seam" aria-hidden="true" /> {formatNumber(rfq.quantity)} units</span>
                                    <span><i className="bi bi-calendar3" aria-hidden="true" /> Closes {formatDate(rfq.deadline)}</span>
                                </div>
                            </div>
                            <div className="supplierRfqItemAction">
                                {rfq.has_submitted && <span className="supplierSubmitted">Quotation submitted</span>}
                                <Link className="supplierButton" to={`/supplier/rfqs/${rfq.id}`}>View RFQ <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
                            </div>
                        </article>)}
                    </div>
                )}
            </section>
        </div>
    );
}
