import { apiRequest } from "./fetchClient";


// Admin panel API. The backend allows these only for emails in ADMIN_EMAILS.

export function getAdminOverview() {
    return apiRequest("/admin/overview", { fallback: "Could not load the admin dashboard." });
}


export function getAdminUsers() {
    return apiRequest("/admin/users", { fallback: "Could not load users." });
}


export function getAdminUser(userId) {
    return apiRequest(`/admin/users/${userId}`, { fallback: "Could not load this user." });
}


export function setUserActive(userId, isActive) {
    return apiRequest(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: { is_active: isActive },
        fallback: "Could not update the account status."
    });
}


export function getAdminRFQs() {
    return apiRequest("/admin/rfqs", { fallback: "Could not load RFQs." });
}


export function getAdminRFQ(rfqId) {
    return apiRequest(`/admin/rfqs/${rfqId}`, { fallback: "Could not load this RFQ." });
}


export function getAdminQuotations() {
    return apiRequest("/admin/quotations", { fallback: "Could not load quotations." });
}


export function getAdminAwards() {
    return apiRequest("/admin/awards", { fallback: "Could not load awards." });
}
