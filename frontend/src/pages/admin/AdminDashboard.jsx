import { Link } from "react-router-dom";

import { getAdminOverview } from "../../services/adminService";
import { formatDate, formatLKR } from "../../utils/format";
import { ActiveBadge, AdminPage, RFQTable, RoleBadge } from "./adminShared";
import { useAdminData } from "./adminHooks";


const RFQ_STATUSES = ["DRAFT", "OPEN", "CLOSED", "AWARDED", "COMPLETED"];

const QUICK_LINKS = [
    ["/admin/users", "bi-people", "Manage users"],
    ["/admin/rfqs", "bi-file-earmark-text", "All RFQs"],
    ["/admin/quotations", "bi-file-earmark-check", "All quotations"],
    ["/admin/awards", "bi-trophy", "Award history"]
];


function AdminDashboard() {
    const state = useAdminData(getAdminOverview);

    return (
        <AdminPage state={state} loadingMessage="Loading admin dashboard...">
            {(data) => {
                const maxRfqs = Math.max(1, ...RFQ_STATUSES.map((s) => data.rfqs_by_status[s] ?? 0));

                return (
                    <>
                        <div className="nallabid-flow-header">
                            <div>
                                <span className="nallabid-flow-eyebrow">ADMIN</span>
                                <h1>Platform overview</h1>
                                <p>Every buyer, supplier, RFQ, quotation and award on NallaBid.</p>
                            </div>
                        </div>

                        <div className="nallabid-flow-facts">
                            <div className="nallabid-flow-fact">
                                <span>Users</span>
                                <strong>{data.total_users}</strong>
                                <span className="nallabid-flow-sub">{data.buyers} buyers · {data.suppliers} suppliers</span>
                            </div>
                            <div className="nallabid-flow-fact">
                                <span>Inactive accounts</span>
                                <strong>{data.inactive_users}</strong>
                            </div>
                            <div className="nallabid-flow-fact">
                                <span>RFQs</span>
                                <strong>{data.total_rfqs}</strong>
                            </div>
                            <div className="nallabid-flow-fact">
                                <span>Quotations</span>
                                <strong>{data.total_quotations}</strong>
                                <span className="nallabid-flow-sub">{data.sealed_quotations} sealed</span>
                            </div>
                            <div className="nallabid-flow-fact">
                                <span>Awards</span>
                                <strong>{data.active_awards + data.completed_awards}</strong>
                                <span className="nallabid-flow-sub">
                                    {data.completed_awards} completed · {data.cancelled_awards} cancelled
                                </span>
                            </div>
                            <div className="nallabid-flow-fact">
                                <span>Awarded value</span>
                                <strong>{formatLKR(data.awarded_value)}</strong>
                            </div>
                        </div>

                        <div className="nallabid-admin-grid">
                            <section className="nallabid-flow-panel">
                                <div className="nallabid-flow-panel-head">
                                    <div>
                                        <h2>RFQs by status</h2>
                                        <p>Where every RFQ is in its lifecycle</p>
                                    </div>
                                </div>
                                <div className="nallabid-flow-panel-body nallabid-admin-bars">
                                    {RFQ_STATUSES.map((status) => {
                                        const count = data.rfqs_by_status[status] ?? 0;

                                        return (
                                            <div key={status} className="nallabid-admin-bar">
                                                <span>{status}</span>
                                                <div className="nallabid-admin-bar-track">
                                                    <div className="nallabid-admin-bar-fill" style={{ width: `${(count / maxRfqs) * 100}%` }}></div>
                                                </div>
                                                <strong>{count}</strong>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="nallabid-flow-panel">
                                <div className="nallabid-flow-panel-head">
                                    <div>
                                        <h2>Quick links</h2>
                                        <p>Jump to a full list</p>
                                    </div>
                                </div>
                                <div className="nallabid-flow-panel-body nallabid-admin-links">
                                    {QUICK_LINKS.map(([to, icon, label]) => (
                                        <Link key={to} to={to} className="nallabid-admin-link">
                                            <i className={`bi ${icon}`}></i>
                                            {label}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Newest users</h2>
                                    <p>Latest sign-ups</p>
                                </div>
                                <Link to="/admin/users" className="nallabid-flow-button nallabid-flow-button-ghost nallabid-admin-small">
                                    All users <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                            <div className="nallabid-flow-table-wrap">
                                <table className="nallabid-flow-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Joined</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recent_users.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <Link to={`/admin/users/${user.id}`} className="nallabid-flow-link">{user.full_name}</Link>
                                                    <span className="nallabid-flow-sub">{user.email}</span>
                                                </td>
                                                <td><RoleBadge user={user} /></td>
                                                <td>{formatDate(user.created_at)}</td>
                                                <td><ActiveBadge active={user.is_active} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Newest RFQs</h2>
                                    <p>Latest requests from all buyers</p>
                                </div>
                                <Link to="/admin/rfqs" className="nallabid-flow-button nallabid-flow-button-ghost nallabid-admin-small">
                                    All RFQs <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                            <RFQTable rfqs={data.recent_rfqs} emptyMessage="No buyer has created an RFQ yet." />
                        </section>
                    </>
                );
            }}
        </AdminPage>
    );
}


export default AdminDashboard;
