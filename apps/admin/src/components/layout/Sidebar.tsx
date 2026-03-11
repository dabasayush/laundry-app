"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Truck,
  Tag,
  Megaphone,
  BarChart3,
  Percent,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/drivers", label: "Drivers", icon: Truck },
  { href: "/services", label: "Services", icon: Tag },
  { href: "/offers", label: "Offers", icon: Percent },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    sessionStorage.removeItem("admin_access_token");
    router.push("/login");
  }

  return (
    <aside className="w-[220px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
            <span className="text-sm leading-none">🧺</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">LaundryOps</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              <Icon
                size={15}
                className={cn(
                  "shrink-0",
                  isActive ? "text-indigo-600" : "text-slate-400",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-slate-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut size={15} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
