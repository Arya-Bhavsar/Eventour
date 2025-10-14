import React from "react";
import "./ResponseText.css";

function LoadingDots() {
  return (
    <div className="flex space-x-2 items-center justify-start my-2">
      <span className="loading-dot"></span>
      <span className="loading-dot" style={{ animationDelay: "0.2s" }}></span>
      <span className="loading-dot" style={{ animationDelay: "0.4s" }}></span>
    </div>
  );
}

export default LoadingDots;