import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function SupplierRFQDetails() {
    const { rfqId } = useParams();

    const [rfq, setRfq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // RFQ details API will be connected when the backend endpoint is ready.
        setLoading(false);
    }, [rfqId]);

    if (loading) {
        return (
            <main className="pageArea">
                <div className="container-fluid px-4 py-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>

                    <p className="text-secondary mt-3">
                        Loading RFQ details...
                    </p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="pageArea">
                <div className="container-fluid px-4 py-4">
                    <div className="alert alert-danger">
                        {error}
                    </div>
                </div>
            </main>
        );
    }

    if (!rfq) {
        return (
            <main className="pageArea">
                <div className="container-fluid px-4 py-4">

                    <Link
                        to="/supplier"
                        className="text-decoration-none"
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Dashboard
                    </Link>

                    <div className="card bg-dark border-secondary mt-4">
                        <div className="card-body text-center py-5">

                            <i className="bi bi-file-earmark-text fs-1 text-secondary"></i>

                            <h4 className="text-white mt-3">
                                RFQ details unavailable
                            </h4>

                            <p className="text-secondary mb-0">
                                RFQ information will appear here when it is available.
                            </p>

                        </div>
                    </div>

                </div>
            </main>
        );
    }

    return (
        <main className="pageArea">
            <div className="container-fluid px-4 py-4">

                <Link
                    to="/supplier"
                    className="text-decoration-none"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Dashboard
                </Link>

                <div className="d-flex justify-content-between align-items-start mt-4 mb-4">

                    <div>
                        <p className="text-primary mb-2">
                            {rfq.rfq_number}
                        </p>

                        <h2 className="text-white fw-bold mb-2">
                            {rfq.product_name}
                        </h2>

                        <p className="text-secondary mb-0">
                            {rfq.description || "No description provided."}
                        </p>
                    </div>

                    <span className="badge bg-primary">
                        {rfq.status}
                    </span>

                </div>

                <div className="row g-3">

                    <div className="col-md-6 col-xl-3">
                        <div className="card bg-dark border-secondary h-100">
                            <div className="card-body">
                                <small className="text-secondary">
                                    Quantity
                                </small>

                                <h5 className="text-white mt-2 mb-0">
                                    {rfq.quantity}
                                </h5>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 col-xl-3">
                        <div className="card bg-dark border-secondary h-100">
                            <div className="card-body">
                                <small className="text-secondary">
                                    Maximum Delivery
                                </small>

                                <h5 className="text-white mt-2 mb-0">
                                    {rfq.max_delivery_days} days
                                </h5>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 col-xl-3">
                        <div className="card bg-dark border-secondary h-100">
                            <div className="card-body">
                                <small className="text-secondary">
                                    Minimum Warranty
                                </small>

                                <h5 className="text-white mt-2 mb-0">
                                    {rfq.min_warranty_months} months
                                </h5>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 col-xl-3">
                        <div className="card bg-dark border-secondary h-100">
                            <div className="card-body">
                                <small className="text-secondary">
                                    Deadline
                                </small>

                                <h5 className="text-white mt-2 mb-0">
                                    {new Date(rfq.deadline).toLocaleDateString()}
                                </h5>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-4">
                    <Link
                        to={`/supplier/rfqs/${rfqId}/quotation`}
                        className="btn btn-primary"
                    >
                        <i className="bi bi-file-earmark-plus me-2"></i>
                        Submit Quotation
                    </Link>
                </div>

            </div>
        </main>
    );
}

export default SupplierRFQDetails;