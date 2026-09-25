import { Link } from "react-router-dom";

import "./PageState.css";


// Maps an API error (with .status from fetchClient) to the right message and action.
function ErrorMessage({ error, onRetry, backTo, backLabel = "Go back" }) {
    const status = error?.status;

    if (status === 401) {
        return (
            <div className="nallabid-state nallabid-state-locked">
                <i className="bi bi-lock"></i>
                <h3>Session expired</h3>
                <p>Your login session has ended. Please log in again to continue.</p>

                <div className="nallabid-state-actions">
                    <Link to="/login" className="nallabid-state-button">
                        <i className="bi bi-box-arrow-in-right"></i>
                        Log in
                    </Link>
                </div>
            </div>
        );
    }

    if (status === 403) {
        return (
            <div className="nallabid-state nallabid-state-locked">
                <i className="bi bi-shield-lock"></i>
                <h3>Access denied</h3>
                <p>{error.message || "You do not have permission to view this page."}</p>

                {backTo && (
                    <div className="nallabid-state-actions">
                        <Link to={backTo} className="nallabid-state-button">{backLabel}</Link>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="nallabid-state nallabid-state-error">
            <i className="bi bi-exclamation-circle"></i>
            <h3>{status === 404 ? "Not found" : "Something went wrong"}</h3>
            <p>{error?.message || "An unexpected error occurred."}</p>

            <div className="nallabid-state-actions">
                {onRetry && status !== 404 && (
                    <button type="button" className="nallabid-state-button" onClick={onRetry}>
                        <i className="bi bi-arrow-clockwise"></i>
                        Try again
                    </button>
                )}

                {backTo && (
                    <Link to={backTo} className="nallabid-state-button">{backLabel}</Link>
                )}
            </div>
        </div>
    );
}


export default ErrorMessage;
