import "./storage.js";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRoot from "./AppRoot.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
