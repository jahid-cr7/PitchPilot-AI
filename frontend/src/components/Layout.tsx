import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider } from "./Toast";

export default function Layout() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#07111f]">
        <Sidebar />
        <div className="flex flex-1 flex-col md:ml-[260px]">
          <Topbar />
          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
