import { apiRequest } from "./fetchClient";


// Only the quotation id is sent; the backend derives buyer, awarded_by and status.
export function createAward(rfqId, quotationId) {
    return apiRequest(`/awards/${rfqId}`, {
        method: "POST",
        body: { quotation_id: quotationId },
        fallback: "Could not award this quotation."
    });
}


export function completeAward(rfqId) {
    return apiRequest(`/awards/${rfqId}/complete`, {
        method: "POST",
        fallback: "Could not complete this RFQ."
    });
}


// Keeps the award as history (CANCELLED) and reopens the RFQ for a new winner.
export function cancelAward(rfqId, reason) {
    return apiRequest(`/awards/${rfqId}/cancel`, {
        method: "POST",
        body: { reason },
        fallback: "Could not cancel this award."
    });
}


export function getAward(rfqId) {
    return apiRequest(`/awards/${rfqId}`, {
        fallback: "Could not load the award result."
    });
}


export function getMyAwardResult(rfqId) {
    return apiRequest(`/awards/${rfqId}/my-result`, {
        fallback: "Could not load your award result."
    });
}
