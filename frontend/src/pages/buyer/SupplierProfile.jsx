import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { getSupplierProfile } from "../../services/buyerWorkspaceService";
import { formatDate, formatLKR, formatNumber } from "../../utils/format";

import "./awardFlow.css";
import "./Suppliers.css";


function SupplierProfile() {
    const { supplierId } = useParams();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // setState only runs in promise callbacks, never synchronously inside the effect.
    const loadProfile = useCallback(() => getSupplierProfile(supplierId)
        .then((result) => {
            setProfile(result);
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), [supplierId]);

    function retryProfile() {
        setLoading(true);
        setError(null);
        loadProfile();
    }

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    if (loading && !profile) {
        return (
            <div className="nallabid-flow-page">
                <Loading message="Loading supplier profile..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="nallabid-flow-page">
                <ErrorMessage error={error} onRetry={retryProfile} backTo="/suppliers" backLabel="Back to Suppliers" />
            </div>
        );
    }

    const { supplier, catalogue, quotation_history: history } = profile;
    const { engagement } = supplier;

    return (
        <div className="nallabid-flow-page nallabid-suppliers-page">

            <Link to="/suppliers" className="nallabid-flow-back">
                <i className="bi bi-arrow-left"></i>
                Back to Suppliers
            </Link>

            <div className="nallabid-flow-header">
                <div>
                    <p className="nallabid-flow-eyebrow">SUPPLIER PROFILE</p>
                    <h1>{supplier.company_name}</h1>
                    <p>Member since {formatDate(supplier.joined_at)}</p>
                </div>
            </div>

            <div className="nallabid-supplier-profile-grid">
                <section className="nallabid-flow-panel">
                    <div className="nallabid-flow-panel-head">
                        <h2>Contact</h2>
                    </div>
                    <div className="nallabid-flow-panel-body">
                        <ul className="nallabid-supplier-contact">
                            <li>
                                <i className="bi bi-envelope"></i>
                                {supplier.email ? <a href={`mailto:${supplier.email}`}>{supplier.email}</a> : <span>No email</span>}
                            </li>
                            <li>
                                <i className="bi bi-telephone"></i>
                                <span>{supplier.phone || "No phone"}</span>
                            </li>
                            <li>
                                <i className="bi bi-geo-alt"></i>
                                <span>{supplier.address || "No address"}</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="nallabid-flow-panel">
                    <div className="nallabid-flow-panel-head">
                        <div>
                            <h2>Performance on your RFQs</h2>
                            <p>Only quotations submitted to your RFQs are counted.</p>
                        </div>
                    </div>
                    <div className="nallabid-flow-panel-body">
                        <dl className="nallabid-supplier-metrics nallabid-supplier-metrics-wide">
                            <div><dt>Quotations</dt><dd>{engagement.quotations}</dd></div>
                            <div><dt>Eligible</dt><dd>{engagement.eligible}</dd></div>
                            <div><dt>Ineligible</dt><dd>{engagement.ineligible}</dd></div>
                            <div>
                                <dt>Eligibility rate</dt>
                                <dd>{engagement.eligibility_rate === null ? "-" : `${engagement.eligibility_rate}%`}</dd>
                            </div>
                            <div><dt>Awards</dt><dd>{engagement.awards}</dd></div>
                            <div><dt>Awarded value</dt><dd>{formatLKR(engagement.awarded_value)}</dd></div>
                        </dl>
                    </div>
                </section>
            </div>

            <section className="nallabid-flow-panel">
                <div className="nallabid-flow-panel-head">
                    <div>
                        <h2>Product catalogue</h2>
                        <p>{catalogue.length} item{catalogue.length === 1 ? "" : "s"} listed by this supplier.</p>
                    </div>
                </div>

                {catalogue.length === 0 ? (
                    <EmptyState icon="bi-box-seam" title="No catalogue items" message="This supplier has not uploaded a catalogue yet." />
                ) : (
                    <div className="nallabid-flow-table-wrap">
                        <table className="nallabid-flow-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Description</th>
                                    <th className="nallabid-flow-num">Unit price</th>
                                    <th className="nallabid-flow-num">Available qty</th>
                                    <th>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {catalogue.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.product_name}</strong></td>
                                        <td className="nallabid-flow-muted">{item.description || "-"}</td>
                                        <td className="nallabid-flow-num">{formatLKR(item.unit_price)}</td>
                                        <td className="nallabid-flow-num">{formatNumber(item.available_quantity)}</td>
                                        <td>{formatDate(item.updated_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="nallabid-flow-panel">
                <div className="nallabid-flow-panel-head">
                    <div>
                        <h2>Quotation history with you</h2>
                        <p>Quotations this supplier submitted to your RFQs.</p>
                    </div>
                </div>

                {history.length === 0 ? (
                    <EmptyState icon="bi-clock-history" title="No quotations yet" message="This supplier has not quoted on any of your RFQs." />
                ) : (
                    <div className="nallabid-flow-table-wrap">
                        <table className="nallabid-flow-table">
                            <thead>
                                <tr>
                                    <th>RFQ</th>
                                    <th>Quotation</th>
                                    <th className="nallabid-flow-num">Total price</th>
                                    <th className="nallabid-flow-num">Delivery</th>
                                    <th className="nallabid-flow-num">Warranty</th>
                                    <th>Result</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item) => (
                                    <tr key={item.quotation_id}>
                                        <td>
                                            <Link to={`/rfqs/${item.rfq_id}`} className="nallabid-flow-link">{item.rfq_number}</Link>
                                            <span className="nallabid-flow-sub">{item.product_name}</span>
                                        </td>
                                        <td>{item.quotation_number}</td>
                                        <td className="nallabid-flow-num">{formatLKR(item.total_price)}</td>
                                        <td className="nallabid-flow-num">{item.delivery_days} days</td>
                                        <td className="nallabid-flow-num">{item.warranty_months} months</td>
                                        <td>
                                            {item.is_awarded ? (
                                                <span className="nallabid-flow-badge nallabid-flow-badge-awarded">
                                                    <i className="bi bi-trophy"></i>
                                                    Awarded
                                                </span>
                                            ) : (
                                                <span className={`nallabid-flow-badge nallabid-flow-badge-${item.eligibility.toLowerCase()}`}>
                                                    {item.eligibility === "PENDING" ? "Pending evaluation" : item.eligibility}
                                                </span>
                                            )}
                                        </td>
                                        <td>{formatDate(item.submitted_at)}</td>
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


export default SupplierProfile;
