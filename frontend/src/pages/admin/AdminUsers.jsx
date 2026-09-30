import { useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import { getAdminUsers } from "../../services/adminService";
import { formatDate } from "../../utils/format";
import { ActiveBadge, AdminPage, RoleBadge, StatusToggleButton } from "./adminShared";
import { matchesText, useAdminData, useStatusToggle } from "./adminHooks";


const ROLE_FILTERS = [["ALL", "All roles"], ["BUYER", "Buyers"], ["SUPPLIER", "Suppliers"], ["ADMIN", "Admins"]];
const STATUS_FILTERS = [["ALL", "All statuses"], ["ACTIVE", "Active"], ["INACTIVE", "Inactive"]];


function matchesRole(user, filter) {
    if (filter === "ALL") return true;
    if (filter === "ADMIN") return user.is_admin;
    return user.role === filter;
}


function matchesStatus(user, filter) {
    return filter === "ALL" || (filter === "ACTIVE") === user.is_active;
}


function AdminUsers() {
    const state = useAdminData(getAdminUsers);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const toggle = useStatusToggle((updated) =>
        state.setData((users) => users.map((user) => (user.id === updated.id ? updated : user)))
    );

    return (
        <AdminPage state={state} loadingMessage="Loading users...">
            {(users) => {
                const filtered = users.filter((user) =>
                    matchesText(search, [user.full_name, user.email, user.company_name, user.id]) &&
                    matchesRole(user, roleFilter) &&
                    matchesStatus(user, statusFilter)
                );

                return (
                    <>
                        <div className="nallabid-flow-header">
                            <div>
                                <span className="nallabid-flow-eyebrow">ADMIN</span>
                                <h1>Users</h1>
                                <p>All buyer and supplier accounts. Deactivate an account to block its login.</p>
                            </div>
                        </div>

                        {toggle.alert}

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>All accounts</h2>
                                    <p>Showing {filtered.length} of {users.length}</p>
                                </div>
                            </div>

                            <div className="nallabid-flow-toolbar">
                                <label className="nallabid-flow-search">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="search"
                                        placeholder="Search name, email, company or ID..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        aria-label="Search users"
                                    />
                                </label>
                                <select className="nallabid-flow-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
                                    {ROLE_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                                <select className="nallabid-flow-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
                                    {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </div>

                            {filtered.length === 0 ? (
                                <EmptyState icon="bi-funnel" title="No matching users" message="Try a different search or filter." />
                            ) : (
                                <div className="nallabid-flow-table-wrap">
                                    <table className="nallabid-flow-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>User</th>
                                                <th>Role</th>
                                                <th>Company</th>
                                                <th className="nallabid-flow-num">Activity</th>
                                                <th>Joined</th>
                                                <th>Status</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((user) => (
                                                <tr key={user.id}>
                                                    <td>#{user.id}</td>
                                                    <td>
                                                        <Link to={`/admin/users/${user.id}`} className="nallabid-flow-link">{user.full_name}</Link>
                                                        <span className="nallabid-flow-sub">{user.email}</span>
                                                    </td>
                                                    <td><RoleBadge user={user} /></td>
                                                    <td>{user.company_name || "-"}</td>
                                                    <td className="nallabid-flow-num">
                                                        {user.activity_count}
                                                        <span className="nallabid-flow-sub">{user.role === "SUPPLIER" ? "quotations" : "RFQs"}</span>
                                                    </td>
                                                    <td>{formatDate(user.created_at)}</td>
                                                    <td><ActiveBadge active={user.is_active} /></td>
                                                    <td className="nallabid-flow-num">
                                                        <div className="nallabid-flow-actions">
                                                            <Link to={`/admin/users/${user.id}`} className="nallabid-flow-button nallabid-flow-button-ghost nallabid-admin-small">View</Link>
                                                            <StatusToggleButton user={user} onClick={toggle.ask} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        {toggle.dialog}
                    </>
                );
            }}
        </AdminPage>
    );
}


export default AdminUsers;
