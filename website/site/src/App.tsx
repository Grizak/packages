import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import PackagePage from "./pages/PackagePage";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen text-slate-100">
        <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/packages/:name/:version" element={<PackagePage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
