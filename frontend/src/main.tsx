// Copyright (c) 2026 Niraj Sharma
// Licensed under CC BY-NC 4.0.
// Commercial use requires a paid license.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Initialize dark mode on page load (default to dark mode)
const darkMode = localStorage.getItem("darkMode") === "false" ? false : true;
if (darkMode) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
