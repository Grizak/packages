import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import PackagePage from "./pages/PackagePage";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-white text-gray-900">
        <main className="mx-auto max-w-3xl p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/packages/:name/:version" element={<PackagePage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
