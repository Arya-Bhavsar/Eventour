import React from "react";
import "./ChatBubble.css";

function ChatBubble(props){
    return (
        <div className="chat-bubble">
            <div>Prompt: {props.prompt}</div>
        </div>
    )
}

export default ChatBubble;