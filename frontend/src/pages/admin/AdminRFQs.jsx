import { useState } from "react";

import { getAdminRFQs } from "../../services/adminService";
import { AdminPage, RFQTable } from "./adminShared";
import { matchesText, useAdminData } from "./adminHooks";


const STATUS_FILTERS = ["ALL", "DRAFT", "OPEN", "CLOSED", "AWARDED", "COMPLETED"];


function AdminRFQs() {
    const state = useAdminData(getAdminRFQs);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    return (
        <AdminPage state={state} loadingMessage="Loading RFQs...">
            {(rfqs) => {
                const filtered = rfqs.filter((rfq) =>
                    matchesText(search, [rfq.rfq_number, rfq.product_name, rfq.buyer_name]) &&
                    (statusFilter === "ALL" || rfq.status === statusFilter)
                );

                return (
                    <>
                        <div className="nallabid-flow-header">
                            <div>
                                <span className="nallabid-flow-eyebrow">ADMIN</span>
                                <h1>All RFQs</h1>
                                <p>Every RFQ from every buyer, newest first.</p>
                            </div>
                        </div>

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>RFQs</h2>
                                    <p>Showing {filtered.length} of {rfqs.length}</p>
                                </div>
                            </div>

                            <div className="nallabid-flow-toolbar">
                                <label className="nallabid-flow-search">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="search"
                                        placeholder="Search RFQ number, product or buyer..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        aria-label="Search RFQs"
                                    />
                                </label>
                                <select className="nallabid-flow-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
                                    {STATUS_FILTERS.map((value) => (
                                        <option key={value} value={value}>{value === "ALL" ? "All statuses" : value}</option>
                                    ))}
                                </select>
                            </div>

                            <RFQTable rfqs={filtered} emptyMessage="No RFQs match this search or filter." />
                        </section>
                    </>
                );
            }}
        </AdminPage>
    );
}


export default AdminRFQs;
