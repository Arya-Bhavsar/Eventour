import React from "react";
import "./ResponseText.css";
import LoadingDots from "./LoadingDots";

function ResponseText(props) {
    if (!props.answer) return null;
    if (props.answer.type === LoadingDots) return <div className="response-text"><div>{props.answer}</div></div>; // Display loading state

    // Split the answer into events by numbered list pattern
    const items = props.answer.split(/\d+\.\s+/).filter(item => item.trim() !== '');
    
    const events = items.map((item, index) => {
        // Get title between **..**
        const titleMatch = item.match(/\*\*(.*?)\*\*/);
        const title = titleMatch ? titleMatch[1] : 'No Title';
        
        // Get description between - and [
        const descriptionMatch = item.match(/-(.*?)\[/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : 'No Description';
        
        // Get link between ( and )
        const linkMatch = item.match(/\((.*?)\)/);
        const link = linkMatch ? linkMatch[1] : '#';
        
        return (
            <div key={index}>
                <p>{title}</p>
                <p>{description}</p>
                <a href={link} target="_blank" rel="noopener noreferrer">More Info</a>
            </div>
        );
    });

    return (
        <div className="response-text">
            <div>{events}</div>
        </div>
    )
}

export default ResponseText;
