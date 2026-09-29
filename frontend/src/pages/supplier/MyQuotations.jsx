import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SupplierEmptyState } from "./SupplierDashboard";
import { getMyQuotations } from "../../services/supplierRFQService";
import { formatDate, formatLKR } from "../../utils/format";
import "./supplier.css";

const STATUS_STYLES = {
    AWARDED: "awarded",
    ELIGIBLE: "eligible",
    INELIGIBLE: "ineligible",
    SUBMITTED: "submitted"
};

function MyQuotations() {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        getMyQuotations()
            .then((data) => active && setQuotations(data))
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="supplierPage supplierQuotations">
            <header className="supplierPageHeading">
                <div><p className="supplierEyebrow">Supplier Workspace</p><h1>My Quotations</h1><p>View and track the quotations you have submitted.</p></div>
                <Link className="supplierTextLink" to="/supplier"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to Overview</Link>
            </header>
            <section className="supplierCard supplierPanel">
                <header className="supplierPanelHeading"><div><h2>Submitted Quotations</h2><p>Status of every quotation you have sent to buyers.</p></div><span className="supplierCount">{quotations.length} submitted</span></header>
                {loading ? (
                    <div className="supplierLoading"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading your quotations...</div>
                ) : error ? (
                    <div className="supplierAlert" role="alert">{error}</div>
                ) : quotations.length === 0 ? (
                    <SupplierEmptyState icon="file-earmark-check" title="No quotations submitted">Your submitted quotations will appear here.</SupplierEmptyState>
                ) : (
                    <div className="table-responsive quotationTable">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th scope="col">Quotation</th>
                                    <th scope="col">RFQ</th>
                                    <th scope="col">Unit Price</th>
                                    <th scope="col">Total Price</th>
                                    <th scope="col">Delivery</th>
                                    <th scope="col">Warranty</th>
                                    <th scope="col">Status</th>
                                    <th scope="col"><span className="visually-hidden">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotations.map((quotation) => (
                                    <tr key={quotation.id}>
                                        <td className="quotationNumber">{quotation.quotation_number}</td>
                                        <td>
                                            <span className="supplierRfqNumber">{quotation.rfq_number}</span>
                                            <strong className="quotationProduct">{quotation.product_name}</strong>
                                        </td>
                                        <td>{formatLKR(quotation.unit_price)}</td>
                                        <td><strong>{formatLKR(quotation.total_price)}</strong></td>
                                        <td><i className="bi bi-truck" aria-hidden="true" /> {quotation.delivery_days} days</td>
                                        <td><i className="bi bi-shield-check" aria-hidden="true" /> {quotation.warranty_months} months</td>
                                        <td>
                                            <span className={`quotationStatus ${STATUS_STYLES[quotation.status] ?? ""}`}>{quotation.status}</span>
                                        </td>
                                        <td className="text-end">
                                            {quotation.rfq_status === "OPEN" ? (
                                                <Link className="quotationViewLink" to={`/supplier/rfqs/${quotation.rfq_id}`}>View RFQ <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
                                            ) : (
                                                <span className="quotationClosed">{quotation.rfq_status} · {formatDate(quotation.deadline)}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default MyQuotations;
