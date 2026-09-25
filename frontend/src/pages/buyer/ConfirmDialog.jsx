import { useEffect } from "react";

import "./awardFlow.css";


function ConfirmDialog({
    title,
    message,
    details = [],
    confirmLabel,
    confirmIcon = "bi-check2",
    busy = false,
    onConfirm,
    onCancel
}) {
    useEffect(() => {
        function handleKey(event) {
            if (event.key === "Escape" && !busy) {
                onCancel();
            }
        }

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [busy, onCancel]);

    return (
        <div
            className="nallabid-flow-modal-backdrop"
            onClick={() => !busy && onCancel()}
        >
            <div
                className="nallabid-flow-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="nallabid-confirm-title"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 id="nallabid-confirm-title">{title}</h3>
                <p>{message}</p>

                {details.length > 0 && (
                    <dl>
                        {details.map(([label, value]) => (
                            <div key={label} style={{ display: "contents" }}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                <div className="nallabid-flow-modal-actions">
                    <button
                        type="button"
                        className="nallabid-flow-button nallabid-flow-button-ghost"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="nallabid-flow-button nallabid-flow-button-primary"
                        onClick={onConfirm}
                        disabled={busy}
                        autoFocus
                    >
                        {busy ? (
                            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        ) : (
                            <i className={`bi ${confirmIcon}`}></i>
                        )}
                        {busy ? "Please wait..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}


export default ConfirmDialog;
