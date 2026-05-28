import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import MergePage from "./pages/MergePage";
import SplitPage from "./pages/SplitPage";
import RotatePage from "./pages/RotatePage";
import PagesPage from "./pages/PagesPage";
import ProtectPage from "./pages/ProtectPage";
import ConvertPage from "./pages/ConvertPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="merge" element={<MergePage />} />
        <Route path="split" element={<SplitPage />} />
        <Route path="rotate" element={<RotatePage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="protect" element={<ProtectPage />} />
        <Route path="convert" element={<ConvertPage />} />
      </Route>
    </Routes>
  );
}
