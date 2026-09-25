import "./PageState.css";


function Loading({ message = "Loading..." }) {
    return (
        <div className="nallabid-state" role="status">
            <div className="nallabid-state-spinner"></div>
            <p>{message}</p>
        </div>
    );
}


export default Loading;
