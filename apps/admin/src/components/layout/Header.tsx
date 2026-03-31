"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/customers": "Customers",
  "/drivers": "Drivers",
  "/services": "Services",
  "/products": "Products",
  "/offers": "Offers",
  "/pickup-settings": "Pickup Settings",
  "/marketing": "Marketing",
  "/analytics": "Analytics",
  "/banners": "App Banners",
  "/contacts": "Contacts",
  "/admins": "Admins",
  "/profile": "Profile",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  const handleLogout = () => {
    sessionStorage.removeItem("admin_access_token");
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-600">
        <span className="text-sm font-medium">Dashboard</span>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-500">{title}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
}
