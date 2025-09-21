import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import RoutesWrapper from "./routes.jsx";
import SkipLink from "./components/SkipLink.jsx";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SkipLink />
    <BrowserRouter>
      <RoutesWrapper />
    </BrowserRouter>
  </React.StrictMode>
);