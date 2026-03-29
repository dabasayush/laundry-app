"use client";

import { ChevronDown } from "lucide-react";

interface RevenueItem {
  id: string;
  deliveryDate: string;
  orderBy: string;
  quantity: number;
  total: number;
  action?: string;
}

interface RevenueTableProps {
  data?: RevenueItem[];
  totalRevenue?: number;
}

export default function RevenueTable({
  data = [],
  totalRevenue = 0,
}: RevenueTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            Today
            <ChevronDown size={16} />
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            Download
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                DELIVERY DATE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                ORDER BY
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                QUANTITY
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                TOTAL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-gray-500 text-sm">
                    Sorry Today revenue not found
                  </p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.deliveryDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.orderBy}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${item.total}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      {item.action || "View"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-sm text-gray-600">Total Revenue</span>
        <span className="text-sm font-semibold text-gray-900">
          ${totalRevenue.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
