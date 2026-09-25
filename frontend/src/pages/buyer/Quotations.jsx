import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { getReceivedQuotations } from "../../services/buyerWorkspaceService";
import { formatDate, formatLKR } from "../../utils/format";

import "./awardFlow.css";
import "./Quotations.css";


const STATUS_FILTERS = [
    ["ALL", "All statuses"],
    ["PENDING", "Pending evaluation"],
    ["ELIGIBLE", "Eligible"],
    ["INELIGIBLE", "Ineligible"],
    ["AWARDED", "Awarded"]
];


function matchesStatus(quotation, filter) {
    if (filter === "ALL") return true;
    if (filter === "AWARDED") return quotation.is_awarded;
    return quotation.eligibility === filter;
}


function QuotationActions({ quotation }) {
    if (quotation.is_awarded) {
        return (
            <Link to={`/awards/${quotation.rfq_id}`} className="nallabid-flow-button nallabid-flow-button-ghost nallabid-quotes-action">
                <i className="bi bi-trophy"></i>
                Award
            </Link>
        );
    }

    if (quotation.eligibility === "ELIGIBLE" && quotation.rfq_status === "CLOSED") {
        return (
            <Link to={`/rfqs/${quotation.rfq_id}/compare`} className="nallabid-flow-button nallabid-flow-button-primary nallabid-quotes-action">
                <i className="bi bi-layout-three-columns"></i>
                Compare
            </Link>
        );
    }

    return (
        <Link to={`/rfqs/${quotation.rfq_id}`} className="nallabid-flow-button nallabid-flow-button-ghost nallabid-quotes-action">
            View RFQ
            <i className="bi bi-arrow-right"></i>
        </Link>
    );
}


function Quotations() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [rfqFilter, setRfqFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // setState only runs in promise callbacks, never synchronously inside the effect.
    const loadQuotations = useCallback(() => getReceivedQuotations()
        .then((result) => {
            setData(result);
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), []);

    function retryQuotations() {
        setLoading(true);
        setError(null);
        loadQuotations();
    }

    useEffect(() => {
        loadQuotations();
    }, [loadQuotations]);

    const filtered = useMemo(() => {
        const text = search.trim().toLowerCase();

        return (data?.quotations ?? []).filter((quotation) => {
            const matchesText = !text || [
                quotation.quotation_number,
                quotation.supplier_name,
                quotation.rfq_number,
                quotation.product_name
            ].some((value) => value.toLowerCase().includes(text));

            const matchesRfq = rfqFilter === "ALL" || String(quotation.rfq_id) === rfqFilter;

            return matchesText && matchesRfq && matchesStatus(quotation, statusFilter);
        });
    }, [data, search, rfqFilter, statusFilter]);

    if (loading && !data) {
        return (
            <div className="nallabid-flow-page">
                <Loading message="Loading quotations..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="nallabid-flow-page">
                <ErrorMessage error={error} onRetry={retryQuotations} />
            </div>
        );
    }

    const { stats } = data;
    const hasFilters = search || rfqFilter !== "ALL" || statusFilter !== "ALL";

    return (
        <div className="nallabid-flow-page nallabid-quotes-page">

            <div className="nallabid-flow-header">
                <div>
                    <h1>Quotations</h1>
                    <p>Every quotation suppliers have submitted to your RFQs.</p>
                </div>
            </div>

            <div className="nallabid-flow-facts">
                <div className="nallabid-flow-fact">
                    <span>Total received</span>
                    <strong>{stats.total}</strong>
                </div>
                <div className="nallabid-flow-fact">
                    <span>Pending evaluation</span>
                    <strong>{stats.pending_evaluation}</strong>
                </div>
                <div className="nallabid-flow-fact">
                    <span>Eligible</span>
                    <strong className="nallabid-quotes-good">{stats.eligible}</strong>
                </div>
                <div className="nallabid-flow-fact">
                    <span>Ineligible</span>
                    <strong className="nallabid-quotes-bad">{stats.ineligible}</strong>
                </div>
                <div className="nallabid-flow-fact">
                    <span>Awarded</span>
                    <strong className="nallabid-quotes-award">{stats.awarded}</strong>
                </div>
            </div>

            <section className="nallabid-flow-panel">
                <div className="nallabid-flow-panel-head">
                    <div>
                        <h2>Received quotations</h2>
                        <p>
                            {stats.total === 0
                                ? "No quotations yet"
                                : `Showing ${filtered.length} of ${stats.total} across ${stats.rfqs_with_quotations} RFQ(s)`}
                        </p>
                    </div>
                </div>

                {stats.total > 0 && (
                    <div className="nallabid-flow-toolbar">
                        <label className="nallabid-flow-search">
                            <i className="bi bi-search"></i>
                            <input
                                type="search"
                                placeholder="Search quotation, supplier, RFQ or product..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                aria-label="Search quotations"
                            />
                        </label>

                        <select
                            className="nallabid-flow-select"
                            value={rfqFilter}
                            onChange={(event) => setRfqFilter(event.target.value)}
                            aria-label="Filter by RFQ"
                        >
                            <option value="ALL">All RFQs</option>
                            {data.rfq_options
                                .filter((option) => option.quotation_count > 0)
                                .map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.rfq_number} · {option.product_name}
                                    </option>
                                ))}
                        </select>

                        <select
                            className="nallabid-flow-select"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            aria-label="Filter by status"
                        >
                            {STATUS_FILTERS.map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {stats.total === 0 ? (
                    <EmptyState
                        icon="bi-file-earmark-check"
                        title="No quotations received yet"
                        message="Publish an RFQ so suppliers can submit quotations. They will appear here."
                    >
                        <Link to="/rfqs" className="nallabid-flow-button nallabid-flow-button-primary">
                            Go to My RFQs
                        </Link>
                    </EmptyState>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="bi-funnel"
                        title="No matching quotations"
                        message="Try a different search or filter."
                    >
                        {hasFilters && (
                            <button
                                type="button"
                                className="nallabid-flow-button nallabid-flow-button-ghost"
                                onClick={() => {
                                    setSearch("");
                                    setRfqFilter("ALL");
                                    setStatusFilter("ALL");
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </EmptyState>
                ) : (
                    <div className="nallabid-flow-table-wrap">
                        <table className="nallabid-flow-table">
                            <thead>
                                <tr>
                                    <th>Quotation</th>
                                    <th>RFQ</th>
                                    <th>Supplier</th>
                                    <th className="nallabid-flow-num">Total price</th>
                                    <th className="nallabid-flow-num">Delivery</th>
                                    <th className="nallabid-flow-num">Warranty</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((quotation) => (
                                    <tr key={quotation.id}>
                                        <td>
                                            <strong>{quotation.quotation_number}</strong>
                                            <span className="nallabid-flow-sub">{formatDate(quotation.submitted_at)}</span>
                                        </td>
                                        <td>
                                            <Link to={`/rfqs/${quotation.rfq_id}`} className="nallabid-flow-link">
                                                {quotation.rfq_number}
                                            </Link>
                                            <span className="nallabid-flow-sub">{quotation.product_name}</span>
                                        </td>
                                        <td>
                                            <Link to={`/suppliers/${quotation.supplier_id}`} className="nallabid-flow-link">
                                                {quotation.supplier_name}
                                            </Link>
                                        </td>
                                        <td className="nallabid-flow-num">
                                            {formatLKR(quotation.total_price)}
                                            <span className="nallabid-flow-sub">{formatLKR(quotation.unit_price)} / unit</span>
                                        </td>
                                        <td className="nallabid-flow-num">{quotation.delivery_days} days</td>
                                        <td className="nallabid-flow-num">{quotation.warranty_months} months</td>
                                        <td>
                                            {quotation.is_awarded ? (
                                                <span className="nallabid-flow-badge nallabid-flow-badge-awarded">
                                                    <i className="bi bi-trophy"></i>
                                                    Awarded
                                                </span>
                                            ) : (
                                                <span
                                                    className={`nallabid-flow-badge nallabid-flow-badge-${quotation.eligibility.toLowerCase()}`}
                                                    title={quotation.failure_reason || undefined}
                                                >
                                                    {quotation.eligibility === "PENDING" ? "Pending evaluation" : quotation.eligibility}
                                                </span>
                                            )}
                                            {quotation.failure_reason && (
                                                <span className="nallabid-flow-sub nallabid-quotes-reason">{quotation.failure_reason}</span>
                                            )}
                                        </td>
                                        <td className="nallabid-flow-num">
                                            <QuotationActions quotation={quotation} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}


export default Quotations;
