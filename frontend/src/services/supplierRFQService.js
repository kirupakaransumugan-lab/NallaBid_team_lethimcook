import { apiRequest } from "./fetchClient";


export function getAvailableRFQs() {
    return apiRequest("/supplier/rfqs", {
        fallback: "Could not load available RFQs."
    });
}


export function getSupplierRFQ(rfqId) {
    return apiRequest(`/supplier/rfqs/${rfqId}`, {
        fallback: "Could not load this RFQ."
    });
}


export function createQuotation(rfqId, quotation) {
    return apiRequest(`/rfqs/${rfqId}/quotations`, {
        method: "POST",
        body: quotation,
        fallback: "Could not submit your quotation."
    });
}


export function getMyQuotations() {
    return apiRequest("/quotations", {
        fallback: "Could not load your quotations."
    });
}
