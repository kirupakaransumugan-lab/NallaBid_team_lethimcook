import { useCallback, useEffect, useState } from "react";

import ConfirmDialog from "../buyer/ConfirmDialog";
import { setUserActive } from "../../services/adminService";


// Loads one admin API call; setState only runs in promise callbacks.
export function useAdminData(loader) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(() => loader()
        .then((result) => {
            setData(result);
            setError(null);
        })
        .catch(setError)
        .finally(() => setLoading(false)), [loader]);

    useEffect(() => {
        load();
    }, [load]);

    function reload() {
        setLoading(true);
        setError(null);
        load();
    }

    return { data, setData, loading, error, reload };
}


export function matchesText(search, values) {
    const text = search.trim().toLowerCase();
    return !text || values.some((value) => String(value ?? "").toLowerCase().includes(text));
}


// Asks for confirmation, then flips is_active. Shared with the user detail page.
export function useStatusToggle(onChanged) {
    const [target, setTarget] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    async function confirm() {
        setBusy(true);

        try {
            const updated = await setUserActive(target.id, !target.is_active);
            onChanged(updated);
            setMessage({ type: "success", text: `${updated.full_name} is now ${updated.is_active ? "active" : "inactive"}.` });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setBusy(false);
            setTarget(null);
        }
    }

    const dialog = target && (
        <ConfirmDialog
            title={target.is_active ? "Deactivate account?" : "Reactivate account?"}
            message={target.is_active
                ? "This user will be logged out and cannot log in until reactivated. Their RFQs, quotations and awards are kept."
                : "This user will be able to log in and use NallaBid again."}
            details={[["Name", target.full_name], ["Email", target.email]]}
            confirmLabel={target.is_active ? "Deactivate" : "Reactivate"}
            confirmIcon={target.is_active ? "bi-slash-circle" : "bi-check-circle"}
            danger={target.is_active}
            busy={busy}
            onConfirm={confirm}
            onCancel={() => setTarget(null)}
        />
    );

    const alert = message && (
        <div className={`nallabid-flow-alert nallabid-flow-alert-${message.type}`} role="status">
            <i className={`bi ${message.type === "success" ? "bi-check-circle" : "bi-exclamation-triangle"}`}></i>
            <span>{message.text}</span>
        </div>
    );

    return { ask: setTarget, dialog, alert };
}
