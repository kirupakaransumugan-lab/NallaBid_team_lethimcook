import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";

import { getAdminRFQ } from "../../services/adminService";
import { formatDateTime } from "../../utils/format";
import { AdminPage, AwardTable, QuotationTable, StatusBadge } from "./adminShared";
import { useAdminData } from "./adminHooks";


function AdminRFQDetail() {
    const { rfqId } = useParams();
    const state = useAdminData(useCallback(() => getAdminRFQ(rfqId), [rfqId]));

    return (
        <AdminPage state={state} loadingMessage="Loading RFQ...">
            {(detail) => {
                const { rfq } = detail;
                const sealed = detail.quotations.some((q) => q.sealed);

                return (
                    <>
                        <Link to="/admin/rfqs" className="nallabid-flow-back">
                            <i className="bi bi-arrow-left"></i>
                            All RFQs
                        </Link>

                        <div className="nallabid-flow-header">
                            <div>
                                <span className="nallabid-flow-eyebrow">{rfq.rfq_number}</span>
                                <h1>{rfq.product_name}</h1>
                                <StatusBadge status={rfq.status} />
                            </div>
                        </div>

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Requirements</h2>
                                    <p>What the buyer asked for</p>
                                </div>
                            </div>
                            <div className="nallabid-flow-panel-body">
                                <dl className="nallabid-admin-details">
                                    <div>
                                        <dt>Buyer</dt>
                                        <dd>
                                            <Link to={`/admin/users/${rfq.buyer_id}`} className="nallabid-flow-link">{rfq.buyer_name}</Link>
                                            <span className="nallabid-flow-sub">{detail.buyer_email}</span>
                                        </dd>
                                    </div>
                                    <div><dt>Quantity</dt><dd>{rfq.quantity}</dd></div>
                                    <div><dt>Max delivery</dt><dd>{detail.max_delivery_days} days</dd></div>
                                    <div><dt>Min warranty</dt><dd>{detail.min_warranty_months} months</dd></div>
                                    <div><dt>Deadline</dt><dd>{formatDateTime(rfq.deadline)}</dd></div>
                                    <div><dt>Created</dt><dd>{formatDateTime(rfq.created_at)}</dd></div>
                                    <div><dt>Description</dt><dd>{detail.description || "-"}</dd></div>
                                </dl>
                            </div>
                        </section>

                        {sealed && (
                            <div className="nallabid-flow-alert nallabid-flow-alert-info">
                                <i className="bi bi-lock"></i>
                                <span>Bidding is still open, so prices and terms stay sealed for everyone, including admins, until the deadline passes.</span>
                            </div>
                        )}

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Quotations</h2>
                                    <p>{detail.quotations.length} received, lowest price first</p>
                                </div>
                            </div>
                            <QuotationTable quotations={detail.quotations} showRfq={false} emptyMessage="No supplier has quoted on this RFQ." />
                        </section>

                        <section className="nallabid-flow-panel">
                            <div className="nallabid-flow-panel-head">
                                <div>
                                    <h2>Award history</h2>
                                    <p>Current award and any cancelled ones</p>
                                </div>
                            </div>
                            <AwardTable awards={detail.awards} emptyMessage="This RFQ has not been awarded." />
                        </section>
                    </>
                );
            }}
        </AdminPage>
    );
}


export default AdminRFQDetail;
