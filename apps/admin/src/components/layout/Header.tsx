"use client";

import { usePathname } from "next/navigation";
import { Bell, User, ChevronRight } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/customers": "Customers",
  "/drivers": "Drivers",
  "/services": "Services",
  "/offers": "Offers",
  "/marketing": "Marketing",
  "/analytics": "Analytics",
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="h-14 shrink-0 sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-slate-400 font-medium">Admin</span>
        <ChevronRight size={13} className="text-slate-300" />
        <span className="font-semibold text-slate-800">{title}</span>
      </div>

      <div className="flex items-center gap-1">
        <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell size={16} />
        </button>
        <div className="ml-1 pl-2 border-l border-slate-200 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <User size={12} className="text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700">Admin</span>
        </div>
      </div>
    </header>
  );
}
