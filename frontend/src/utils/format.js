// Decimal values arrive from FastAPI as strings ("450000.00"), so convert first.
export function formatLKR(value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    return `LKR ${Number(value).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


export function formatNumber(value) {
    if (value === null || value === undefined) {
        return "-";
    }

    return Number(value).toLocaleString("en-LK");
}


// Backend datetimes are naive UTC; append Z so the browser converts to local time.
function parseUtc(value) {
    const text = String(value);
    return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text}Z`);
}


export function formatDate(value) {
    if (!value) {
        return "-";
    }

    return parseUtc(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


export function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return parseUtc(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
