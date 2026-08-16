import "./storage.js";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import InventoryApp from "./InventoryApp.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <InventoryApp />
    </ErrorBoundary>
  </React.StrictMode>
);
