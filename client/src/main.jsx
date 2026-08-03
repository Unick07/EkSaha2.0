import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./app/App";
import ErrorBoundary from "./components/feedback/ErrorBoundary";
import "./styles/index.css";

const rootElement = document.getElementById("root");
const app = (
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

if (rootElement.dataset.prerendered === "true") {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
