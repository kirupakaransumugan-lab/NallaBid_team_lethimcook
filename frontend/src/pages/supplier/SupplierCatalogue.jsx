import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCatalogue, importCatalogue } from "../../services/catalogueService";
import { formatLKR } from "../../utils/format";
import "./supplier.css";

export default function SupplierCatalogue() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [profileRequired, setProfileRequired] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [file, setFile] = useState(null);
    const [importError, setImportError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reload, setReload] = useState(0);
    const importButton = useRef(null);
    const fileInput = useRef(null);

    useEffect(() => {
        let active = true;
        getMyCatalogue().then((data) => {
            if (active) { setItems(data); setError(""); setProfileRequired(false); }
        }).catch((err) => {
            if (active) { setError(err.message); setProfileRequired(err.status === 404); }
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [reload]);

    useEffect(() => {
        if (showImport) fileInput.current?.focus();
    }, [showImport]);

    function closeImport() {
        setShowImport(false);
        setFile(null);
        setImportError("");
        importButton.current?.focus();
    }

    async function handleImport(event) {
        event.preventDefault();
        if (!file || submitting) return;
        setSubmitting(true);
        setImportError("");
        setSuccess("");
        try {
            const result = await importCatalogue(file);
            setSuccess(`Catalogue imported: ${result.created} created, ${result.updated} updated.${result.duplicate_rows_updated ? ` ${result.duplicate_rows_updated} existing duplicate copies were also updated; no records were deleted.` : ""}`);
            closeImport();
            setLoading(true);
            setReload((value) => value + 1);
        } catch (err) {
            setImportError(err.message);
            if (err.status === 404) setProfileRequired(true);
        } finally {
            setSubmitting(false);
        }
    }

    function selectFile(event) {
        const selected = event.target.files[0];
        setImportError("");
        setFile(null);
        if (!selected) return;
        if (!selected.name.toLowerCase().endsWith(".csv")) {
            setImportError("Choose a .csv file.");
        } else if (selected.size > 2 * 1024 * 1024) {
            setImportError("CSV file is too large (maximum 2 MiB).");
        } else if (!selected.size) {
            setImportError("The selected CSV is empty.");
        } else {
            setFile(selected);
        }
    }

    // Evaluation uses the largest stock value for matching legacy product rows.
    const products = new Map();
    for (const item of items) {
        const key = item.product_name.trim().toLowerCase();
        const previous = products.get(key);
        const quantity = item.available_quantity;
        products.set(key, quantity == null ? (previous ?? null) : Math.max(previous ?? 0, quantity));
    }
    const quantities = [...products.values()];
    const totalQuantity = quantities.reduce((sum, value) => sum + (value ?? 0), 0);
    const hasUnknownQuantity = quantities.some((value) => value == null);
    const available = !loading && !error && !profileRequired;

    return <main className="supplierPage supplierCatalogue">
        <header className="supplierPageHeading">
            <div><p className="supplierEyebrow">Supplier Workspace</p><h1>My Catalogue</h1>
                <p>Manage the products and availability your company can supply.</p></div>
            <button ref={importButton} type="button" className="supplierButton" disabled={!available || submitting}
                aria-expanded={showImport} aria-controls="catalogue-import" onClick={() => { setShowImport(true); setSuccess(""); }}>
                <i className="bi bi-upload" aria-hidden="true" /> Import CSV
            </button>
        </header>
        {success && <div className="catalogueSuccess" role="status">{success}</div>}
        {profileRequired && <div className="supplierAlert" role="alert">
            Complete your supplier profile before managing your catalogue. <Link to="/supplier/profile">Complete Profile <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        </div>}
        {showImport && !profileRequired && <section id="catalogue-import" className="supplierCard catalogueImport" aria-labelledby="import-title">
            <h2 id="import-title">Import catalogue from CSV</h2>
            <p>UTF-8 CSV, maximum 2 MiB. Required columns:</p>
            <code className="catalogueColumns">product_name,description,unit_price,available_quantity</code>
            <p>Use one row per product. Matching names ignore case and surrounding spaces; imports replace their price, description and stock. Other products are kept.</p>
            <form onSubmit={handleImport} aria-busy={submitting}>
                <label htmlFor="catalogue-file" className="form-label">Catalogue CSV file</label>
                <input ref={fileInput} id="catalogue-file" type="file" accept=".csv" className="form-control" onChange={selectFile} disabled={submitting} aria-describedby="catalogue-file-help" required />
                <p id="catalogue-file-help" className="mt-2">{file ? `Selected: ${file.name}` : "Choose a CSV file to import your products."}</p>
                {importError && <div className="supplierAlert" role="alert">{importError}</div>}
                <div className="catalogueActions">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeImport} disabled={submitting}>Cancel</button>
                    <button type="submit" className="supplierButton" disabled={!file || submitting}>
                        {submitting ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Importing...</> : "Import Catalogue"}
                    </button>
                </div>
            </form>
        </section>}
        <div className="supplierMetrics catalogueMetrics">
            <section className="supplierCard supplierMetric"><div className="supplierMetricTop"><h2>Total Products</h2><span className="supplierMetricIcon"><i className="bi bi-box-seam" aria-hidden="true" /></span></div>
                <strong>{available ? products.size.toLocaleString() : "—"}</strong><p>Distinct product names in your catalogue</p></section>
            <section className="supplierCard supplierMetric"><div className="supplierMetricTop"><h2>Total Available Quantity</h2><span className="supplierMetricIcon"><i className="bi bi-boxes" aria-hidden="true" /></span></div>
                <strong>{available ? (hasUnknownQuantity ? "Not available" : totalQuantity.toLocaleString()) : "—"}</strong><p>{hasUnknownQuantity ? "Some products have no stock quantity recorded." : "Combined stock across distinct products"}</p></section>
        </div>
        <section className="supplierCard" aria-labelledby="products-title" aria-busy={loading}>
            <header className="supplierPanelHeading"><div><h2 id="products-title">Your products</h2><p>Pricing and availability from your catalogue.</p></div>{available && <span className="supplierCount">{items.length} records</span>}</header>
            {loading ? <div className="supplierLoading" role="status"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading catalogue...</div>
                : error && !profileRequired ? <div className="supplierAlert" role="alert">{error} <button type="button" className="btn btn-outline-secondary" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Retry</button></div>
                : profileRequired ? <div className="supplierEmpty"><p>Your catalogue will be available after you complete your profile.</p></div>
                : items.length === 0 ? <div className="supplierEmpty"><span className="supplierEmptyIcon"><i className="bi bi-box-seam" aria-hidden="true" /></span><h3>No catalogue items yet.</h3><p>Use Import CSV to add your first products and their availability.</p></div>
                : <>
                    {items.length > products.size && <p className="catalogueNote">Existing duplicate records are preserved below. Summary cards count each product once and use its highest stock quantity, matching evaluation.</p>}
                    <div className="table-responsive catalogueTable" tabIndex={0} role="region" aria-label="Catalogue products table">
                        <table className="table table-hover mb-0"><caption className="visually-hidden">Your supplier catalogue products, prices and stock</caption>
                            <thead><tr><th scope="col">Product Name</th><th scope="col">Description</th><th scope="col" className="text-end">Unit Price (LKR)</th><th scope="col" className="text-end">Available Quantity</th></tr></thead>
                            <tbody>{items.map((item) => <tr key={item.id}><th scope="row">{item.product_name}</th><td>{item.description || "—"}</td><td className="text-end">{item.unit_price == null ? "—" : formatLKR(item.unit_price)}</td><td className="text-end">{item.available_quantity == null ? "—" : item.available_quantity.toLocaleString()}</td></tr>)}</tbody>
                        </table>
                    </div>
                </>}
        </section>
    </main>;
}
