import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCurrentUser } from "../../services/authService";
import { getBuyerDashboard } from "../../services/rfqService";

import "./BuyerDashboard.css";

function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function BuyerDashboard() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getBuyerDashboard()
            .then(setDashboard)
            .catch((err) => {
                if (err.status === 401) {
                    navigate("/login");
                    return;
                }

                setError(err.message);
            });
    }, [navigate]);

    const stats = dashboard?.stats;
    const overview = dashboard?.status_overview;
    const recentRfqs = dashboard?.recent_rfqs ?? [];
    const deadlines = dashboard?.upcoming_deadlines ?? [];
    const trend = dashboard?.quotation_trend ?? [];

    const show = (value) => (dashboard ? value : "—");

    return (
        <main className="buyer-dashboard">
            {/* =========================
                DASHBOARD HEADER
            ========================== */}
            <section className="buyer-dashboard-header">
                <div className="buyer-welcome-content">
                    <div>
                        <h1>
                            Welcome Back{user ? `, ${user.full_name}` : ""}!{" "}
                            <span className="welcome-wave">👋</span>
                        </h1>

                        <p>
                            Here's what's happening with your procurement
                            activities today.
                        </p>

                        {error && (
                            <p className="buyer-dashboard-error">
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                <div className="buyer-header-visual">
                    <div className="buyer-city-art" aria-hidden="true">
                        <span className="city-cloud cloud-one"></span>
                        <span className="city-cloud cloud-two"></span>
                        <span className="city-tree tree-one"></span>
                        <span className="city-tree tree-two"></span>
                        <span className="city-building building-one"></span>
                        <span className="city-building building-two"></span>
                        <span className="city-building building-three"></span>
                        <span className="city-ground"></span>
                    </div>

                    <div className="buyer-header-message">
                        <strong>Source.</strong>
                        <strong>Compare.</strong>
                        <strong>Collaborate.</strong>
                        <strong>Grow Together.</strong>
                    </div>

                    <Link
                        to="/buyer/rfqs/create"
                        className="buyer-create-rfq-button"
                    >
                        <i className="bi bi-plus-lg"></i>
                        Create New RFQ
                    </Link>
                </div>
            </section>

            {/* =========================
                STATISTICS
            ========================== */}
            <section className="buyer-statistics">
                <article className="buyer-stat-card total">
                    <div className="buyer-stat-icon">
                        <i className="bi bi-file-earmark-text"></i>
                    </div>

                    <div className="buyer-stat-content">
                        <span>Total RFQs</span>
                        <strong>{show(stats?.total_rfqs)}</strong>
                        <small>
                            <i className="bi bi-arrow-up"></i>
                            All RFQs you created
                        </small>
                    </div>

                    <div className="buyer-stat-trend trend-green">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <Link to="/buyer/rfqs" className="buyer-stat-arrow">
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </article>

                <article className="buyer-stat-card quotations">
                    <div className="buyer-stat-icon">
                        <i className="bi bi-file-earmark-check"></i>
                    </div>

                    <div className="buyer-stat-content">
                        <span>Quotations Received</span>
                        <strong>{show(stats?.quotations_received)}</strong>
                        <small>Across all your RFQs</small>
                    </div>

                    <div className="buyer-stat-trend trend-orange">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <Link to="/quotations" className="buyer-stat-arrow">
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </article>

                <article className="buyer-stat-card evaluation">
                    <div className="buyer-stat-icon">
                        <i className="bi bi-clock-history"></i>
                    </div>

                    <div className="buyer-stat-content">
                        <span>Pending Evaluation</span>
                        <strong>{show(stats?.pending_evaluation)}</strong>
                        <small>Quotations to review</small>
                    </div>

                    <div className="buyer-stat-trend trend-yellow">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <Link to="/quotations?status=PENDING" className="buyer-stat-arrow">
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </article>

                <article className="buyer-stat-card awarded">
                    <div className="buyer-stat-icon">
                        <i className="bi bi-trophy"></i>
                    </div>

                    <div className="buyer-stat-content">
                        <span>Awarded</span>
                        <strong>{show(stats?.awarded)}</strong>
                        <small>RFQs awarded</small>
                    </div>

                    <div className="buyer-stat-trend trend-purple">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <Link to="/buyer/rfqs" className="buyer-stat-arrow">
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </article>
            </section>

            {/* =========================
                MAIN DASHBOARD GRID
            ========================== */}
            <section className="buyer-dashboard-grid">
                {/* RECENT RFQS */}
                <article className="buyer-panel recent-rfqs-panel">
                    <div className="buyer-panel-header">
                        <div className="buyer-panel-title">
                            <div className="buyer-panel-icon green">
                                <i className="bi bi-file-earmark-text"></i>
                            </div>

                            <div>
                                <h2>Recent RFQs</h2>
                                <p>Your latest procurement requests</p>
                            </div>
                        </div>

                        <Link to="/buyer/rfqs" className="buyer-view-all">
                            View All
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="buyer-table-wrapper">
                        <table className="buyer-rfq-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>RFQ</th>
                                    <th>Deadline</th>
                                    <th>Quotations</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentRfqs.map((rfq, index) => (
                                    <tr key={rfq.id}>
                                        <td className="rfq-number-cell">
                                            {index + 1}
                                        </td>

                                        <td>
                                            <div className="rfq-name">
                                                <div className="rfq-product-icon">
                                                    <i className="bi bi-laptop"></i>
                                                </div>

                                                <div>
                                                    <strong>{rfq.product_name}</strong>
                                                    <small>{rfq.rfq_number}</small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="rfq-date">
                                                <i className="bi bi-calendar3"></i>
                                                {formatDate(rfq.deadline)}
                                            </span>
                                        </td>

                                        <td>{rfq.quotation_count}</td>

                                        <td>
                                            <span
                                                className={`rfq-status ${String(
                                                    rfq.status || ""
                                                )
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")}`}
                                            >
                                                {rfq.status}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="rfq-action-group">
                                                <Link
                                                    to={`/buyer/rfqs/${rfq.id}`}
                                                    className="rfq-view-button"
                                                >
                                                    View
                                                </Link>

                                                <button
                                                    type="button"
                                                    className="rfq-more-button"
                                                    aria-label="More options"
                                                >
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {recentRfqs.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="buyer-empty-table"
                                        >
                                            <div>
                                                <i className="bi bi-inbox"></i>
                                                <strong>No RFQs yet</strong>
                                                <span>
                                                    Your recently created RFQs
                                                    will appear here.
                                                </span>
                                                <Link to="/buyer/rfqs/create">
                                                    Create your first RFQ
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>

                {/* STATUS OVERVIEW */}
                <article className="buyer-panel status-panel">
                    <div className="buyer-panel-header">
                        <div className="buyer-panel-title">
                            <div className="buyer-panel-icon green">
                                <i className="bi bi-pie-chart"></i>
                            </div>

                            <div>
                                <h2>RFQ Status Overview</h2>
                                <p>Current RFQ lifecycle</p>
                            </div>
                        </div>

                        <Link to="/buyer/rfqs" className="buyer-view-all">
                            View All
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="buyer-status-overview">
                        <div
                            className="buyer-donut"
                            style={{
                                "--draft": overview?.draft ?? 0,
                                "--open": overview?.open ?? 0,
                                "--evaluating": overview?.closed ?? 0,
                                "--awarded": overview?.awarded ?? 0
                            }}
                        >
                            <div className="buyer-donut-inner">
                                <strong>{show(stats?.total_rfqs)}</strong>
                                <span>Total RFQs</span>
                            </div>
                        </div>

                        <div className="buyer-status-list">
                            <div className="buyer-status-row">
                                <span className="status-dot open"></span>
                                <span>Open</span>
                                <strong>{show(overview?.open)}</strong>
                                <small>0%</small>
                            </div>

                            <div className="buyer-status-row">
                                <span className="status-dot evaluating"></span>
                                <span>Evaluating</span>
                                <strong>{show(overview?.closed)}</strong>
                                <small>0%</small>
                            </div>

                            <div className="buyer-status-row">
                                <span className="status-dot awarded"></span>
                                <span>Awarded</span>
                                <strong>{show(overview?.awarded)}</strong>
                                <small>0%</small>
                            </div>

                            <div className="buyer-status-row">
                                <span className="status-dot draft"></span>
                                <span>Draft</span>
                                <strong>{show(overview?.draft)}</strong>
                                <small>100%</small>
                            </div>
                        </div>
                    </div>
                </article>

                {/* UPCOMING DEADLINES */}
                <article className="buyer-panel deadlines-panel">
                    <div className="buyer-panel-header">
                        <div className="buyer-panel-title">
                            <div className="buyer-panel-icon orange">
                                <i className="bi bi-clock"></i>
                            </div>

                            <div>
                                <h2>Upcoming Deadlines</h2>
                                <p>RFQs approaching their deadlines</p>
                            </div>
                        </div>

                        <Link to="/buyer/rfqs" className="buyer-view-all">
                            View All
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    {deadlines.length > 0 ? (
                        <ul className="buyer-deadline-list">
                            {deadlines.map((rfq) => (
                                <li key={rfq.id}>
                                    <div className="deadline-icon">
                                        <i className="bi bi-clock"></i>
                                    </div>

                                    <div className="deadline-info">
                                        <strong>{rfq.product_name}</strong>
                                        <span>
                                            {rfq.rfq_number} ·{" "}
                                            {formatDate(rfq.deadline)}
                                        </span>
                                    </div>

                                    <span className="deadline-badge">
                                        {rfq.days_left} days left
                                    </span>

                                    <i className="bi bi-chevron-right deadline-arrow"></i>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="buyer-deadline-empty">
                            <i className="bi bi-calendar3"></i>
                            <strong>No upcoming deadlines</strong>
                            <span>
                                Upcoming RFQ deadlines will appear here when
                                available.
                            </span>
                        </div>
                    )}
                </article>

                {/* QUOTATION TREND
                    Kept below the reference viewport so the existing
                    quotation-trend data/functionality is not discarded. */}
                <article className="buyer-panel quotation-trend-panel">
                    <div className="buyer-panel-header">
                        <div className="buyer-panel-title">
                            <div className="buyer-panel-icon green">
                                <i className="bi bi-bar-chart-line"></i>
                            </div>

                            <div>
                                <h2>Quotation Trend</h2>
                                <p>Quotation activity over time</p>
                            </div>
                        </div>

                        <select
                            className="buyer-period-select"
                            defaultValue="6"
                        >
                            <option value="6">Last 6 Months</option>
                            <option value="3">Last 3 Months</option>
                            <option value="12">Last 12 Months</option>
                        </select>
                    </div>

                    {trend.length > 0 ? (
                        <ul className="buyer-trend-list">
                            {trend.map((item) => (
                                <li key={item.month}>
                                    <span>{item.month}</span>
                                    <strong>
                                        {item.quotation_count} quotations
                                    </strong>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="buyer-line-chart-placeholder">
                            <div className="chart-empty-icon">
                                <i className="bi bi-bar-chart-line"></i>
                            </div>

                            <strong>No quotation data yet</strong>
                            <span>
                                Quotation activity will appear after suppliers
                                submit quotations.
                            </span>
                        </div>
                    )}
                </article>
            </section>
        </main>
    );
}

export default BuyerDashboard;
