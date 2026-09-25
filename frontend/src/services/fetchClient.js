import { API_URL, getErrorMessage, getToken, logoutUser } from "./authService";


function requestError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}


async function authorizedFetch(path, options = {}) {
    const headers = {
        Authorization: `Bearer ${getToken()}`,
        ...options.headers
    };

    try {
        return await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch {
        throw requestError(
            "Cannot reach the NallaBid server. Check that the backend is running.",
            0
        );
    }
}


async function throwIfFailed(response, fallback) {
    if (response.ok) {
        return;
    }

    const data = await response.json().catch(() => null);

    // Expired or invalid token: clear it so the next page load goes to login.
    if (response.status === 401) {
        logoutUser();
    }

    throw requestError(getErrorMessage(data, fallback), response.status);
}


export function toQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });

    const text = query.toString();
    return text ? `?${text}` : "";
}


export async function apiRequest(path, { method = "GET", body, fallback = "Request failed." } = {}) {
    const response = await authorizedFetch(path, {
        method,
        headers: body === undefined ? {} : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    await throwIfFailed(response, fallback);

    return response.json();
}


// Downloads a file from an authenticated endpoint (a plain <a href> can't send the token).
export async function apiDownload(path, filename, fallback = "Download failed.") {
    const response = await authorizedFetch(path);

    await throwIfFailed(response, fallback);

    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
