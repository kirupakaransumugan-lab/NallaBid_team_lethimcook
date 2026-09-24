import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MyQuotations() {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Supplier quotation API will be connected
        // when the backend endpoint is ready.
        setLoading(false);
    }, []);

    const getStatusClass = (status) => {
        switch (status) {
            case "AWARDED":
                return "bg-success";

            case "ELIGIBLE":
                return "bg-primary";

            case "INELIGIBLE":
                return "bg-danger";

            case "SUBMITTED":
                return "bg-warning text-dark";

            default:
                return "bg-secondary";
        }
    };

    return (
        <main className="pageArea">
            <div className="container-fluid px-4 py-4">

                <div className="mb-4">
                    <h2 className="text-white fw-bold mb-1">
                        My Quotations
                    </h2>

                    <p className="text-secondary mb-0">
                        View and track the quotations you have submitted.
                    </p>
                </div>

                {error && (
                    <div
                        className="alert alert-danger"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <div className="card bg-dark border-secondary">
                    <div className="card-body">

                        {loading ? (
                            <div className="text-center py-5">

                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                >
                                    <span className="visually-hidden">
                                        Loading...
                                    </span>
                                </div>

                                <p className="text-secondary mt-3 mb-0">
                                    Loading your quotations...
                                </p>

                            </div>
                        ) : quotations.length === 0 ? (
                            <div className="text-center py-5">

                                <i className="bi bi-file-earmark-check fs-1 text-secondary"></i>

                                <h5 className="text-white mt-3">
                                    No quotations submitted
                                </h5>

                                <p className="text-secondary mb-0">
                                    Your submitted quotations will appear here.
                                </p>

                            </div>
                        ) : (
                            <div className="table-responsive">

                                <table className="table table-dark table-hover align-middle mb-0">

                                    <thead>
                                        <tr>
                                            <th>Quotation</th>
                                            <th>RFQ</th>
                                            <th>Unit Price</th>
                                            <th>Total Price</th>
                                            <th>Delivery</th>
                                            <th>Warranty</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {quotations.map((quotation) => (
                                            <tr key={quotation.id}>

                                                <td>
                                                    {quotation.quotation_number}
                                                </td>

                                                <td>
                                                    {quotation.rfq_id}
                                                </td>

                                                <td>
                                                    {quotation.unit_price}
                                                </td>

                                                <td>
                                                    {quotation.total_price}
                                                </td>

                                                <td>
                                                    {quotation.delivery_days} days
                                                </td>

                                                <td>
                                                    {quotation.warranty_months} months
                                                </td>

                                                <td>
                                                    <span
                                                        className={`badge ${getStatusClass(
                                                            quotation.status
                                                        )}`}
                                                    >
                                                        {quotation.status}
                                                    </span>
                                                </td>

                                                <td className="text-end">
                                                    <Link
                                                        to={`/supplier/rfqs/${quotation.rfq_id}`}
                                                        className="btn btn-sm btn-outline-primary"
                                                    >
                                                        View RFQ
                                                    </Link>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>

                                </table>

                            </div>
                        )}

                    </div>
                </div>

            </div>
        </main>
    );
}

export default MyQuotations;