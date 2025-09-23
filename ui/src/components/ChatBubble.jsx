import React from "react";
function ChatBubble(props){
    return (
        <div>
            <p>Query: {props.query}</p>
        </div>
    )
}

export default ChatBubble;