import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);


/* GENTE!!!!!! USO UNA DEPENDENCIA, SE LLAMA LUCIDE-REACT, INSTALENLA SI QUIEREN VER LA RAMA */
/* LA USO PARA LOS ICONOS, INSTALENLA CON npm install lucide-react */