import { useState } from "react";

import { getAdminQuotations } from "../../services/adminService";
import { AdminPage, QuotationTable } from "./adminShared";
import { matchesText, useAdminData } from "./adminHooks";


const STATUS_FILTERS = [
    ["ALL", "All statuses"],
    ["SEALED", "Sealed (RFQ still open)"],
    ["SUBMITTED", "Submitted"],
    ["ELIGIBLE", "Eligible"],
    ["INELIGIBLE", "Ineligible"],
    ["AWARDED", "Awarded"]
];


function matchesStatus(quotation, filter) {
    if (filter === "ALL") return true;
    if (filter === "SEALED") return quotation.sealed;
    return quotation.status === filter;
}


function AdminQuotations() {
    const state = useAdminData(getAdminQuotations);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    return (
        <AdminPage state={state} loadingMessage="Loading quotations...">
            {(quotations) => {
                const filtered = quotations.filter((q) =>
                    matchesText(search, [q.quotation_number, q.rfq_number, q.product_name, q.supplier_name]) &&
                    matchesStatus(q, statusFilter)
                );
                const sealedCount = quotations.filter((q) => q.sealed).length;

                return (
                    <>
                        <div className="nallabid-flow-header">
                            <div>
                                <span className="nallabid-flow-eyebrow">ADMIN</span>
                                <h1>All quotations</h1>
                                <p>Every quotation from every supplier, newest first.</p>
                            </div>
                        </div>

                        {sealedCount > 0 && (
                            <div className="nallabid-flow-alert nallabid-flow-alert-info">
                                <i className="bi bi-lock"></i>
                                <span>{sealedCount} quotation(s) are on RFQs that are still open. Their prices stay sealed until the deadline.</span>
                            </div>
                        )}

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Quotations</h2>
                                    <p>Showing {filtered.length} of {quotations.length}</p>
                                </div>
                            </div>

                            <div className="nallabid-flow-toolbar">
                                <label className="nallabid-flow-search">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="search"
                                        placeholder="Search quotation, RFQ, product or supplier..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        aria-label="Search quotations"
                                    />
                                </label>
                                <select className="nallabid-flow-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
                                    {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </div>

                            <QuotationTable quotations={filtered} emptyMessage="No quotations match this search or filter." />
                        </section>
                    </>
                );
            }}
        </AdminPage>
    );
}


export default AdminQuotations;
