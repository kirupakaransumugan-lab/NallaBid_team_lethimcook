import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { createQuotation } from "../../services/supplierRFQService";
import { formatLKR, formatNumber } from "../../utils/format";
import "./supplier.css";
import "./SupplierRFQDetails.css";

const EMPTY_FORM = {
    unit_price: "",
    delivery_days: "",
    warranty_months: "",
    notes: "",
};


// Live feedback shown beside the inputs while the supplier types.
// Returns a list of { field, ok, message } entries.
function getRequirementHints(formData, rfq) {
    // TODO(human): compare formData against the RFQ's requirements.
    void formData;
    void rfq;
    return [];
}


export function QuotationFormPanel({ rfq, onSubmitted }) {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const unitPrice = Number(formData.unit_price);
    const estimatedTotal = unitPrice > 0 ? unitPrice * rfq.quantity : null;
    const hints = getRequirementHints(formData, rfq);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const quotationData = {
            unit_price: Number(formData.unit_price),
            delivery_days: Number(formData.delivery_days),
            warranty_months: Number(formData.warranty_months),
            notes: formData.notes.trim() || null,
        };

        if (
            quotationData.unit_price <= 0 ||
            quotationData.delivery_days <= 0 ||
            quotationData.warranty_months < 0
        ) {
            setError("Please enter valid quotation details.");
            return;
        }

        setSubmitting(true);

        try {
            await createQuotation(rfq.id, quotationData);
            setFormData(EMPTY_FORM);
            onSubmitted();
        } catch (requestError) {
            setError(requestError.message || "Unable to submit quotation.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="supplierCard supplierPanel quotationFormPanel">
            <header className="supplierPanelHeading">
                <div><h2>Submit Quotation</h2><p>Enter your pricing, delivery and warranty details.</p></div>
                <span className="supplierMetricIcon"><i className="bi bi-file-earmark-plus" aria-hidden="true" /></span>
            </header>

            <form className="quotationForm" onSubmit={handleSubmit}>
                {error && <div className="supplierAlert" role="alert">{error}</div>}

                <div className="quotationField">
                    <label htmlFor="unit_price">Unit Price</label>
                    <div className="quotationInput">
                        <i className="bi bi-cash-coin" aria-hidden="true" />
                        <input id="unit_price" name="unit_price" type="number" min="0.01" step="0.01" value={formData.unit_price} onChange={handleChange} placeholder="0.00" required />
                        <span className="quotationUnit">LKR / unit</span>
                    </div>
                </div>

                <div className="quotationFormRow">
                    <div className="quotationField">
                        <label htmlFor="delivery_days">Delivery Time</label>
                        <div className="quotationInput">
                            <i className="bi bi-truck" aria-hidden="true" />
                            <input id="delivery_days" name="delivery_days" type="number" min="1" step="1" value={formData.delivery_days} onChange={handleChange} placeholder={String(rfq.max_delivery_days)} required />
                            <span className="quotationUnit">days</span>
                        </div>
                        <small>Maximum {rfq.max_delivery_days} days</small>
                    </div>
                    <div className="quotationField">
                        <label htmlFor="warranty_months">Warranty</label>
                        <div className="quotationInput">
                            <i className="bi bi-shield-check" aria-hidden="true" />
                            <input id="warranty_months" name="warranty_months" type="number" min="0" step="1" value={formData.warranty_months} onChange={handleChange} placeholder={String(rfq.min_warranty_months)} required />
                            <span className="quotationUnit">months</span>
                        </div>
                        <small>Minimum {rfq.min_warranty_months} months</small>
                    </div>
                </div>

                <div className="quotationField">
                    <label htmlFor="notes">Notes <span className="text-muted fw-normal">(optional)</span></label>
                    <div className="quotationInput">
                        <textarea id="notes" name="notes" rows="4" value={formData.notes} onChange={handleChange} placeholder="Brand, model, payment terms or anything the buyer should know" />
                    </div>
                </div>

                {hints.length > 0 && (
                    <ul className="quotationHints">
                        {hints.map((hint) => (
                            <li key={hint.field} className={hint.ok ? "ok" : "warn"}>
                                <i className={`bi ${hint.ok ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`} aria-hidden="true" /> {hint.message}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="quotationTotal">
                    <div>
                        <span>Estimated total</span>
                        <small>{estimatedTotal === null ? `Unit price × ${formatNumber(rfq.quantity)} units` : `${formatLKR(unitPrice)} × ${formatNumber(rfq.quantity)} units`}</small>
                    </div>
                    <strong>{estimatedTotal === null ? "—" : formatLKR(estimatedTotal)}</strong>
                </div>

                <button type="submit" className="supplierButton" disabled={submitting}>
                    {submitting ? (
                        <><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Submitting...</>
                    ) : (
                        <><i className="bi bi-send" aria-hidden="true" /> Submit Quotation</>
                    )}
                </button>
            </form>
        </section>
    );
}


// The form now lives beside the RFQ details, so the old standalone route
// sends suppliers to the split view.
function QuotationForm() {
    const { rfqId } = useParams();
    return <Navigate to={`/supplier/rfqs/${rfqId}`} replace />;
}

export default QuotationForm;
