"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: "pink" | "yellow" | "blue" | "teal";
}

const colorClasses = {
  pink: "bg-pink-400",
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  teal: "bg-teal-400",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}
