import React from "react";
import "./ResponseText.css";

function ResponseText(props){
    return (
        <div className="response-text">
            <div>{props.answer}</div>
        </div>
    )
}

export default ResponseText;
