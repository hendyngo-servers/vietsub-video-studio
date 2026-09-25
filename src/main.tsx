import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyStudioTheme } from "./studio.config";

// Tự động khởi tạo và đồng bộ biến dùng chung (Shared Variables) vào CSS :root
applyStudioTheme();

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
