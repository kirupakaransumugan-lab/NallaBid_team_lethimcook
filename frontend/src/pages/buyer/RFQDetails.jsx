import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { getRFQEvaluation, runEvaluation } from "../../services/evaluationService";
import { closeRFQ, publishRFQ } from "../../services/rfqService";
import { formatDate, formatLKR } from "../../utils/format";
import ConfirmDialog from "./ConfirmDialog";

import "./awardFlow.css";
import "./RFQDetails.css";


const WORKFLOW_STEPS = ["DRAFT", "OPEN", "CLOSED", "EVALUATED", "AWARDED", "COMPLETED"];


function currentStep(rfqStatus, evaluatedCount) {
    if (rfqStatus === "CLOSED" && evaluatedCount > 0) {
        return "EVALUATED";
    }

    return rfqStatus;
}


function eligibilityOf(quotation) {
    return quotation.evaluation?.overall_status ?? "PENDING";
}


const ACTION_CONFIRMATIONS = {
    publish: {
        title: "Publish this RFQ?",
        message: "Suppliers will be able to see it and submit quotations until the deadline.",
        label: "Publish RFQ",
        icon: "bi-send"
    },
    close: {
        title: "Close this RFQ?",
        message: "Suppliers will no longer be able to submit or edit quotations. You can then evaluate the quotations received.",
        label: "Close RFQ",
        icon: "bi-lock"
    },
    evaluate: {
        title: "Evaluate quotations?",
        message: "Every quotation will be checked against the delivery, warranty and quantity requirements. Running it again refreshes the results.",
        label: "Run Evaluation",
        icon: "bi-clipboard-check"
    }
};


function RFQDetails() {
    const { rfqId } = useParams();

    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pendingAction, setPendingAction] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");

    // setState only runs in promise callbacks, never synchronously inside the effect.
    const loadOverview = useCallback(() => getRFQEvaluation(rfqId)
        .then((data) => {
            setOverview(data);
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), [rfqId]);

    function retryOverview() {
        setLoading(true);
        setError(null);
        loadOverview();
    }

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    async function performAction() {
        setActionBusy(true);
        setActionError("");
        setActionSuccess("");

        try {
            if (pendingAction === "publish") {
                await publishRFQ(rfqId);
                setActionSuccess("RFQ published. Suppliers can now submit quotations.");
            } else if (pendingAction === "close") {
                await closeRFQ(rfqId);
                setActionSuccess("RFQ closed. You can now evaluate the quotations.");
            } else if (pendingAction === "evaluate") {
                const result = await runEvaluation(rfqId);
                setActionSuccess(
                    `Evaluated ${result.evaluated_count} quotations: ${result.eligible_count} eligible, ${result.ineligible_count} ineligible.`
                );
            }

            setPendingAction(null);
            await loadOverview();
        } catch (requestError) {
            setActionError(requestError.message);
            setPendingAction(null);
        } finally {
            setActionBusy(false);
        }
    }

    if (loading && !overview) {
        return (
            <div className="nallabid-flow-page">
                <Loading message="Loading RFQ details..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="nallabid-flow-page">
                <ErrorMessage error={error} onRetry={retryOverview} backTo="/rfqs" backLabel="Back to My RFQs" />
            </div>
        );
    }

    const { rfq, quotations } = overview;
    const step = currentStep(rfq.status, overview.evaluated_quotations);
    const stepIndex = WORKFLOW_STEPS.indexOf(step);
    const confirmation = pendingAction ? ACTION_CONFIRMATIONS[pendingAction] : null;

    return (
        <div className="nallabid-flow-page nallabid-rfq-details">

            <Link to="/rfqs" className="nallabid-flow-back">
                <i className="bi bi-arrow-left"></i>
                Back to My RFQs
            </Link>

            <div className="nallabid-flow-header">
                <div>
                    <p className="nallabid-flow-eyebrow">{rfq.rfq_number}</p>
                    <h1>{rfq.product_name}</h1>
                    <p>{rfq.description || "No description provided."}</p>
                </div>

                <div className="nallabid-flow-actions">
                    {rfq.status === "DRAFT" && (
                        <button
                            type="button"
                            className="nallabid-flow-button nallabid-flow-button-primary"
                            onClick={() => setPendingAction("publish")}
                        >
                            <i className="bi bi-send"></i>
                            Publish RFQ
                        </button>
                    )}

                    {rfq.status === "OPEN" && (
                        <button
                            type="button"
                            className="nallabid-flow-button nallabid-flow-button-primary"
                            onClick={() => setPendingAction("close")}
                        >
                            <i className="bi bi-lock"></i>
                            Close RFQ
                        </button>
                    )}

                    {rfq.status === "CLOSED" && overview.total_quotations > 0 && (
                        <button
                            type="button"
                            className={`nallabid-flow-button ${
                                overview.evaluated_quotations > 0
                                    ? "nallabid-flow-button-ghost"
                                    : "nallabid-flow-button-primary"
                            }`}
                            onClick={() => setPendingAction("evaluate")}
                        >
                            <i className="bi bi-clipboard-check"></i>
                            {overview.evaluated_quotations > 0 ? "Re-run Evaluation" : "Run Evaluation"}
                        </button>
                    )}

                    {rfq.status === "CLOSED" && overview.eligible_quotations > 0 && (
                        <Link
                            to={`/rfqs/${rfq.id}/compare`}
                            className="nallabid-flow-button nallabid-flow-button-primary"
                        >
                            <i className="bi bi-trophy"></i>
                            Compare &amp; Select Winner
                        </Link>
                    )}

                    {(rfq.status === "AWARDED" || rfq.status === "COMPLETED") && (
                        <Link
                            to={`/awards/${rfq.id}`}
                            className="nallabid-flow-button nallabid-flow-button-primary"
                        >
                            <i className="bi bi-award"></i>
                            View Award Result
                        </Link>
                    )}
                </div>
            </div>

            {actionError && (
                <div className="nallabid-flow-alert nallabid-flow-alert-error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{actionError}</span>
                </div>
            )}

            {actionSuccess && (
                <div className="nallabid-flow-alert nallabid-flow-alert-success" role="status">
                    <i className="bi bi-check-circle"></i>
                    <span>{actionSuccess}</span>
                </div>
            )}

            {/* Workflow progress */}

            <ol className="nallabid-rfq-steps" aria-label="RFQ progress">
                {WORKFLOW_STEPS.map((name, index) => (
                    <li
                        key={name}
                        className={
                            index < stepIndex
                                ? "nallabid-rfq-step is-done"
                                : index === stepIndex
                                    ? "nallabid-rfq-step is-current"
                                    : "nallabid-rfq-step"
                        }
                    >
                        <span className="nallabid-rfq-step-dot">
                            {index < stepIndex ? <i className="bi bi-check"></i> : index + 1}
                        </span>
                        <span className="nallabid-rfq-step-label">
                            {name.charAt(0) + name.slice(1).toLowerCase()}
                        </span>
                    </li>
                ))}
            </ol>

            {/* RFQ requirements */}

            <div className="nallabid-flow-facts">
                <div className="nallabid-flow-fact">
                    <span>Status</span>
                    <strong>
                        <span className={`nallabid-flow-badge nallabid-flow-badge-${rfq.status.toLowerCase()}`}>
                            {rfq.status}
                        </span>
                    </strong>
                </div>

                <div className="nallabid-flow-fact">
                    <span>Quantity</span>
                    <strong>{rfq.quantity}</strong>
                </div>

                <div className="nallabid-flow-fact">
                    <span>Maximum delivery</span>
                    <strong>{rfq.max_delivery_days} days</strong>
                </div>

                <div className="nallabid-flow-fact">
                    <span>Minimum warranty</span>
                    <strong>{rfq.min_warranty_months} months</strong>
                </div>

                <div className="nallabid-flow-fact">
                    <span>Deadline</span>
                    <strong>{formatDate(rfq.deadline)}</strong>
                </div>
            </div>

            {/* Evaluation status */}

            <div className="nallabid-flow-facts">
                <div className="nallabid-flow-fact">
                    <span>Quotations received</span>
                    <strong>{overview.total_quotations}</strong>
                </div>

                <div className="nallabid-flow-fact">
                    <span>Evaluated</span>
                    <strong>{overview.evaluated_quotations}</strong>
                </div>

                <div className="nallabid-flow-fact">
                    <span>Eligible</span>
                    <strong className="nallabid-rfq-good">{overview.eligible_quotations}</strong>
                </div>

                <div className="nallabid-flow-fact">
                    <span>Ineligible</span>
                    <strong className="nallabid-rfq-bad">{overview.ineligible_quotations}</strong>
                </div>
            </div>

            {rfq.status === "CLOSED" && overview.evaluated_quotations > 0 && overview.eligible_quotations === 0 && (
                <div className="nallabid-flow-alert nallabid-flow-alert-info">
                    <i className="bi bi-info-circle"></i>
                    <span>No quotation met all requirements, so this RFQ cannot be awarded.</span>
                </div>
            )}

            {/* Quotations */}

            <section className="nallabid-flow-panel">
                <div className="nallabid-flow-panel-head">
                    <div>
                        <h2>Quotations</h2>
                        <p>All quotations submitted for this RFQ with their evaluation result.</p>
                    </div>
                </div>

                {quotations.length === 0 ? (
                    <EmptyState
                        icon="bi-file-earmark-text"
                        title="No quotations yet"
                        message={
                            rfq.status === "DRAFT"
                                ? "Publish this RFQ so suppliers can submit quotations."
                                : "Quotations submitted by suppliers will appear here."
                        }
                    />
                ) : (
                    <div className="nallabid-flow-table-wrap">
                        <table className="nallabid-flow-table">
                            <thead>
                                <tr>
                                    <th>Quotation</th>
                                    <th>Supplier</th>
                                    <th className="nallabid-flow-num">Unit price</th>
                                    <th className="nallabid-flow-num">Total price</th>
                                    <th className="nallabid-flow-num">Delivery</th>
                                    <th className="nallabid-flow-num">Warranty</th>
                                    <th>Eligibility</th>
                                    <th>Evaluation result</th>
                                </tr>
                            </thead>

                            <tbody>
                                {quotations.map((quotation) => {
                                    const eligibility = eligibilityOf(quotation);

                                    return (
                                        <tr key={quotation.id}>
                                            <td>
                                                <strong>{quotation.quotation_number}</strong>
                                                {quotation.is_awarded && (
                                                    <div>
                                                        <span className="nallabid-flow-badge nallabid-flow-badge-awarded">
                                                            <i className="bi bi-trophy"></i>
                                                            Awarded
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>{quotation.supplier_name}</td>
                                            <td className="nallabid-flow-num">{formatLKR(quotation.unit_price)}</td>
                                            <td className="nallabid-flow-num">{formatLKR(quotation.total_price)}</td>
                                            <td className="nallabid-flow-num">{quotation.delivery_days} days</td>
                                            <td className="nallabid-flow-num">{quotation.warranty_months} months</td>
                                            <td>
                                                <span className={`nallabid-flow-badge nallabid-flow-badge-${eligibility.toLowerCase()}`}>
                                                    {eligibility === "PENDING" ? "Not evaluated" : eligibility}
                                                </span>
                                            </td>
                                            <td className="nallabid-flow-muted">
                                                {eligibility === "PENDING"
                                                    ? "-"
                                                    : quotation.evaluation.failure_reason || "Meets all requirements"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {confirmation && (
                <ConfirmDialog
                    title={confirmation.title}
                    message={confirmation.message}
                    confirmLabel={confirmation.label}
                    confirmIcon={confirmation.icon}
                    busy={actionBusy}
                    onConfirm={performAction}
                    onCancel={() => setPendingAction(null)}
                />
            )}
        </div>
    );
}


export default RFQDetails;
