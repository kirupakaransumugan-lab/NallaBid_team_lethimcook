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
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

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
                    <p>Manage and track your procurement requests.</p>
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
                <div className="rfq-stat-card total">
                    <div className="stat-icon green">
                        <i className="bi bi-file-earmark-text"></i>
                    </div>

                    <div className="stat-content">
                        <span>Total RFQs</span>
                        <strong>{totalRFQs}</strong>
                        <small>
                            <i className="bi bi-arrow-up"></i>
                            +2 this month
                        </small>
                    </div>

                    <div className="stat-mini-chart green-chart">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>

                    <i className="bi bi-arrow-right stat-arrow"></i>
                </div>

                <div className="rfq-stat-card open">
                    <div className="stat-icon orange">
                        <i className="bi bi-file-earmark-check"></i>
                    </div>

                    <div className="stat-content">
                        <span>Open</span>
                        <strong>{openRFQs}</strong>
                        <small>Currently open</small>
                    </div>

                    <div className="stat-mini-chart orange-chart">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>

                    <i className="bi bi-arrow-right stat-arrow"></i>
                </div>

                <div className="rfq-stat-card draft">
                    <div className="stat-icon yellow">
                        <i className="bi bi-file-earmark"></i>
                    </div>

                    <div className="stat-content">
                        <span>Draft</span>
                        <strong>{draftRFQs}</strong>
                        <small>In draft stage</small>
                    </div>

                    <div className="stat-mini-chart yellow-chart">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>

                    <i className="bi bi-arrow-right stat-arrow"></i>
                </div>

                <div className="rfq-stat-card awarded">
                    <div className="stat-icon purple">
                        <i className="bi bi-award"></i>
                    </div>

                    <div className="stat-content">
                        <span>Awarded</span>
                        <strong>{awardedRFQs}</strong>
                        <small>Successfully awarded</small>
                    </div>

                    <div className="stat-mini-chart purple-chart">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>

                    <i className="bi bi-arrow-right stat-arrow"></i>
                </div>
            </div>

            {/* RFQ Table Card */}
            <div className="rfq-card">
                <div className="rfq-card-header">
                    <div className="rfq-card-title">
                        <div className="rfq-card-icon">
                            <i className="bi bi-file-earmark-text"></i>
                        </div>

                        <div>
                            <h2>RFQ Requests</h2>
                            <p>Your created procurement requests</p>
                        </div>
                    </div>

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
                            <option value="ALL">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="OPEN">Open</option>
                            <option value="CLOSED">Closed</option>
                            <option value="AWARDED">Awarded</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        <button
                            type="button"
                            className="rfq-filter-button"
                            aria-label="Filter RFQs"
                        >
                            <i className="bi bi-funnel"></i>
                        </button>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="rfq-message">
                        <div className="rfq-spinner"></div>
                        <p>Loading your RFQs...</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rfq-message">
                        <i className="bi bi-exclamation-circle"></i>

                        <h3>Unable to load RFQs</h3>

                        <p>{error}</p>

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
                        <>
                            <div className="rfq-table-container">
                                <table className="rfq-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>RFQ Number</th>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Deadline</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredRFQs.map((rfq, index) => (
                                            <tr key={rfq.id}>
                                                <td className="row-index">
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="rfq-number"
                                                        onClick={() =>
                                                            navigate(
                                                                `/rfqs/${rfq.id}`
                                                            )
                                                        }
                                                    >
                                                        {rfq.rfq_number}
                                                    </button>
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

                                                <td className="quantity-cell">
                                                    {rfq.quantity}
                                                </td>

                                                <td>
                                                    <span className="deadline-cell">
                                                        <i className="bi bi-calendar3"></i>
                                                        {formatDate(
                                                            rfq.deadline
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`rfq-status ${rfq.status.toLowerCase()}`}
                                                    >
                                                        {rfq.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="action-group">
                                                        <button
                                                            className="view-button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/rfqs/${rfq.id}`
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        {rfq.status === "OPEN" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="action-dropdown"
                                                                    aria-label="More actions"
                                                                    aria-expanded={openActionMenuId === rfq.id}
                                                                    onClick={() => setOpenActionMenuId((current) => current === rfq.id ? null : rfq.id)}
                                                                >
                                                                    <i className="bi bi-chevron-down"></i>
                                                                </button>

                                                                {openActionMenuId === rfq.id && (
                                                                    <div className="rfq-action-menu" role="menu">
                                                                        <button
                                                                            type="button"
                                                                            role="menuitem"
                                                                            onClick={() => {
                                                                                setOpenActionMenuId(null);
                                                                                navigate(`/rfqs/${rfq.id}?extend=1`);
                                                                            }}
                                                                        >
                                                                            <i className="bi bi-calendar-plus"></i>
                                                                            Extend deadline
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="rfq-table-footer">
                                <span>
                                    Showing 1 to {filteredRFQs.length} of{" "}
                                    {filteredRFQs.length} RFQs
                                </span>

                                <div className="pagination">
                                    <button type="button" disabled>
                                        <i className="bi bi-chevron-left"></i>
                                    </button>

                                    <button
                                        type="button"
                                        className="active-page"
                                    >
                                        1
                                    </button>

                                    <button type="button">
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
            </div>
        </div>
    );
}

export default MyRFQs;
