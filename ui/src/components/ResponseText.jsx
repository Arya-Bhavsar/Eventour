import React from "react";
import "./ResponseText.css";

function ResponseText(props){
    return (
        <div className="response-text">
            <div>Answer: {props.answer}</div>
        </div>
    )
}

export default ResponseText;
