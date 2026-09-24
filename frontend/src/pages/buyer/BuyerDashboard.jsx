import { Link } from "react-router-dom";

import "./BuyerDashboard.css";


function BuyerDashboard() {
    return (
        <main className="buyer-dashboard">

            {/* =====================================
                PAGE HEADER
            ====================================== */}

            <section className="buyer-dashboard-header">

                <div>
                    <h1>
                        Welcome Back!
                    </h1>

                    <p>
                        Here's what's happening with your
                        procurement activities today.
                    </p>
                </div>

                <Link
                    to="/buyer/rfqs/create"
                    className="buyer-create-rfq-button"
                >
                    <i className="bi bi-plus-lg"></i>
                    Create New RFQ
                </Link>

            </section>


            {/* =====================================
                STATISTICS
            ====================================== */}

            <section className="buyer-statistics">

                <article className="buyer-stat-card blue">

                    <div className="buyer-stat-icon">
                        <i className="bi bi-file-earmark-text"></i>
                    </div>

                    <div className="buyer-stat-content">

                        <span>
                            Total RFQs
                        </span>

                        <strong>
                            —
                        </strong>

                        <small>
                            Data will appear here
                        </small>

                    </div>

                </article>


                <article className="buyer-stat-card green">

                    <div className="buyer-stat-icon">
                        <i className="bi bi-file-earmark-check"></i>
                    </div>

                    <div className="buyer-stat-content">

                        <span>
                            Quotations Received
                        </span>

                        <strong>
                            —
                        </strong>

                        <small>
                            Data will appear here
                        </small>

                    </div>

                </article>


                <article className="buyer-stat-card orange">

                    <div className="buyer-stat-icon">
                        <i className="bi bi-clock-history"></i>
                    </div>

                    <div className="buyer-stat-content">

                        <span>
                            Pending Evaluation
                        </span>

                        <strong>
                            —
                        </strong>

                        <small>
                            Data will appear here
                        </small>

                    </div>

                </article>


                <article className="buyer-stat-card purple">

                    <div className="buyer-stat-icon">
                        <i className="bi bi-trophy"></i>
                    </div>

                    <div className="buyer-stat-content">

                        <span>
                            Awarded
                        </span>

                        <strong>
                            —
                        </strong>

                        <small>
                            Data will appear here
                        </small>

                    </div>

                </article>

            </section>


            {/* =====================================
                MAIN DASHBOARD GRID
            ====================================== */}

            <section className="buyer-dashboard-grid">


                {/* =================================
                    RECENT RFQS
                ================================== */}

                <article className="buyer-panel recent-rfqs-panel">

                    <div className="buyer-panel-header">

                        <div>
                            <h2>
                                Recent RFQs
                            </h2>

                            <p>
                                Your latest procurement requests
                            </p>
                        </div>

                        <Link to="/buyer/rfqs">
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

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="buyer-empty-table"
                                    >

                                        <div>
                                            <i className="bi bi-inbox"></i>

                                            <strong>
                                                No RFQs yet
                                            </strong>

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

                            </tbody>

                        </table>

                    </div>

                </article>


                {/* =================================
                    STATUS OVERVIEW
                ================================== */}

                <article className="buyer-panel status-panel">

                    <div className="buyer-panel-header">

                        <div>
                            <h2>
                                RFQ Status Overview
                            </h2>

                            <p>
                                Current RFQ lifecycle
                            </p>
                        </div>

                    </div>


                    <div className="buyer-chart-placeholder">

                        <div className="buyer-donut-placeholder">
                            <span>
                                —
                            </span>
                        </div>

                        <div className="buyer-status-list">

                            <div>
                                <span className="status-dot open"></span>
                                <span>Open</span>
                                <strong>—</strong>
                            </div>

                            <div>
                                <span className="status-dot evaluating"></span>
                                <span>Evaluating</span>
                                <strong>—</strong>
                            </div>

                            <div>
                                <span className="status-dot closed"></span>
                                <span>Closed</span>
                                <strong>—</strong>
                            </div>

                            <div>
                                <span className="status-dot draft"></span>
                                <span>Draft</span>
                                <strong>—</strong>
                            </div>

                        </div>

                    </div>

                </article>


                {/* =================================
                    UPCOMING DEADLINES
                ================================== */}

                <article className="buyer-panel deadlines-panel">

                    <div className="buyer-panel-header">

                        <div>
                            <h2>
                                Upcoming Deadlines
                            </h2>

                            <p>
                                RFQs approaching their deadlines
                            </p>
                        </div>

                        <Link to="/buyer/rfqs">
                            View All
                            <i className="bi bi-arrow-right"></i>
                        </Link>

                    </div>


                    <div className="buyer-deadline-empty">

                        <i className="bi bi-calendar3"></i>

                        <strong>
                            No upcoming deadlines
                        </strong>

                        <span>
                            Upcoming RFQ deadlines will appear
                            here when available.
                        </span>

                    </div>

                </article>


                {/* =================================
                    QUICK ACTIONS
                ================================== */}

                <article className="buyer-panel quick-actions-panel">

                    <div className="buyer-panel-header">

                        <div>
                            <h2>
                                Quick Actions
                            </h2>

                            <p>
                                Common procurement tasks
                            </p>
                        </div>

                    </div>


                    <div className="buyer-quick-actions">

                        <Link
                            to="/buyer/rfqs/create"
                            className="buyer-quick-action"
                        >

                            <div className="quick-action-icon blue">
                                <i className="bi bi-file-earmark-plus"></i>
                            </div>

                            <div>
                                <strong>
                                    Create New RFQ
                                </strong>

                                <span>
                                    Publish a new procurement request
                                </span>
                            </div>

                        </Link>


                        <Link
                            to="/buyer/suppliers"
                            className="buyer-quick-action"
                        >

                            <div className="quick-action-icon green">
                                <i className="bi bi-people"></i>
                            </div>

                            <div>
                                <strong>
                                    Manage Suppliers
                                </strong>

                                <span>
                                    View available suppliers
                                </span>
                            </div>

                        </Link>


                        <Link
                            to="/buyer/reports"
                            className="buyer-quick-action"
                        >

                            <div className="quick-action-icon purple">
                                <i className="bi bi-bar-chart"></i>
                            </div>

                            <div>
                                <strong>
                                    View Reports
                                </strong>

                                <span>
                                    Procurement analytics and reports
                                </span>
                            </div>

                        </Link>


                        <Link
                            to="/buyer/profile"
                            className="buyer-quick-action"
                        >

                            <div className="quick-action-icon orange">
                                <i className="bi bi-gear"></i>
                            </div>

                            <div>
                                <strong>
                                    Account Settings
                                </strong>

                                <span>
                                    Manage your profile
                                </span>
                            </div>

                        </Link>

                    </div>

                </article>


                {/* =================================
                    QUOTATION TREND
                ================================== */}

                <article className="buyer-panel quotation-trend-panel">

                    <div className="buyer-panel-header">

                        <div>
                            <h2>
                                Quotation Trend
                            </h2>

                            <p>
                                Quotation activity over time
                            </p>
                        </div>

                        <select
                            className="buyer-period-select"
                            defaultValue="6"
                        >
                            <option value="6">
                                Last 6 Months
                            </option>

                            <option value="3">
                                Last 3 Months
                            </option>

                            <option value="12">
                                Last 12 Months
                            </option>
                        </select>

                    </div>


                    <div className="buyer-line-chart-placeholder">

                        <div className="chart-empty-icon">
                            <i className="bi bi-bar-chart-line"></i>
                        </div>

                        <strong>
                            No quotation data yet
                        </strong>

                        <span>
                            Quotation activity will appear
                            after suppliers submit quotations.
                        </span>

                    </div>

                </article>

            </section>

        </main>
    );
}


export default BuyerDashboard;