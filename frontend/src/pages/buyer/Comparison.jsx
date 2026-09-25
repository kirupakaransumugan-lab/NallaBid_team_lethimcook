import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { createAward } from "../../services/awardService";
import { getRFQEvaluation } from "../../services/evaluationService";
import { formatLKR } from "../../utils/format";
import ConfirmDialog from "./ConfirmDialog";

import "./awardFlow.css";
import "./Comparison.css";


// Neutral facts about the eligible set. These are labels, not a recommendation:
// the buyer still has to choose.
function highlightTags(quotation, eligible) {
    const prices = eligible.map((item) => Number(item.total_price));
    const deliveries = eligible.map((item) => item.delivery_days);
    const warranties = eligible.map((item) => item.warranty_months);
    const tags = [];

    if (eligible.length < 2) {
        return tags;
    }

    if (Number(quotation.total_price) === Math.min(...prices)) {
        tags.push("Lowest price");
    }

    if (quotation.delivery_days === Math.min(...deliveries)) {
        tags.push("Fastest delivery");
    }

    if (quotation.warranty_months === Math.max(...warranties)) {
        tags.push("Longest warranty");
    }

    return tags;
}


function Comparison() {
    const { rfqId } = useParams();
    const navigate = useNavigate();

    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [awarding, setAwarding] = useState(false);
    const [awardError, setAwardError] = useState(null);

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

    const eligible = useMemo(
        () => (overview?.quotations ?? []).filter(
            (quotation) => quotation.evaluation?.overall_status === "ELIGIBLE"
        ),
        [overview]
    );

    const ineligible = useMemo(
        () => (overview?.quotations ?? []).filter(
            (quotation) => quotation.evaluation?.overall_status === "INELIGIBLE"
        ),
        [overview]
    );

    const selected = eligible.find((quotation) => quotation.id === selectedId);

    async function confirmAward() {
        setAwarding(true);
        setAwardError(null);

        try {
            await createAward(rfqId, selected.id);
            navigate(`/awards/${rfqId}`, { state: { justAwarded: true } });
        } catch (requestError) {
            setAwardError(requestError);
            setConfirming(false);
        } finally {
            setAwarding(false);
        }
    }

    if (loading && !overview) {
        return (
            <div className="nallabid-flow-page">
                <Loading message="Loading quotation comparison..." />
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

    const { rfq } = overview;
    const alreadyAwarded = rfq.status === "AWARDED" || rfq.status === "COMPLETED";

    return (
        <div className="nallabid-flow-page nallabid-compare-page">

            <Link to={`/rfqs/${rfq.id}`} className="nallabid-flow-back">
                <i className="bi bi-arrow-left"></i>
                Back to RFQ Details
            </Link>

            <div className="nallabid-flow-header">
                <div>
                    <p className="nallabid-flow-eyebrow">{rfq.rfq_number} · COMPARISON</p>
                    <h1>Select a winning quotation</h1>
                    <p>
                        {rfq.product_name} · {rfq.quantity} units · max {rfq.max_delivery_days} days delivery ·
                        min {rfq.min_warranty_months} months warranty
                    </p>
                </div>
            </div>

            {awardError && (
                <div className="nallabid-flow-alert nallabid-flow-alert-error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>
                        {awardError.message}
                        {awardError.status === 409 && (
                            <>
                                {" "}
                                <Link to={`/awards/${rfq.id}`}>View the award result</Link>
                            </>
                        )}
                    </span>
                </div>
            )}

            {alreadyAwarded ? (
                <section className="nallabid-flow-panel">
                    <EmptyState
                        icon="bi-trophy"
                        title="This RFQ has already been awarded"
                        message="An RFQ can only have one award."
                    >
                        <Link to={`/awards/${rfq.id}`} className="nallabid-flow-button nallabid-flow-button-primary">
                            View Award Result
                        </Link>
                    </EmptyState>
                </section>
            ) : rfq.status !== "CLOSED" || overview.evaluated_quotations === 0 ? (
                <section className="nallabid-flow-panel">
                    <EmptyState
                        icon="bi-clipboard-check"
                        title="Quotations are not evaluated yet"
                        message="Close the RFQ and run the evaluation first. Only eligible quotations can be awarded."
                    >
                        <Link to={`/rfqs/${rfq.id}`} className="nallabid-flow-button nallabid-flow-button-primary">
                            Go to RFQ Details
                        </Link>
                    </EmptyState>
                </section>
            ) : eligible.length === 0 ? (
                <section className="nallabid-flow-panel">
                    <EmptyState
                        icon="bi-x-octagon"
                        title="No eligible quotations"
                        message="None of the quotations met all the RFQ requirements, so there is nothing to award."
                    />
                </section>
            ) : (
                <>
                    <div className="nallabid-flow-alert nallabid-flow-alert-info">
                        <i className="bi bi-info-circle"></i>
                        <span>
                            Compare the eligible quotations below and choose one to award.
                            The decision is yours: nothing is selected automatically.
                        </span>
                    </div>

                    <fieldset className="nallabid-compare-grid">
                        <legend className="visually-hidden">Eligible quotations</legend>

                        {eligible.map((quotation) => {
                            const isSelected = quotation.id === selectedId;

                            return (
                                <label
                                    key={quotation.id}
                                    className={isSelected ? "nallabid-compare-option is-selected" : "nallabid-compare-option"}
                                >
                                    <input
                                        type="radio"
                                        name="winning-quotation"
                                        value={quotation.id}
                                        checked={isSelected}
                                        onChange={() => setSelectedId(quotation.id)}
                                    />

                                    <div className="nallabid-compare-option-head">
                                        <div>
                                            <strong>{quotation.supplier_name}</strong>
                                            <small>{quotation.quotation_number}</small>
                                        </div>

                                        <span className="nallabid-compare-radio" aria-hidden="true">
                                            {isSelected && <i className="bi bi-check-lg"></i>}
                                        </span>
                                    </div>

                                    <div className="nallabid-compare-amount">
                                        {formatLKR(quotation.total_price)}
                                        <small>{formatLKR(quotation.unit_price)} / unit</small>
                                    </div>

                                    <dl className="nallabid-compare-specs">
                                        <div>
                                            <dt>Delivery</dt>
                                            <dd>{quotation.delivery_days} days</dd>
                                        </div>
                                        <div>
                                            <dt>Warranty</dt>
                                            <dd>{quotation.warranty_months} months</dd>
                                        </div>
                                    </dl>

                                    {highlightTags(quotation, eligible).length > 0 && (
                                        <div className="nallabid-compare-tags">
                                            {highlightTags(quotation, eligible).map((tag) => (
                                                <span key={tag}>{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    {quotation.notes && (
                                        <p className="nallabid-compare-notes">{quotation.notes}</p>
                                    )}
                                </label>
                            );
                        })}
                    </fieldset>

                    <div className="nallabid-compare-bar">
                        <span>
                            {selected
                                ? <>Selected: <strong>{selected.supplier_name}</strong> · {formatLKR(selected.total_price)}</>
                                : "Select an eligible quotation to continue."}
                        </span>

                        <button
                            type="button"
                            className="nallabid-flow-button nallabid-flow-button-success"
                            disabled={!selected}
                            onClick={() => setConfirming(true)}
                        >
                            <i className="bi bi-trophy"></i>
                            Award Quotation
                        </button>
                    </div>
                </>
            )}

            {ineligible.length > 0 && (
                <section className="nallabid-flow-panel">
                    <div className="nallabid-flow-panel-head">
                        <div>
                            <h2>Ineligible quotations</h2>
                            <p>These did not meet the requirements and cannot be awarded.</p>
                        </div>
                    </div>

                    <div className="nallabid-flow-table-wrap">
                        <table className="nallabid-flow-table">
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th className="nallabid-flow-num">Total price</th>
                                    <th className="nallabid-flow-num">Delivery</th>
                                    <th className="nallabid-flow-num">Warranty</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ineligible.map((quotation) => (
                                    <tr key={quotation.id}>
                                        <td>{quotation.supplier_name}</td>
                                        <td className="nallabid-flow-num">{formatLKR(quotation.total_price)}</td>
                                        <td className="nallabid-flow-num">{quotation.delivery_days} days</td>
                                        <td className="nallabid-flow-num">{quotation.warranty_months} months</td>
                                        <td className="nallabid-flow-muted">{quotation.evaluation.failure_reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {confirming && selected && (
                <ConfirmDialog
                    title="Confirm award"
                    message="Awarding is final. The RFQ will move to AWARDED and no other quotation can be awarded."
                    details={[
                        ["RFQ", rfq.rfq_number],
                        ["Supplier", selected.supplier_name],
                        ["Quotation", selected.quotation_number],
                        ["Amount", formatLKR(selected.total_price)],
                        ["Delivery", `${selected.delivery_days} days`],
                        ["Warranty", `${selected.warranty_months} months`]
                    ]}
                    confirmLabel="Confirm Award"
                    confirmIcon="bi-trophy"
                    busy={awarding}
                    onConfirm={confirmAward}
                    onCancel={() => setConfirming(false)}
                />
            )}
        </div>
    );
}


export default Comparison;
