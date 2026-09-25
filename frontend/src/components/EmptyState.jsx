import "./PageState.css";


function EmptyState({ icon = "bi-inbox", title, message, children }) {
    return (
        <div className="nallabid-state">
            <i className={`bi ${icon}`}></i>
            <h3>{title}</h3>
            {message && <p>{message}</p>}

            {children && (
                <div className="nallabid-state-actions">
                    {children}
                </div>
            )}
        </div>
    );
}


export default EmptyState;
