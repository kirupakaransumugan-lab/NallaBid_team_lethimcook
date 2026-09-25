import { apiRequest } from "./fetchClient";


export function getReceivedQuotations() {
    return apiRequest("/buyer/quotations", {
        fallback: "Could not load quotations."
    });
}


export function getSupplierDirectory() {
    return apiRequest("/buyer/suppliers", {
        fallback: "Could not load suppliers."
    });
}


export function getSupplierProfile(supplierId) {
    return apiRequest(`/buyer/suppliers/${supplierId}`, {
        fallback: "Could not load supplier profile."
    });
}
