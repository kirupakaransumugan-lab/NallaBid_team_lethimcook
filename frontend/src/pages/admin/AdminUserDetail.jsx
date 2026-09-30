import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";

import { getAdminUser } from "../../services/adminService";
import { formatDate } from "../../utils/format";
import { ActiveBadge, AdminPage, AwardTable, QuotationTable, RFQTable, RoleBadge, StatusToggleButton } from "./adminShared";
import { useAdminData, useStatusToggle } from "./adminHooks";


function AdminUserDetail() {
    const { userId } = useParams();
    const state = useAdminData(useCallback(() => getAdminUser(userId), [userId]));

    const toggle = useStatusToggle((updated) => state.setData((detail) => ({ ...detail, user: updated })));

    return (
        <AdminPage state={state} loadingMessage="Loading user...">
            {(detail) => {
                const { user } = detail;
                const isSupplier = user.role === "SUPPLIER";

                return (
                    <>
                        <Link to="/admin/users" className="nallabid-flow-back">
                            <i className="bi bi-arrow-left"></i>
                            All users
                        </Link>

                        <div className="nallabid-flow-header">
                            <div>
                                <span className="nallabid-flow-eyebrow">USER #{user.id}</span>
                                <h1>{user.full_name}</h1>
                                <div className="nallabid-flow-actions">
                                    <RoleBadge user={user} />
                                    <ActiveBadge active={user.is_active} />
                                </div>
                            </div>
                            <StatusToggleButton user={user} onClick={toggle.ask} />
                        </div>

                        {toggle.alert}

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Account details</h2>
                                    <p>{isSupplier ? "Supplier profile" : "Buyer company profile"}</p>
                                </div>
                            </div>
                            <div className="nallabid-flow-panel-body">
                                <dl className="nallabid-admin-details">
                                    <div><dt>Login email</dt><dd>{user.email}</dd></div>
                                    <div><dt>Company</dt><dd>{user.company_name || "-"}</dd></div>
                                    <div><dt>Company email</dt><dd>{detail.company_email || "-"}</dd></div>
                                    <div><dt>Phone</dt><dd>{detail.phone || "-"}</dd></div>
                                    <div><dt>Address</dt><dd>{detail.address || "-"}</dd></div>
                                    <div><dt>Joined</dt><dd>{formatDate(user.created_at)}</dd></div>
                                </dl>
                            </div>
                        </section>

                        {isSupplier ? (
                            <section className="nallabid-flow-panel">
                                <div className="nallabid-flow-panel-head">
                                    <div>
                                        <h2>Quotation history</h2>
                                        <p>{detail.quotations.length} quotation(s) submitted</p>
                                    </div>
                                </div>
                                <QuotationTable quotations={detail.quotations} showSupplier={false} emptyMessage="This supplier has not quoted yet." />
                            </section>
                        ) : (
                            <section className="nallabid-flow-panel">
                                <div className="nallabid-flow-panel-head">
                                    <div>
                                        <h2>RFQ history</h2>
                                        <p>{detail.rfqs.length} RFQ(s) created</p>
                                    </div>
                                </div>
                                <RFQTable rfqs={detail.rfqs} showBuyer={false} emptyMessage="This buyer has not created an RFQ yet." />
                            </section>
                        )}

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Awards</h2>
                                    <p>{isSupplier ? "Contracts won, including cancelled ones" : "Awards given, including cancelled ones"}</p>
                                </div>
                            </div>
                            <AwardTable awards={detail.awards} emptyMessage="No awards yet." />
                        </section>

                        {toggle.dialog}
                    </>
                );
            }}
        </AdminPage>
    );
}


export default AdminUserDetail;
