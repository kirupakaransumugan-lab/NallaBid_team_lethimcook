import { apiRequest } from "./fetchClient";


export function getProfile() {
    return apiRequest("/users/me/profile", {
        fallback: "Could not load your profile."
    });
}


export function updateProfile(profile) {
    return apiRequest("/users/me/profile", {
        method: "PUT",
        body: profile,
        fallback: "Could not save your profile."
    });
}


export function changePassword(currentPassword, newPassword) {
    return apiRequest("/users/me/password", {
        method: "PUT",
        body: {
            current_password: currentPassword,
            new_password: newPassword
        },
        fallback: "Could not change your password."
    });
}
