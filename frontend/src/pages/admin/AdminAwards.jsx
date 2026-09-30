import { useState } from "react";

import { getAdminAwards } from "../../services/adminService";
import { AdminPage, AwardTable } from "./adminShared";
import { matchesText, useAdminData } from "./adminHooks";


const STATUS_FILTERS = [["ALL", "All statuses"], ["AWARDED", "Awarded"], ["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"]];


function AdminAwards() {
    const state = useAdminData(getAdminAwards);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    return (
        <AdminPage state={state} loadingMessage="Loading awards...">
            {(awards) => {
                const filtered = awards.filter((award) =>
                    matchesText(search, [award.rfq_number, award.product_name, award.buyer_name, award.supplier_name]) &&
                    (statusFilter === "ALL" || award.status === statusFilter)
                );
                const count = (status) => awards.filter((award) => award.status === status).length;

                return (
                    <>
                        <div className="nallabid-flow-header">
                            <div>
                                <span className="nallabid-flow-eyebrow">ADMIN</span>
                                <h1>Award history</h1>
                                <p>Every award decision, including cancelled ones and their reasons.</p>
                            </div>
                        </div>

                        <div className="nallabid-flow-facts">
                            <div className="nallabid-flow-fact"><span>Awarded</span><strong>{count("AWARDED")}</strong></div>
                            <div className="nallabid-flow-fact"><span>Completed</span><strong>{count("COMPLETED")}</strong></div>
                            <div className="nallabid-flow-fact"><span>Cancelled</span><strong>{count("CANCELLED")}</strong></div>
                        </div>

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Awards</h2>
                                    <p>Showing {filtered.length} of {awards.length}</p>
                                </div>
                            </div>

                            <div className="nallabid-flow-toolbar">
                                <label className="nallabid-flow-search">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="search"
                                        placeholder="Search RFQ, product, buyer or supplier..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        aria-label="Search awards"
                                    />
                                </label>
                                <select className="nallabid-flow-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
                                    {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </div>

                            <AwardTable awards={filtered} emptyMessage="No awards match this search or filter." />
                        </section>
                    </>
                );
            }}
        </AdminPage>
    );
}


export default AdminAwards;
