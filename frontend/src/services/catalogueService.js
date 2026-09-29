import { apiRequest } from "./fetchClient";

export function getMyCatalogue() {
    return apiRequest("/suppliers/me/catalogue", { fallback: "Could not load your catalogue." });
}

export function importCatalogue(file) {
    const body = new FormData();
    body.append("file", file);
    return apiRequest("/imports/supplier-catalogue", {
        method: "POST", body, fallback: "Could not import your catalogue."
    });
}
