import { apiRequest } from "./fetchClient";


export function getRFQEvaluation(rfqId) {
    return apiRequest(`/evaluations/rfq/${rfqId}`, {
        fallback: "Could not load RFQ quotations."
    });
}


export function runEvaluation(rfqId) {
    return apiRequest(`/evaluations/rfq/${rfqId}/run`, {
        method: "POST",
        fallback: "Could not evaluate quotations."
    });
}
