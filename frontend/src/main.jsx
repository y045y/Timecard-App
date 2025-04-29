import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// ❌ index.cssはimportしない（邪魔なので）
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
