import React from "react";
import "./ResponseText.css";
import LoadingDots from "./LoadingDots";

function ResponseText(props) {
    if (!props.answer) return null;
    if (React.isValidElement(props.answer) && props.answer.type === LoadingDots) return <div className="response-text"><div>{props.answer}</div></div>; // Display loading state

    const events = 
        <table id="my-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Link</th>
                </tr>
            </thead>
            <tbody>
                {props.answer.map((event, index) => (
                    <tr key={index}>
                    <td>{event.name}</td>
                    <td>{event.description}</td>
                    <td>
                    <a
                        className="more-link"
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        More Info
                    </a>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>

    return (
        <div>
            <div>{events}</div>
        </div>
    )
}

export default ResponseText;