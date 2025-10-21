import React from "react";
import "./ResponseText.css";
import LoadingDots from "./LoadingDots";

function ResponseText(props) {
    if (!props.answer) return null;
    if (React.isValidElement(props.answer) && props.answer.type === LoadingDots) return <div className="response-text"><div>{props.answer}</div></div>; // Display loading state

    const events = props.answer.map((event, index) => (
        <div key={index}>
            <p>{event.name}</p>
            <p>{event.description}</p>
            <a className="more-link" href={event.link} target="_blank" rel="noopener noreferrer">More Info</a>
        </div>
    ));

    return (
        <div className="response-text">
            <div>{events}</div>
        </div>
    )
}

export default ResponseText;
