import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { formatDate, formatDateTime, formatLKR } from "../../utils/format";

import "../buyer/awardFlow.css";
import "./admin.css";


// Shows loading / error states so each page only renders the happy path.
export function AdminPage({ state, loadingMessage, children }) {
    if (state.loading && !state.data) {
        return (
            <div className="nallabid-flow-page">
                <Loading message={loadingMessage} />
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="nallabid-flow-page">
                <ErrorMessage error={state.error} onRetry={state.reload} backTo="/admin" backLabel="Admin dashboard" />
            </div>
        );
    }

    return <div className="nallabid-flow-page nallabid-admin-page">{children(state.data)}</div>;
}


// =========================================================
// Badges
// =========================================================

export function StatusBadge({ status }) {
    return <span className={`nallabid-flow-badge nallabid-flow-badge-${status.toLowerCase()}`}>{status}</span>;
}


export function RoleBadge({ user }) {
    if (user.is_admin) {
        return <span className="nallabid-admin-role nallabid-admin-role-admin"><i className="bi bi-shield-check"></i>Admin</span>;
    }

    return (
        <span className={`nallabid-admin-role nallabid-admin-role-${user.role.toLowerCase()}`}>
            {user.role === "SUPPLIER" ? "Supplier" : "Buyer"}
        </span>
    );
}


export function ActiveBadge({ active }) {
    return (
        <span className={`nallabid-admin-active ${active ? "is-active" : "is-inactive"}`}>
            <i className={`bi ${active ? "bi-check-circle-fill" : "bi-slash-circle"}`}></i>
            {active ? "Active" : "Inactive"}
        </span>
    );
}


function SealedValue() {
    return (
        <span className="nallabid-admin-sealed" title="Hidden until the RFQ deadline passes">
            <i className="bi bi-lock-fill"></i>
            Sealed
        </span>
    );
}


// =========================================================
// Reusable tables (list pages and detail pages share them)
// =========================================================

export function RFQTable({ rfqs, showBuyer = true, emptyMessage = "No RFQs." }) {
    if (rfqs.length === 0) {
        return <EmptyState icon="bi-file-earmark-text" title="No RFQs" message={emptyMessage} />;
    }

    return (
        <div className="nallabid-flow-table-wrap">
            <table className="nallabid-flow-table">
                <thead>
                    <tr>
                        <th>RFQ</th>
                        {showBuyer && <th>Buyer</th>}
                        <th className="nallabid-flow-num">Quantity</th>
                        <th className="nallabid-flow-num">Quotations</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {rfqs.map((rfq) => (
                        <tr key={rfq.id}>
                            <td>
                                <strong>{rfq.rfq_number}</strong>
                                <span className="nallabid-flow-sub">{rfq.product_name}</span>
                            </td>
                            {showBuyer && (
                                <td>
                                    <Link to={`/admin/users/${rfq.buyer_id}`} className="nallabid-flow-link">{rfq.buyer_name}</Link>
                                </td>
                            )}
                            <td className="nallabid-flow-num">{rfq.quantity}</td>
                            <td className="nallabid-flow-num">{rfq.quotation_count}</td>
                            <td>{formatDateTime(rfq.deadline)}</td>
                            <td><StatusBadge status={rfq.status} /></td>
                            <td className="nallabid-flow-num">
                                <Link to={`/admin/rfqs/${rfq.id}`} className="nallabid-flow-button nallabid-flow-button-ghost nallabid-admin-small">
                                    View <i className="bi bi-arrow-right"></i>
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export function QuotationTable({ quotations, showRfq = true, showSupplier = true, emptyMessage = "No quotations." }) {
    if (quotations.length === 0) {
        return <EmptyState icon="bi-file-earmark-check" title="No quotations" message={emptyMessage} />;
    }

    return (
        <div className="nallabid-flow-table-wrap">
            <table className="nallabid-flow-table">
                <thead>
                    <tr>
                        <th>Quotation</th>
                        {showRfq && <th>RFQ</th>}
                        {showSupplier && <th>Supplier</th>}
                        <th className="nallabid-flow-num">Total price</th>
                        <th className="nallabid-flow-num">Delivery</th>
                        <th className="nallabid-flow-num">Warranty</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {quotations.map((q) => (
                        <tr key={q.id}>
                            <td>
                                <strong>{q.quotation_number}</strong>
                                <span className="nallabid-flow-sub">{formatDate(q.submitted_at)}</span>
                            </td>
                            {showRfq && (
                                <td>
                                    <Link to={`/admin/rfqs/${q.rfq_id}`} className="nallabid-flow-link">{q.rfq_number}</Link>
                                    <span className="nallabid-flow-sub">{q.product_name}</span>
                                </td>
                            )}
                            {showSupplier && (
                                <td>
                                    <Link to={`/admin/users/${q.supplier_user_id}`} className="nallabid-flow-link">{q.supplier_name}</Link>
                                </td>
                            )}
                            <td className="nallabid-flow-num">
                                {q.sealed ? <SealedValue /> : (
                                    <>
                                        {formatLKR(q.total_price)}
                                        <span className="nallabid-flow-sub">{formatLKR(q.unit_price)} / unit</span>
                                    </>
                                )}
                            </td>
                            <td className="nallabid-flow-num">{q.sealed ? "-" : `${q.delivery_days} days`}</td>
                            <td className="nallabid-flow-num">{q.sealed ? "-" : `${q.warranty_months} months`}</td>
                            <td>{q.sealed ? <SealedValue /> : <StatusBadge status={q.status} />}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export function AwardTable({ awards, emptyMessage = "No awards." }) {
    if (awards.length === 0) {
        return <EmptyState icon="bi-trophy" title="No awards" message={emptyMessage} />;
    }

    return (
        <div className="nallabid-flow-table-wrap">
            <table className="nallabid-flow-table">
                <thead>
                    <tr>
                        <th>RFQ</th>
                        <th>Buyer</th>
                        <th>Supplier</th>
                        <th className="nallabid-flow-num">Value</th>
                        <th>Awarded</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {awards.map((award) => (
                        <tr key={award.id}>
                            <td>
                                <Link to={`/admin/rfqs/${award.rfq_id}`} className="nallabid-flow-link">{award.rfq_number}</Link>
                                <span className="nallabid-flow-sub">{award.product_name}</span>
                            </td>
                            <td>{award.buyer_name}</td>
                            <td>
                                {award.supplier_name}
                                <span className="nallabid-flow-sub">{award.quotation_number}</span>
                            </td>
                            <td className="nallabid-flow-num">{formatLKR(award.total_price)}</td>
                            <td>{formatDate(award.awarded_at)}</td>
                            <td>
                                <StatusBadge status={award.status} />
                                {award.cancel_reason && (
                                    <span className="nallabid-flow-sub">Reason: {award.cancel_reason}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export function StatusToggleButton({ user, onClick }) {
    if (user.is_admin) {
        return null;
    }

    return (
        <button
            type="button"
            className={`nallabid-flow-button nallabid-admin-small ${user.is_active ? "nallabid-flow-button-danger" : "nallabid-flow-button-success"}`}
            onClick={() => onClick(user)}
        >
            <i className={`bi ${user.is_active ? "bi-slash-circle" : "bi-check-circle"}`}></i>
            {user.is_active ? "Deactivate" : "Reactivate"}
        </button>
    );
}
