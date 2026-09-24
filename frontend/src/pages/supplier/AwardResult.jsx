import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function AwardResult() {
    const { rfqId } = useParams();

    const [award, setAward] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Award API will be connected when the backend endpoint is ready.
        setLoading(false);
    }, [rfqId]);

    if (loading) {
        return (
            <main className="pageArea">
                <div className="container-fluid px-4 py-5 text-center">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <p className="text-secondary mt-3 mb-0">
                        Loading award result...
                    </p>

                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="pageArea">
                <div className="container-fluid px-4 py-4">

                    <div
                        className="alert alert-danger"
                        role="alert"
                    >
                        {error}
                    </div>

                </div>
            </main>
        );
    }

    if (!award) {
        return (
            <main className="pageArea">
                <div className="container-fluid px-4 py-4">

                    <Link
                        to="/supplier/quotations"
                        className="text-decoration-none"
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to My Quotations
                    </Link>

                    <div className="card bg-dark border-secondary mt-4">
                        <div className="card-body text-center py-5">

                            <i className="bi bi-hourglass-split fs-1 text-secondary"></i>

                            <h4 className="text-white mt-3">
                                Award result not available
                            </h4>

                            <p className="text-secondary mb-0">
                                The award result will appear here after the buyer
                                completes the award process.
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
                    to="/supplier/quotations"
                    className="text-decoration-none"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to My Quotations
                </Link>

                <div className="mt-4 mb-4">

                    <h2 className="text-white fw-bold mb-1">
                        Award Result
                    </h2>

                    <p className="text-secondary mb-0">
                        View the award status for this RFQ.
                    </p>

                </div>

                <div className="row">
                    <div className="col-xl-8">

                        <div className="card bg-dark border-secondary">
                            <div className="card-body p-4">

                                <div className="d-flex align-items-center gap-3 mb-4">

                                    <div className="fs-1">
                                        <i className="bi bi-trophy text-warning"></i>
                                    </div>

                                    <div>
                                        <small className="text-secondary">
                                            Award Status
                                        </small>

                                        <h4 className="text-white mb-0">
                                            {award.status}
                                        </h4>
                                    </div>

                                </div>

                                <hr className="border-secondary" />

                                <div className="row g-4 mt-1">

                                    <div className="col-md-6">
                                        <small className="text-secondary">
                                            RFQ
                                        </small>

                                        <p className="text-white mt-1 mb-0">
                                            {award.rfq_id}
                                        </p>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-secondary">
                                            Quotation
                                        </small>

                                        <p className="text-white mt-1 mb-0">
                                            {award.quotation_id}
                                        </p>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-secondary">
                                            Awarded At
                                        </small>

                                        <p className="text-white mt-1 mb-0">
                                            {award.awarded_at
                                                ? new Date(
                                                    award.awarded_at
                                                ).toLocaleString()
                                                : "-"}
                                        </p>
                                    </div>

                                </div>

                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}

export default AwardResult;