import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
// import { SocketProvider } from "./context/SocketContext";
// import { ChatProvider } from "./context/ChatContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* <SocketProvider> */}
          {/* <ChatProvider> */}
            <App />
          {/* </ChatProvider> */}
        {/* </SocketProvider> */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);