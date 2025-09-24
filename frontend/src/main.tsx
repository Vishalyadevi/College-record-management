// main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";       // Your main App component
import "./index.css";          // Global CSS

// Get the root element from your HTML
const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
