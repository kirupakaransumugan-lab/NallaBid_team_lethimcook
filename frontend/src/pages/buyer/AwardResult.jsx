import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { cancelAward, completeAward, getAward } from "../../services/awardService";
import { formatDate, formatLKR } from "../../utils/format";
import ConfirmDialog from "./ConfirmDialog";

import "./awardFlow.css";
import "./AwardResult.css";


function AwardResult() {
    const { rfqId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [award, setAward] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirming, setConfirming] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [completeError, setCompleteError] = useState("");
    const [justCompleted, setJustCompleted] = useState(false);

    const [cancelling, setCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelBusy, setCancelBusy] = useState(false);

    const justAwarded = Boolean(location.state?.justAwarded);

    // setState only runs in promise callbacks, never synchronously inside the effect.
    const loadAward = useCallback(() => getAward(rfqId)
        .then((data) => {
            setAward(data);
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), [rfqId]);

    function retryAward() {
        setLoading(true);
        setError(null);
        loadAward();
    }

    useEffect(() => {
        loadAward();
    }, [loadAward]);

    async function confirmComplete() {
        setCompleting(true);
        setCompleteError("");

        try {
            await completeAward(rfqId);
            setConfirming(false);
            setJustCompleted(true);
            await loadAward();
        } catch (requestError) {
            setCompleteError(requestError.message);
            setConfirming(false);
        } finally {
            setCompleting(false);
        }
    }

    async function confirmCancel() {
        setCancelBusy(true);
        setCompleteError("");

        try {
            await cancelAward(rfqId, cancelReason.trim());
            navigate(`/rfqs/${rfqId}/compare`, { state: { awardCancelled: true } });
        } catch (requestError) {
            setCompleteError(requestError.message);
            setCancelling(false);
        } finally {
            setCancelBusy(false);
        }
    }

    if (loading && !award) {
        return (
            <div className="nallabid-flow-page">
                <Loading message="Loading award result..." />
            </div>
        );
    }

    if (error?.status === 404 && error.message.toLowerCase().includes("not been awarded")) {
        return (
            <div className="nallabid-flow-page">
                <section className="nallabid-flow-panel">
                    <EmptyState
                        icon="bi-hourglass-split"
                        title="Not awarded yet"
                        message="This RFQ does not have an award. Compare the eligible quotations and select a winner."
                    >
                        <Link to={`/rfqs/${rfqId}/compare`} className="nallabid-flow-button nallabid-flow-button-primary">
                            Compare Quotations
                        </Link>
                        <Link to={`/rfqs/${rfqId}`} className="nallabid-flow-button nallabid-flow-button-ghost">
                            RFQ Details
                        </Link>
                    </EmptyState>
                </section>
            </div>
        );
    }

    if (error) {
        return (
            <div className="nallabid-flow-page">
                <ErrorMessage error={error} onRetry={retryAward} backTo="/rfqs" backLabel="Back to My RFQs" />
            </div>
        );
    }

    const isCompleted = award.status === "COMPLETED";

    return (
        <div className="nallabid-flow-page nallabid-award-result">

            <Link to={`/rfqs/${award.rfq_id}`} className="nallabid-flow-back">
                <i className="bi bi-arrow-left"></i>
                Back to RFQ Details
            </Link>

            {justAwarded && !justCompleted && (
                <div className="nallabid-flow-alert nallabid-flow-alert-success" role="status">
                    <i className="bi bi-check-circle"></i>
                    <span>Quotation awarded successfully. The RFQ is now AWARDED.</span>
                </div>
            )}

            {justCompleted && (
                <div className="nallabid-flow-alert nallabid-flow-alert-success" role="status">
                    <i className="bi bi-check-circle"></i>
                    <span>RFQ marked as completed.</span>
                </div>
            )}

            {completeError && (
                <div className="nallabid-flow-alert nallabid-flow-alert-error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{completeError}</span>
                </div>
            )}

            <article className="nallabid-award-card">

                <header className="nallabid-award-hero">
                    <div className="nallabid-award-trophy">
                        <i className="bi bi-trophy-fill"></i>
                    </div>

                    <div className="nallabid-award-hero-text">
                        <p className="nallabid-flow-eyebrow">AWARD RESULT</p>
                        <h1>{award.rfq_number}</h1>
                        <p>{award.product_name} · {award.quantity} units</p>
                    </div>

                    <span className={`nallabid-flow-badge nallabid-flow-badge-${award.status.toLowerCase()}`}>
                        <i className={`bi ${isCompleted ? "bi-check2-all" : "bi-award"}`}></i>
                        {award.status}
                    </span>
                </header>

                <div className="nallabid-award-amount">
                    <span>Awarded amount</span>
                    <strong>{formatLKR(award.awarded_amount)}</strong>
                    <small>{formatLKR(award.unit_price)} per unit</small>
                </div>

                <div className="nallabid-award-sections">

                    <section className="nallabid-award-section">
                        <h2><i className="bi bi-building"></i> Supplier</h2>
                        <dl>
                            <div><dt>Company</dt><dd>{award.supplier_name}</dd></div>
                            <div><dt>Email</dt><dd>{award.supplier_email || "-"}</dd></div>
                            <div><dt>Phone</dt><dd>{award.supplier_phone || "-"}</dd></div>
                        </dl>
                    </section>

                    <section className="nallabid-award-section">
                        <h2><i className="bi bi-file-earmark-check"></i> Quotation</h2>
                        <dl>
                            <div><dt>Quotation</dt><dd>{award.quotation_number}</dd></div>
                            <div>
                                <dt>Delivery</dt>
                                <dd>{award.delivery_days} days <small>(max {award.max_delivery_days})</small></dd>
                            </div>
                            <div>
                                <dt>Warranty</dt>
                                <dd>{award.warranty_months} months <small>(min {award.min_warranty_months})</small></dd>
                            </div>
                        </dl>
                    </section>

                    <section className="nallabid-award-section">
                        <h2><i className="bi bi-calendar-check"></i> Award</h2>
                        <dl>
                            <div><dt>Awarded on</dt><dd>{formatDate(award.awarded_at)}</dd></div>
                            <div><dt>Awarded by</dt><dd>{award.awarded_by_name}</dd></div>
                            <div><dt>RFQ status</dt><dd>{award.rfq_status}</dd></div>
                        </dl>
                    </section>

                </div>

                <footer className="nallabid-award-footer">
                    {isCompleted ? (
                        <p>
                            <i className="bi bi-check2-circle"></i>
                            This procurement is complete.
                        </p>
                    ) : (
                        <>
                            <p>Mark the RFQ as completed once the goods have been delivered.</p>
                            <div className="nallabid-flow-actions">
                                <button
                                    type="button"
                                    className="nallabid-flow-button nallabid-flow-button-ghost nallabid-award-cancel"
                                    onClick={() => setCancelling(true)}
                                >
                                    <i className="bi bi-x-circle"></i>
                                    Cancel Award
                                </button>
                                <button
                                    type="button"
                                    className="nallabid-flow-button nallabid-flow-button-success"
                                    onClick={() => setConfirming(true)}
                                >
                                    <i className="bi bi-check2-all"></i>
                                    Complete RFQ
                                </button>
                            </div>
                        </>
                    )}
                </footer>
            </article>

            {confirming && (
                <ConfirmDialog
                    title="Complete this RFQ?"
                    message="The RFQ and its award will be marked as COMPLETED. This cannot be undone."
                    details={[
                        ["RFQ", award.rfq_number],
                        ["Supplier", award.supplier_name],
                        ["Amount", formatLKR(award.awarded_amount)]
                    ]}
                    confirmLabel="Complete RFQ"
                    confirmIcon="bi-check2-all"
                    busy={completing}
                    onConfirm={confirmComplete}
                    onCancel={() => setConfirming(false)}
                />
            )}

            {cancelling && (
                <ConfirmDialog
                    title="Cancel this award?"
                    message="Use this if you chose the wrong quotation or the supplier withdrew. The award is kept in the history as CANCELLED, the RFQ returns to CLOSED, and this quotation cannot be awarded again."
                    details={[
                        ["Supplier", award.supplier_name],
                        ["Quotation", award.quotation_number],
                        ["Amount", formatLKR(award.awarded_amount)]
                    ]}
                    confirmLabel="Cancel Award"
                    confirmIcon="bi-x-circle"
                    confirmDisabled={cancelReason.trim().length < 5}
                    danger
                    busy={cancelBusy}
                    onConfirm={confirmCancel}
                    onCancel={() => setCancelling(false)}
                >
                    <label className="nallabid-flow-field">
                        <span>Reason (required)</span>
                        <textarea
                            rows="3"
                            maxLength="500"
                            placeholder="e.g. Supplier withdrew their quotation"
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            autoFocus
                        />
                        <small>At least 5 characters. Saved with the award history.</small>
                    </label>
                </ConfirmDialog>
            )}
        </div>
    );
}


export default AwardResult;
