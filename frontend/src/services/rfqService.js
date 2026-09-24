import { API_URL, getErrorMessage, getToken, logoutUser } from "./authService";


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
