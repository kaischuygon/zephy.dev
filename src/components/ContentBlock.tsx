import type { ReactNode } from "react";

type TextStyle = "bold" | "italic" | "normal" | "bold-italic";

type PartialSegment = {
    text: ReactNode;
    style?: TextStyle;
    className?: string;
};

type ContentBlockProps = {
    left: ReactNode;
    right?: ReactNode;
    leftStyle?: TextStyle;
    rightStyle?: TextStyle;
    partial?: PartialSegment[];
    startDate?: Date;
    endDate?: Date;
    presentLabel?: string;
    className?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
});

function formatMonthYear(date: Date) {
    return dateFormatter.format(date);
}

function formatDateRange(
    startDate: Date,
    endDate?: Date,
    presentLabel = "Present",
) {
    const start = formatMonthYear(startDate);
    const end = endDate ? formatMonthYear(endDate) : presentLabel;

    return `${start} - ${end}`;
}

function getTextStyleClass(style: TextStyle = "normal") {
    if (style === "bold") return "font-bold";
    if (style === "italic") return "italic";
    if (style === "bold-italic") return "font-bold italic";

    return "";
}

export default function ContentBlock({
    left,
    right,
    leftStyle = "normal",
    rightStyle = "normal",
    partial,
    startDate,
    endDate,
    presentLabel = "Present",
    className = "",
}: ContentBlockProps) {
    const rightContent =
        startDate !== undefined
            ? formatDateRange(startDate, endDate, presentLabel)
            : right;

    const classes = [
        "not-prose",
        "flex",
        rightContent !== undefined && rightContent !== null
            ? "justify-between"
            : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes}>
            <span>
                {partial?.length ? (
                    partial.map(
                        (
                            {
                                text,
                                style = "normal",
                                className: segmentClassName,
                            },
                            index,
                        ) => (
                            <span
                                key={`partial-segment-${index}`}
                                className={[
                                    getTextStyleClass(style),
                                    segmentClassName,
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                {text}
                            </span>
                        ),
                    )
                ) : (
                    <span className={getTextStyleClass(leftStyle)}>{left}</span>
                )}
            </span>
            {rightContent !== undefined && rightContent !== null ? (
                <span className={getTextStyleClass(rightStyle)}>
                    {rightContent}
                </span>
            ) : null}
        </div>
    );
}
