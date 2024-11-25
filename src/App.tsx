import { Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import { ProductDetail } from "./pages/detail";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/detail/:id" element={<ProductDetail />} />
      </Routes>
    </>
  );
}
