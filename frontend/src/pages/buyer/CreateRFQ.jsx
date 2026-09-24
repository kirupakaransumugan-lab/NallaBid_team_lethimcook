import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./CreateRFQ.css";

function CreateRFQ() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        product_name: "",
        description: "",
        quantity: "",
        max_delivery_days: "",
        min_warranty_months: "",
        deadline: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("access_token");

            const response = await fetch("http://127.0.0.1:8000/api/rfqs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_name: formData.product_name,
                    description: formData.description,
                    quantity: Number(formData.quantity),
                    max_delivery_days: Number(formData.max_delivery_days),
                    min_warranty_months: Number(
                        formData.min_warranty_months
                    ),
                    deadline: new Date(formData.deadline).toISOString()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to create RFQ."
                );
            }

            navigate("/buyer/rfqs");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-rfq-page">

            <div className="create-rfq-header">
                <div>
                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate("/buyer")}
                    >
                        ← Back
                    </button>

                    <h1>Create New RFQ</h1>

                    <p>
                        Create a procurement request and invite suppliers
                        to submit quotations.
                    </p>
                </div>
            </div>

            <form
                className="rfq-form"
                onSubmit={handleSubmit}
            >

                <div className="form-section">
                    <h2>RFQ Details</h2>

                    <div className="form-group">
                        <label htmlFor="product_name">
                            Product Name
                        </label>

                        <input
                            id="product_name"
                            name="product_name"
                            type="text"
                            placeholder="e.g. Office Laptops"
                            value={formData.product_name}
                            onChange={handleChange}
                            maxLength="150"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            placeholder="Describe the product requirements..."
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                        />
                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label htmlFor="quantity">
                                Quantity
                            </label>

                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="1"
                                placeholder="100"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="max_delivery_days">
                                Maximum Delivery Days
                            </label>

                            <input
                                id="max_delivery_days"
                                name="max_delivery_days"
                                type="number"
                                min="1"
                                placeholder="30"
                                value={formData.max_delivery_days}
                                onChange={handleChange}
                                required
                            />
                        </div>

                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label htmlFor="min_warranty_months">
                                Minimum Warranty
                            </label>

                            <input
                                id="min_warranty_months"
                                name="min_warranty_months"
                                type="number"
                                min="0"
                                placeholder="12"
                                value={formData.min_warranty_months}
                                onChange={handleChange}
                                required
                            />

                            <small>
                                Warranty period in months.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="deadline">
                                Quotation Deadline
                            </label>

                            <input
                                id="deadline"
                                name="deadline"
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={handleChange}
                                required
                            />

                            <small>
                                Suppliers must submit quotations before this
                                deadline.
                            </small>
                        </div>

                    </div>
                </div>

                {error && (
                    <div className="rfq-error">
                        {error}
                    </div>
                )}

                <div className="form-actions">

                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate("/buyer")}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="create-button"
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create RFQ"}
                    </button>

                </div>

            </form>
        </div>
    );
}

export default CreateRFQ;