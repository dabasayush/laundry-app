"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ShoppingCart,
  Package,
  ImageIcon,
  Users,
  Truck,
  Mail,
  Lock,
  User,
  Globe,
  LogOut,
  BarChart3,
  Box,
  Tag,
  Clock3,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: <Home size={20} />, href: "/" },
  { label: "Orders", icon: <ShoppingCart size={20} />, href: "/orders" },
  { label: "Services", icon: <Package size={20} />, href: "/services" },
  { label: "Items", icon: <Box size={20} />, href: "/items" },
  { label: "Products", icon: <Package size={20} />, href: "/products" },
  { label: "Offers", icon: <Tag size={20} />, href: "/offers" },
  {
    label: "Pickup Settings",
    icon: <Clock3 size={20} />,
    href: "/pickup-settings",
  },
  { label: "App Banners", icon: <ImageIcon size={20} />, href: "/banners" },
  { label: "Customer", icon: <Users size={20} />, href: "/customers" },
  { label: "Drivers", icon: <Truck size={20} />, href: "/drivers" },
  { label: "Contacts", icon: <Mail size={20} />, href: "/contacts" },
  { label: "Marketing", icon: <Mail size={20} />, href: "/marketing" },
  { label: "Admins", icon: <Lock size={20} />, href: "/admins" },
  { label: "Profile", icon: <User size={20} />, href: "/profile" },
  { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    sessionStorage.removeItem("admin_access_token");
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="font-bold text-green-600 text-lg">LAUNDRY</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={isActive ? "text-gray-900" : "text-gray-600"}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>

        {/* Language & User Section */}
        <div className="px-4 py-3 border-t border-gray-200 mt-2">
          <div className="flex items-center gap-3 mb-3">
            <Globe size={16} className="text-gray-600" />
            <span className="text-xs text-gray-600">English</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Admin User</p>
              <p className="text-xs text-gray-500">admin@laundry.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
