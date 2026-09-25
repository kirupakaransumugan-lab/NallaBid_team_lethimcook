// Lightweight, dependency-free charts for the Reports dashboard.
// Single-series charts use one hue; status charts pair color with a text label,
// so identity never depends on color alone.


function isEmpty(items) {
    return items.length === 0 || items.every((item) => Number(item.value) === 0);
}


function ChartEmpty({ message }) {
    return (
        <div className="nallabid-report-chart-empty">
            <i className="bi bi-bar-chart"></i>
            <span>{message}</span>
        </div>
    );
}


// Horizontal bars: categories with a visible value label at the end of each bar.
export function BarList({ items, formatValue = (value) => value, emptyMessage = "No data yet" }) {
    if (isEmpty(items)) {
        return <ChartEmpty message={emptyMessage} />;
    }

    const max = Math.max(...items.map((item) => Number(item.value)));

    return (
        <ul className="nallabid-report-bars">
            {items.map((item) => {
                const value = Number(item.value);
                const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;

                return (
                    <li
                        key={item.label}
                        className="nallabid-report-bar-row"
                        data-tip={`${item.label}: ${formatValue(item.value)}`}
                    >
                        <span className="nallabid-report-bar-label">
                            {item.icon && <i className={`bi ${item.icon}`}></i>}
                            {item.label}
                        </span>

                        <span className="nallabid-report-bar-track">
                            <span
                                className={`nallabid-report-bar-fill nallabid-report-tone-${item.tone ?? "primary"}`}
                                style={{ width: `${width}%` }}
                            ></span>
                        </span>

                        <span className="nallabid-report-bar-value">{formatValue(item.value)}</span>
                    </li>
                );
            })}
        </ul>
    );
}


// Vertical columns over time (one series). Values appear on hover; the peak is labeled.
export function ColumnChart({ items, seriesLabel, emptyMessage = "No data yet" }) {
    if (isEmpty(items)) {
        return <ChartEmpty message={emptyMessage} />;
    }

    const max = Math.max(...items.map((item) => Number(item.value)));
    const summary = items.map((item) => `${item.label}: ${item.value}`).join(", ");

    return (
        <div className="nallabid-report-columns-wrap">
            <div className="nallabid-report-columns-scale">
                <span>{max}</span>
                <span>0</span>
            </div>

            <div className="nallabid-report-columns" role="img" aria-label={`${seriesLabel}. ${summary}`}>
                {items.map((item) => {
                    const value = Number(item.value);

                    return (
                        <div
                            key={item.label}
                            className="nallabid-report-column"
                            data-tip={`${item.label}: ${value} ${seriesLabel.toLowerCase()}`}
                        >
                            <div className="nallabid-report-column-track">
                                <div
                                    className="nallabid-report-column-fill"
                                    style={{ height: `${max > 0 ? (value / max) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="nallabid-report-column-label">{item.label.split(" ")[0]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
