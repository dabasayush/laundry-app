"use client";

import {
  Users,
  ShoppingBag,
  Clock,
  XCircle,
  TrendingUp,
  Zap,
} from "lucide-react";

interface OverviewStat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

interface OverviewCardProps {
  stats?: {
    users: number;
    orders: number;
    pending: number;
    onProgress: number;
    delivered: number;
    canceled: number;
  };
}

export default function OverviewCard({ stats }: OverviewCardProps) {
  const overviewStats: OverviewStat[] = [
    {
      label: "Users",
      value: stats?.users ?? 0,
      icon: <Users size={20} />,
      color: "purple",
    },
    {
      label: "Orders",
      value: stats?.orders ?? 0,
      icon: <ShoppingBag size={20} />,
      color: "teal",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      icon: <Clock size={20} />,
      color: "pink",
    },
    {
      label: "On progress",
      value: stats?.onProgress ?? 0,
      icon: <TrendingUp size={20} />,
      color: "yellow",
    },
    {
      label: "Delivered",
      value: stats?.delivered ?? 0,
      icon: <Zap size={20} />,
      color: "blue",
    },
    {
      label: "Cancel Order",
      value: stats?.canceled ?? 0,
      icon: <XCircle size={20} />,
      color: "red",
    },
  ];

  const iconColorMap: Record<string, string> = {
    purple: "text-purple-500",
    teal: "text-teal-500",
    pink: "text-pink-500",
    yellow: "text-yellow-500",
    blue: "text-blue-500",
    red: "text-red-500",
  };

  return (
    <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg shadow-md p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <span className="text-teal-600 text-lg">ℹ</span>
        </div>
        <h3 className="text-lg font-semibold">Overview</h3>
      </div>

      {/* Illustration Placeholder */}
      <div className="mb-6 h-40 bg-white/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-sm">[Illustration Area]</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/10 rounded-lg p-3 backdrop-blur-sm"
          >
            <div className="flex items-start gap-2 mb-2">
              <div className={iconColorMap[stat.color]}>{stat.icon}</div>
              <div>
                <p className="text-xs font-medium text-white/80">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom accent line */}
      <div className="mt-4 h-1 bg-white/30 rounded-full"></div>
    </div>
  );
}
