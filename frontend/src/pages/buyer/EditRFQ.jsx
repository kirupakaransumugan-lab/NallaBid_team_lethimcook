import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import createRfqIllustration from "../../assets/create-rfq-illustration.png";
import { getRFQ, updateRFQ } from "../../services/rfqService";
import "./CreateRFQ.css";


function toDateTimeLocal(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localTime.toISOString().slice(0, 16);
}


function EditRFQ() {
    const { rfqId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadRFQ() {
            setLoading(true);
            setError("");

            try {
                const rfq = await getRFQ(rfqId);

                if (!active) {
                    return;
                }

                if (!["DRAFT", "OPEN"].includes(rfq.status)) {
                    setError("This RFQ can no longer be edited.");
                    return;
                }

                setFormData({
                    product_name: rfq.product_name ?? "",
                    description: rfq.description ?? "",
                    quantity: String(rfq.quantity ?? ""),
                    max_delivery_days: String(rfq.max_delivery_days ?? ""),
                    min_warranty_months: String(rfq.min_warranty_months ?? ""),
                    deadline: toDateTimeLocal(rfq.deadline)
                });
            } catch (err) {
                if (active) {
                    setError(err.message);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadRFQ();
        return () => {
            active = false;
        };
    }, [rfqId]);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaving(true);

        try {
            await updateRFQ(rfqId, {
                product_name: formData.product_name.trim(),
                description: formData.description.trim() || null,
                quantity: Number(formData.quantity),
                max_delivery_days: Number(formData.max_delivery_days),
                min_warranty_months: Number(formData.min_warranty_months),
                deadline: new Date(formData.deadline).toISOString()
            });
            navigate(`/rfqs/${rfqId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="create-rfq-page"><p>Loading RFQ...</p></div>;
    }

    if (!formData) {
        return (
            <div className="create-rfq-page">
                <div className="rfq-error">{error || "RFQ could not be loaded."}</div>
                <button type="button" className="back-button" onClick={() => navigate("/rfqs")}>
                    <i className="bi bi-arrow-left"></i>
                    Back to My RFQs
                </button>
            </div>
        );
    }

    return (
        <div className="create-rfq-page">
            <div className="create-rfq-header">
                <div>
                    <button type="button" className="back-button" onClick={() => navigate(`/rfqs/${rfqId}`)}>
                        <i className="bi bi-arrow-left"></i>
                        Back to RFQ
                    </button>
                    <h1>Edit RFQ</h1>
                    <p>Update the request before a supplier submits a quotation.</p>
                </div>
            </div>

            <div className="create-rfq-layout">
                <form className="rfq-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">
                            <div className="form-section-icon"><i className="bi bi-pencil-square"></i></div>
                            <div>
                                <h2>RFQ Details</h2>
                                <p>These requirements will be visible to suppliers.</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="product_name">Product Name</label>
                            <input id="product_name" name="product_name" type="text" value={formData.product_name} onChange={handleChange} maxLength="150" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="5" />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="quantity">Quantity</label>
                                <input id="quantity" name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="max_delivery_days">Maximum Delivery Days</label>
                                <input id="max_delivery_days" name="max_delivery_days" type="number" min="1" value={formData.max_delivery_days} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="min_warranty_months">Minimum Warranty</label>
                                <input id="min_warranty_months" name="min_warranty_months" type="number" min="0" value={formData.min_warranty_months} onChange={handleChange} required />
                                <small>Warranty period in months.</small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="deadline">Quotation Deadline</label>
                                <input id="deadline" name="deadline" type="datetime-local" value={formData.deadline} onChange={handleChange} required />
                                <small>Suppliers must submit quotations before this deadline.</small>
                            </div>
                        </div>
                    </div>

                    {error && <div className="rfq-error">{error}</div>}

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={() => navigate(`/rfqs/${rfqId}`)}>Cancel</button>
                        <button type="submit" className="create-button" disabled={saving}>
                            <i className={saving ? "bi bi-hourglass-split" : "bi bi-check-lg"}></i>
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>

                <aside className="create-rfq-aside">
                    <img src={createRfqIllustration} alt="" className="create-rfq-illustration" />
                    <h3>Editing rules</h3>
                    <ul className="create-rfq-tips">
                        <li><i className="bi bi-check-circle-fill"></i> You can change all details before the first quotation.</li>
                        <li><i className="bi bi-calendar-plus"></i> After a quotation arrives, only an extended deadline is allowed.</li>
                        <li><i className="bi bi-shield-check"></i> This keeps supplier quotations matched to the same requirements.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}

export default EditRFQ;
