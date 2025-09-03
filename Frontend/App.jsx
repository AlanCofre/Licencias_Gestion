import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Home from "./pages/Home";
import ComoUsar from "./pages/ComoUsar";
import Revision from "./pages/Revision";
import Resultados from "./pages/Resultados";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/como-usar" element={<ComoUsar />} />
        <Route path="/revision" element={<Revision />} />
        <Route path="/resultados" element={<Resultados />} />
      </Routes>
    </Router>
  );
}
