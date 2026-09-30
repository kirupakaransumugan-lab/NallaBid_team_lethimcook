export const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api";

const TOKEN_KEY = "nallabid_token";
const USER_KEY = "nallabid_user";


export async function registerUser(userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            getErrorMessage(data, "Registration failed.")
        );
    }

    return data;
}


export async function loginUser(email, password) {
    // FastAPI's OAuth2PasswordRequestForm expects form fields, not JSON.
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            username: email,
            password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            getErrorMessage(data, "Login failed.")
        );
    }

    // Admins are stored with the UI role "ADMIN" so routing sends them to the admin panel.
    // Their database role stays BUYER/SUPPLIER; the backend re-checks admin on every call.
    const role = data.is_admin ? "ADMIN" : data.role;

    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(
        USER_KEY,
        JSON.stringify({
            id: data.user_id,
            full_name: data.full_name,
            email: data.email,
            role
        })
    );

    return { ...data, role };
}


export function logoutUser() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}


export async function logout() {
    const token = getToken();

    try {
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
    } finally {
        // Always clear locally, even if the token already expired or the server is down.
        logoutUser();
    }
}


export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}


export function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}


// FastAPI returns validation errors as a list of objects instead of a string.
export function getErrorMessage(data, fallback) {
    if (typeof data?.detail === "string") {
        return data.detail;
    }

    if (Array.isArray(data?.detail) && data.detail.length > 0) {
        return data.detail[0].msg;
    }

    return fallback;
}


// Re-reads the logged-in user from the backend so a session saved before the user
// became (or stopped being) an admin gets the right UI role. Returns the role.
export async function refreshCurrentUser() {
    const response = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    const role = data.is_admin ? "ADMIN" : data.role;

    updateStoredUser({ full_name: data.full_name, email: data.email, role });
    return role;
}


// Keeps the cached user (shown in the Navbar) in sync after a profile edit.
export function updateStoredUser(changes) {
    const user = getCurrentUser();

    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...changes }));
    }
}
