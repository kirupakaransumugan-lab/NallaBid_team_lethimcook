import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { getSupplierDirectory } from "../../services/buyerWorkspaceService";
import { formatLKR } from "../../utils/format";

import "./awardFlow.css";
import "./Suppliers.css";


const ENGAGEMENT_FILTERS = [
    ["ALL", "All suppliers"],
    ["QUOTED", "Quoted on my RFQs"],
    ["AWARDED", "Awarded by me"],
    ["NEW", "Not worked with yet"]
];


function matchesEngagement(supplier, filter) {
    const { quotations, awards } = supplier.engagement;

    if (filter === "QUOTED") return quotations > 0;
    if (filter === "AWARDED") return awards > 0;
    if (filter === "NEW") return quotations === 0;
    return true;
}


function initials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}


function SupplierCard({ supplier }) {
    const { engagement } = supplier;

    return (
        <article className="nallabid-supplier-card">
            <header className="nallabid-supplier-card-head">
                <div className="nallabid-supplier-avatar" aria-hidden="true">
                    {initials(supplier.company_name)}
                </div>

                <div className="nallabid-supplier-card-title">
                    <h3>{supplier.company_name}</h3>
                    <span>{supplier.catalogue_items} catalogue item{supplier.catalogue_items === 1 ? "" : "s"}</span>
                </div>

                {engagement.awards > 0 && (
                    <span className="nallabid-flow-badge nallabid-flow-badge-awarded">
                        <i className="bi bi-trophy"></i>
                        {engagement.awards}
                    </span>
                )}
            </header>

            <ul className="nallabid-supplier-contact">
                <li>
                    <i className="bi bi-envelope"></i>
                    {supplier.email ? <a href={`mailto:${supplier.email}`}>{supplier.email}</a> : <span>No email</span>}
                </li>
                <li>
                    <i className="bi bi-telephone"></i>
                    <span>{supplier.phone || "No phone"}</span>
                </li>
            </ul>

            <dl className="nallabid-supplier-metrics">
                <div>
                    <dt>Quotations</dt>
                    <dd>{engagement.quotations}</dd>
                </div>
                <div>
                    <dt>Eligibility</dt>
                    <dd>{engagement.eligibility_rate === null ? "-" : `${engagement.eligibility_rate}%`}</dd>
                </div>
                <div>
                    <dt>Awarded value</dt>
                    <dd>{engagement.awards > 0 ? formatLKR(engagement.awarded_value) : "-"}</dd>
                </div>
            </dl>

            <Link
                to={`/suppliers/${supplier.id}`}
                className="nallabid-flow-button nallabid-flow-button-ghost nallabid-supplier-card-link"
            >
                View Profile
                <i className="bi bi-arrow-right"></i>
            </Link>
        </article>
    );
}


function Suppliers() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [engagementFilter, setEngagementFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("NAME");

    // setState only runs in promise callbacks, never synchronously inside the effect.
    const loadSuppliers = useCallback(() => getSupplierDirectory()
        .then((result) => {
            setData(result);
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), []);

    function retrySuppliers() {
        setLoading(true);
        setError(null);
        loadSuppliers();
    }

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    const visible = useMemo(() => {
        const text = search.trim().toLowerCase();

        const list = (data?.suppliers ?? []).filter((supplier) => {
            const matchesText = !text || [supplier.company_name, supplier.email ?? "", supplier.phone ?? ""]
                .some((value) => value.toLowerCase().includes(text));

            return matchesText && matchesEngagement(supplier, engagementFilter);
        });

        const sorters = {
            NAME: (a, b) => a.company_name.localeCompare(b.company_name),
            QUOTATIONS: (a, b) => b.engagement.quotations - a.engagement.quotations,
            AWARDS: (a, b) => Number(b.engagement.awarded_value) - Number(a.engagement.awarded_value)
        };

        return [...list].sort(sorters[sortBy]);
    }, [data, search, engagementFilter, sortBy]);

    if (loading && !data) {
        return (
            <div className="nallabid-flow-page">
                <Loading message="Loading suppliers..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="nallabid-flow-page">
                <ErrorMessage error={error} onRetry={retrySuppliers} />
            </div>
        );
    }

    const { stats } = data;

    return (
        <div className="nallabid-flow-page nallabid-suppliers-page">

            <div className="nallabid-flow-header">
                <div>
                    <h1>Suppliers</h1>
                    <p>Registered suppliers, their catalogues and how they have performed on your RFQs.</p>
                </div>
            </div>

            <div className="nallabid-flow-facts">
                <div className="nallabid-flow-fact">
                    <span>Registered suppliers</span>
                    <strong>{stats.total_suppliers}</strong>
                </div>
                <div className="nallabid-flow-fact">
                    <span>Quoted on your RFQs</span>
                    <strong>{stats.engaged_suppliers}</strong>
                </div>
                <div className="nallabid-flow-fact">
                    <span>Awarded by you</span>
                    <strong>{stats.suppliers_awarded}</strong>
                </div>
                <div className="nallabid-flow-fact">
                    <span>Catalogue items</span>
                    <strong>{stats.catalogue_items}</strong>
                </div>
            </div>

            <section className="nallabid-flow-panel">
                <div className="nallabid-flow-toolbar">
                    <label className="nallabid-flow-search">
                        <i className="bi bi-search"></i>
                        <input
                            type="search"
                            placeholder="Search by company, email or phone..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search suppliers"
                        />
                    </label>

                    <select
                        className="nallabid-flow-select"
                        value={engagementFilter}
                        onChange={(event) => setEngagementFilter(event.target.value)}
                        aria-label="Filter suppliers"
                    >
                        {ENGAGEMENT_FILTERS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    <select
                        className="nallabid-flow-select"
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        aria-label="Sort suppliers"
                    >
                        <option value="NAME">Sort: Name</option>
                        <option value="QUOTATIONS">Sort: Most quotations</option>
                        <option value="AWARDS">Sort: Highest awarded value</option>
                    </select>
                </div>

                {stats.total_suppliers === 0 ? (
                    <EmptyState
                        icon="bi-people"
                        title="No suppliers registered yet"
                        message="Suppliers appear here once they register on NallaBid."
                    />
                ) : visible.length === 0 ? (
                    <EmptyState icon="bi-funnel" title="No matching suppliers" message="Try a different search or filter." />
                ) : (
                    <div className="nallabid-supplier-grid">
                        {visible.map((supplier) => (
                            <SupplierCard key={supplier.id} supplier={supplier} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}


export default Suppliers;
