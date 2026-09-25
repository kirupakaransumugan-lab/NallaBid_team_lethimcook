import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_URL, getToken } from "../../services/authService";
import "./myRFQs.css";

function MyRFQs() {
    const navigate = useNavigate();

    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchRFQs = async () => {
        setLoading(true);
        setError("");

        try {
            const token = getToken();

            if (!token) {
                setError("You are not logged in.");
                return;
            }

            const response = await fetch(`${API_URL}/rfqs`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to load RFQs."
                );
            }

            setRfqs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRFQs();
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const filteredRFQs = useMemo(() => {
        return rfqs.filter((rfq) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                rfq.rfq_number
                    ?.toLowerCase()
                    .includes(searchText) ||
                rfq.product_name
                    ?.toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                statusFilter === "ALL" ||
                rfq.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [rfqs, search, statusFilter]);

    const totalRFQs = rfqs.length;

    const openRFQs = rfqs.filter(
        (rfq) => rfq.status === "OPEN"
    ).length;

    const draftRFQs = rfqs.filter(
        (rfq) => rfq.status === "DRAFT"
    ).length;

    const awardedRFQs = rfqs.filter(
        (rfq) => rfq.status === "AWARDED"
    ).length;

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div className="my-rfqs-page">

            {/* Page Header */}

            <div className="my-rfqs-header">

                <div>
                    <h1>My RFQs</h1>

                    <p>
                        Manage and track your procurement requests.
                    </p>
                </div>

                <button
                    className="create-rfq-button"
                    onClick={() => navigate("/rfqs/create")}
                >
                    <i className="bi bi-plus-lg"></i>
                    Create New RFQ
                </button>

            </div>

            {/* Statistics */}

            <div className="rfq-stats">

                <div className="rfq-stat-card">
                    <div className="stat-icon blue">
                        <i className="bi bi-file-earmark-text"></i>
                    </div>

                    <div>
                        <span>Total RFQs</span>
                        <strong>{totalRFQs}</strong>
                    </div>
                </div>

                <div className="rfq-stat-card">
                    <div className="stat-icon green">
                        <i className="bi bi-unlock"></i>
                    </div>

                    <div>
                        <span>Open</span>
                        <strong>{openRFQs}</strong>
                    </div>
                </div>

                <div className="rfq-stat-card">
                    <div className="stat-icon purple">
                        <i className="bi bi-file-earmark"></i>
                    </div>

                    <div>
                        <span>Draft</span>
                        <strong>{draftRFQs}</strong>
                    </div>
                </div>

                <div className="rfq-stat-card">
                    <div className="stat-icon orange">
                        <i className="bi bi-trophy"></i>
                    </div>

                    <div>
                        <span>Awarded</span>
                        <strong>{awardedRFQs}</strong>
                    </div>
                </div>

            </div>

            {/* RFQ Table Card */}

            <div className="rfq-card">

                <div className="rfq-card-header">

                    <div>
                        <h2>RFQ Requests</h2>

                        <p>
                            Your created procurement requests
                        </p>
                    </div>

                </div>

                {/* Search / Filter */}

                <div className="rfq-toolbar">

                    <div className="rfq-search-box">
                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search RFQ number or product..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="ALL">
                            All Status
                        </option>

                        <option value="DRAFT">
                            Draft
                        </option>

                        <option value="OPEN">
                            Open
                        </option>

                        <option value="CLOSED">
                            Closed
                        </option>

                        <option value="AWARDED">
                            Awarded
                        </option>

                        <option value="COMPLETED">
                            Completed
                        </option>
                    </select>

                </div>

                {/* Loading */}

                {loading && (
                    <div className="rfq-message">
                        <div className="rfq-spinner"></div>

                        <p>
                            Loading your RFQs...
                        </p>
                    </div>
                )}

                {/* Error */}

                {!loading && error && (
                    <div className="rfq-message">

                        <i className="bi bi-exclamation-circle"></i>

                        <h3>
                            Unable to load RFQs
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button
                            onClick={fetchRFQs}
                            className="retry-button"
                        >
                            Try Again
                        </button>

                    </div>
                )}

                {/* Empty */}

                {!loading &&
                    !error &&
                    filteredRFQs.length === 0 && (
                        <div className="rfq-message">

                            <i className="bi bi-file-earmark-text"></i>

                            <h3>
                                {rfqs.length === 0
                                    ? "No RFQs yet"
                                    : "No matching RFQs"}
                            </h3>

                            <p>
                                {rfqs.length === 0
                                    ? "Create your first procurement request to get started."
                                    : "Try changing your search or status filter."}
                            </p>

                            {rfqs.length === 0 && (
                                <button
                                    className="create-first-button"
                                    onClick={() =>
                                        navigate("/rfqs/create")
                                    }
                                >
                                    Create Your First RFQ
                                </button>
                            )}

                        </div>
                    )}

                {/* RFQ Table */}

                {!loading &&
                    !error &&
                    filteredRFQs.length > 0 && (

                        <div className="rfq-table-container">

                            <table className="rfq-table">

                                <thead>
                                    <tr>
                                        <th>RFQ Number</th>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Deadline</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredRFQs.map((rfq) => (

                                        <tr key={rfq.id}>

                                            <td>
                                                <span className="rfq-number">
                                                    {rfq.rfq_number}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="product-info">

                                                    <strong>
                                                        {rfq.product_name}
                                                    </strong>

                                                    {rfq.description && (
                                                        <small>
                                                            {rfq.description}
                                                        </small>
                                                    )}

                                                </div>
                                            </td>

                                            <td>
                                                {rfq.quantity}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    rfq.deadline
                                                )}
                                            </td>

                                            <td>

                                                <span
                                                    className={`rfq-status ${rfq.status.toLowerCase()}`}
                                                >
                                                    {rfq.status}
                                                </span>

                                            </td>

                                            <td>

                                                <button
                                                    className="view-button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/rfqs/${rfq.id}`
                                                        )
                                                    }
                                                >
                                                    View
                                                    <i className="bi bi-arrow-right"></i>
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

            </div>

        </div>
    );
}

export default MyRFQs;