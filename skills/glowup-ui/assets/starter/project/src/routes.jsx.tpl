import { Route, Routes } from "react-router-dom";
// import { SidebarShell } from "./shells/SidebarShell.jsx";   // app products
// import { TopBarShell } from "./shells/TopBarShell.jsx";     // marketing, store, booking
import { PageHeader } from "./ui/index.js";

// Replace this skeleton: one <Route> per page, wrapped in the shell the direction calls for.
function Home() {
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><PageHeader title="__NAME__" /></main>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
