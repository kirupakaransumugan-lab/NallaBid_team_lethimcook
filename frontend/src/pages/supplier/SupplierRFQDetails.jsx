import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SupplierEmptyState } from "./SupplierDashboard";
import { QuotationFormPanel } from "./QuotationForm";
import { getMyQuotations, getSupplierRFQ } from "../../services/supplierRFQService";
import { formatDate, formatLKR, formatNumber } from "../../utils/format";
import "./supplier.css";
import "./SupplierRFQDetails.css";

function SubmittedQuotationPanel({ quotation }) {
    return (
        <section className="supplierCard supplierPanel quotationFormPanel">
            <header className="supplierPanelHeading">
                <div><h2>Your Quotation</h2><p>You have already submitted a quotation for this RFQ.</p></div>
                <span className={`quotationStatus ${quotation ? quotation.status.toLowerCase() : "submitted"}`}>{quotation?.status ?? "SUBMITTED"}</span>
            </header>
            {quotation ? (
                <dl className="quotationSummary">
                    <div><dt>Quotation</dt><dd>{quotation.quotation_number}</dd></div>
                    <div><dt>Unit price</dt><dd>{formatLKR(quotation.unit_price)}</dd></div>
                    <div><dt>Total price</dt><dd><strong>{formatLKR(quotation.total_price)}</strong></dd></div>
                    <div><dt>Delivery</dt><dd>{quotation.delivery_days} days</dd></div>
                    <div><dt>Warranty</dt><dd>{quotation.warranty_months} months</dd></div>
                </dl>
            ) : (
                <div className="supplierLoading">Quotation details are not available.</div>
            )}
            <div className="quotationPanelFooter">
                <Link className="supplierTextLink" to="/supplier/quotations">View all my quotations <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
            </div>
        </section>
    );
}

function SupplierRFQDetails() {
    const { rfqId } = useParams();

    const [rfq, setRfq] = useState(null);
    const [myQuotation, setMyQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRFQ = useCallback(() => Promise.all([getSupplierRFQ(rfqId), getMyQuotations()])
        .then(([rfqData, quotations]) => {
            setRfq(rfqData);
            setMyQuotation(quotations.find((quotation) => String(quotation.rfq_id) === String(rfqId)) ?? null);
        }), [rfqId]);

    useEffect(() => {
        let active = true;

        loadRFQ()
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [loadRFQ]);

    const refreshAfterSubmit = () => {
        loadRFQ().catch((requestError) => setError(requestError.message));
    };

    const backLink = <Link className="supplierTextLink" to="/supplier/rfqs"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to Available RFQs</Link>;

    if (loading) {
        return <div className="supplierPage"><div className="supplierLoading"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading RFQ details...</div></div>;
    }

    if (error || !rfq) {
        return (
            <div className="supplierPage">
                <header className="supplierPageHeading"><div><p className="supplierEyebrow">Supplier Workspace</p><h1>RFQ Details</h1></div>{backLink}</header>
                <section className="supplierCard supplierPanel">
                    {error ? <div className="supplierAlert" role="alert">{error}</div> : (
                        <SupplierEmptyState icon="file-earmark-text" title="RFQ details unavailable">RFQ information will appear here when it is available.</SupplierEmptyState>
                    )}
                </section>
            </div>
        );
    }

    const requirements = [
        ["box-seam", "Quantity", `${formatNumber(rfq.quantity)} units`],
        ["truck", "Maximum Delivery", `${rfq.max_delivery_days} days`],
        ["shield-check", "Minimum Warranty", `${rfq.min_warranty_months} months`],
        ["calendar3", "Deadline", formatDate(rfq.deadline)],
    ];

    return (
        <div className="supplierPage supplierRfqDetail">
            <header className="supplierPageHeading">
                <div><p className="supplierEyebrow">{rfq.rfq_number}</p><h1>{rfq.product_name}</h1><p>Review the requirements and submit your quotation.</p></div>
                {backLink}
            </header>

            <div className="rfqSplit">
                <section className="supplierCard supplierPanel">
                    <header className="supplierPanelHeading">
                        <div><h2>RFQ Requirements</h2><p>Your quotation must meet these to be eligible.</p></div>
                        <span className="supplierCount">{rfq.status}</span>
                    </header>
                    <div className="rfqRequirementGrid">
                        {requirements.map(([icon, label, value]) => (
                            <div className="rfqRequirement" key={label}>
                                <span className="supplierStatusIcon"><i className={`bi bi-${icon}`} aria-hidden="true" /></span>
                                <div><small>{label}</small><strong>{value}</strong></div>
                            </div>
                        ))}
                    </div>
                    <div className="rfqDescription">
                        <h3>Description</h3>
                        <p>{rfq.description || "No additional description provided."}</p>
                    </div>
                </section>

                {rfq.has_submitted || myQuotation ? (
                    <SubmittedQuotationPanel quotation={myQuotation} />
                ) : rfq.status === "OPEN" ? (
                    <QuotationFormPanel rfq={rfq} onSubmitted={refreshAfterSubmit} />
                ) : (
                    <section className="supplierCard supplierPanel">
                        <SupplierEmptyState icon="lock" title="Quotations closed">This RFQ is no longer accepting quotations.</SupplierEmptyState>
                    </section>
                )}
            </div>
        </div>
    );
}

export default SupplierRFQDetails;
