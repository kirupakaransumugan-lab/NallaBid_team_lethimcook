import { useEffect, useState } from "react";

function SupplierDashboard() {
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // RFQ API will be connected when the backend RFQ endpoint is ready.
        setLoading(false);
    }, []);

    return (
        <main className="pageArea">
            <div className="container-fluid px-4 py-4">

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="text-white fw-bold mb-1">
                            Supplier Dashboard
                        </h2>

                        <p className="text-secondary mb-0">
                            View available RFQs and manage your quotations.
                        </p>
                    </div>
                </div>

                <div className="row g-3 mb-4">

                    <div className="col-md-4">
                        <div className="card bg-dark border-secondary h-100">
                            <div className="card-body">
                                <p className="text-secondary mb-2">
                                    Available RFQs
                                </p>

                                <h3 className="text-white mb-0">
                                    {rfqs.length}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card bg-dark border-secondary h-100">
                            <div className="card-body">
                                <p className="text-secondary mb-2">
                                    My Quotations
                                </p>

                                <h3 className="text-white mb-0">
                                    -
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card bg-dark border-secondary h-100">
                            <div className="card-body">
                                <p className="text-secondary mb-2">
                                    Awards
                                </p>

                                <h3 className="text-white mb-0">
                                    -
                                </h3>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="card bg-dark border-secondary">
                    <div className="card-body">

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="text-white mb-0">
                                Available RFQs
                            </h5>
                        </div>

                        {loading ? (
                            <div className="text-center py-5 text-secondary">
                                Loading RFQs...
                            </div>
                        ) : rfqs.length === 0 ? (
                            <div className="text-center py-5">

                                <i className="bi bi-file-earmark-text fs-1 text-secondary"></i>

                                <h5 className="text-white mt-3">
                                    No RFQs available
                                </h5>

                                <p className="text-secondary mb-0">
                                    Available RFQs will appear here.
                                </p>

                            </div>
                        ) : null}

                    </div>
                </div>

            </div>
        </main>
    );
}

export default SupplierDashboard;