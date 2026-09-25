import { apiDownload, apiRequest, toQuery } from "./fetchClient";


export const REPORT_TYPES = {
    "rfq-comparison": {
        title: "RFQ Comparison",
        description: "Compare every quotation for one RFQ: price, delivery, warranty and eligibility.",
        icon: "bi-layout-three-columns",
        buyerOnly: true
    },
    "supplier-eligibility": {
        title: "Supplier Eligibility",
        description: "Evaluation outcomes per quotation with requirements, actuals and failure reasons.",
        icon: "bi-shield-check",
        buyerOnly: false
    },
    "award-summary": {
        title: "Award Summary",
        description: "All awards with amounts, suppliers, dates and totals by supplier and month.",
        icon: "bi-trophy",
        buyerOnly: false
    }
};


export function getReportDashboard() {
    return apiRequest("/reports/dashboard", {
        fallback: "Could not load report dashboard."
    });
}


export function getReport(type, params) {
    return apiRequest(`/reports/${type}${toQuery(params)}`, {
        fallback: "Could not load report."
    });
}


export function downloadReport(type, format, params) {
    const stamp = new Date().toISOString().slice(0, 10);

    return apiDownload(
        `/reports/${type}/${format}${toQuery(params)}`,
        `nallabid-${type}-${stamp}.${format}`,
        `Could not export ${format.toUpperCase()}.`
    );
}


// Buyers use /reports; suppliers reach the same pages under their own sidebar path.
export function reportsBasePath(role) {
    return role === "SUPPLIER" ? "/supplier/reports" : "/reports";
}
