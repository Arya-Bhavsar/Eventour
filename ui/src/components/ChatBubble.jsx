import React from "react";
import "./ChatBubble.css";

function ChatBubble(props) {
    return (
        <div className="chat-bubble" onClick={props.onChatBubbleClick} style={{ cursor: 'pointer' }}>
            <div>{props.prompt}</div>
        </div>
    )
}

export default ChatBubble;