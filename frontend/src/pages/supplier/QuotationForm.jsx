import { useState } from "react";
import { Link, useParams } from "react-router-dom";

function QuotationForm() {
    const { rfqId } = useParams();

    const [formData, setFormData] = useState({
        unit_price: "",
        delivery_days: "",
        warranty_months: "",
        notes: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

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
            // Quotation API will be connected when the backend endpoint is ready.
            console.log("RFQ ID:", rfqId);
            console.log("Quotation:", quotationData);
        } catch (requestError) {
            setError(
                requestError.response?.data?.detail ||
                "Unable to submit quotation."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="pageArea">
            <div className="container-fluid px-4 py-4">

                <Link
                    to={`/supplier/rfqs/${rfqId}`}
                    className="text-decoration-none"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to RFQ Details
                </Link>

                <div className="mt-4 mb-4">
                    <h2 className="text-white fw-bold mb-1">
                        Submit Quotation
                    </h2>

                    <p className="text-secondary mb-0">
                        Enter your pricing, delivery and warranty details.
                    </p>
                </div>

                <div className="row">
                    <div className="col-xl-8">

                        <div className="card bg-dark border-secondary">
                            <div className="card-body p-4">

                                {error && (
                                    <div
                                        className="alert alert-danger"
                                        role="alert"
                                    >
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>

                                    <div className="mb-4">
                                        <label
                                            htmlFor="unit_price"
                                            className="form-label text-white"
                                        >
                                            Unit Price
                                        </label>

                                        <input
                                            id="unit_price"
                                            name="unit_price"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            className="form-control"
                                            value={formData.unit_price}
                                            onChange={handleChange}
                                            placeholder="Enter unit price"
                                            required
                                        />
                                    </div>

                                    <div className="row g-3 mb-4">

                                        <div className="col-md-6">
                                            <label
                                                htmlFor="delivery_days"
                                                className="form-label text-white"
                                            >
                                                Delivery Days
                                            </label>

                                            <input
                                                id="delivery_days"
                                                name="delivery_days"
                                                type="number"
                                                min="1"
                                                step="1"
                                                className="form-control"
                                                value={formData.delivery_days}
                                                onChange={handleChange}
                                                placeholder="Enter delivery days"
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label
                                                htmlFor="warranty_months"
                                                className="form-label text-white"
                                            >
                                                Warranty Months
                                            </label>

                                            <input
                                                id="warranty_months"
                                                name="warranty_months"
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="form-control"
                                                value={formData.warranty_months}
                                                onChange={handleChange}
                                                placeholder="Enter warranty months"
                                                required
                                            />
                                        </div>

                                    </div>

                                    <div className="mb-4">
                                        <label
                                            htmlFor="notes"
                                            className="form-label text-white"
                                        >
                                            Notes
                                        </label>

                                        <textarea
                                            id="notes"
                                            name="notes"
                                            className="form-control"
                                            rows="5"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            placeholder="Add optional quotation notes"
                                        />
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">

                                        <Link
                                            to={`/supplier/rfqs/${rfqId}`}
                                            className="btn btn-outline-secondary"
                                        >
                                            Cancel
                                        </Link>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        aria-hidden="true"
                                                    ></span>
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-send me-2"></i>
                                                    Submit Quotation
                                                </>
                                            )}
                                        </button>

                                    </div>

                                </form>

                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}

export default QuotationForm;