import { API_URL, getErrorMessage, getToken, logoutUser } from "./authService";
import { apiRequest } from "./fetchClient";


export async function getBuyerDashboard() {
    const response = await fetch(`${API_URL}/rfqs/dashboard`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        logoutUser();
    }

    if (!response.ok) {
        const error = new Error(
            getErrorMessage(data, "Could not load dashboard.")
        );
        error.status = response.status;
        throw error;
    }

    return data;
}


// Workflow actions used by RFQ Details (existing /rfqs/{id}/publish and /close endpoints).
export function publishRFQ(rfqId) {
    return apiRequest(`/rfqs/${rfqId}/publish`, {
        method: "POST",
        fallback: "Could not publish RFQ."
    });
}


export function closeRFQ(rfqId) {
    return apiRequest(`/rfqs/${rfqId}/close`, {
        method: "POST",
        fallback: "Could not close RFQ."
    });
}


// The backend permits an OPEN RFQ's deadline to be extended. It rejects any
// other term change after suppliers have submitted quotations.
export function extendRFQDeadline(rfqId, deadline) {
    return apiRequest(`/rfqs/${rfqId}`, {
        method: "PUT",
        body: { deadline },
        fallback: "Could not extend the RFQ deadline."
    });
}
