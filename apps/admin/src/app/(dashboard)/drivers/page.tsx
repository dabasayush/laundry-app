"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { formatCurrency, formatDate } from "../../../lib/utils";
import type { User, DriverCashReport } from "../../../types";

export default function DriversPage() {
  const qc = useQueryClient();

  const { data: driversRes, isLoading: loadingDrivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => adminApi.listUsers({ role: "DRIVER", limit: 100 }),
  });

  const { data: cashReport, isLoading: loadingCash } =
    useQuery<DriverCashReport>({
      queryKey: ["analytics", "driver-cash"],
      queryFn: adminApi.getDriverCashReport,
    });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.toggleUserActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });

  const drivers: User[] = driversRes?.data ?? [];

  // Map driver cash data by driver id for quick lookup
  const cashByDriver = new Map(
    cashReport?.drivers?.map((d) => [d.driverId, d]) ?? [],
  );

  const isLoading = loadingDrivers || loadingCash;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
        <p className="text-sm text-muted-foreground">
          {drivers.length} registered drivers
        </p>
      </div>

      {/* Cash Summary */}
      {cashReport?.summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Active Drivers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {cashReport.summary.totalDrivers}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">
                Orders with Cash Pending
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {cashReport.summary.totalOrders}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">
                Total Cash Pending
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(cashReport.summary.totalPending)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Driver List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Driver</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Cash Orders</th>
                  <th className="px-6 py-3">Cash Pending</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading && drivers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No drivers registered yet
                    </td>
                  </tr>
                )}
                {drivers.map((driver) => {
                  const cash = cashByDriver.get(driver.id);
                  return (
                    <tr
                      key={driver.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-800">
                          {driver.name ?? "—"}
                        </div>
                        {driver.email && (
                          <div className="text-xs text-muted-foreground">
                            {driver.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">
                        {driver.phone}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {cash ? (
                          <span className="font-semibold text-slate-800">
                            {cash.orderCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {cash && cash.totalPending > 0 ? (
                          <span className="font-semibold text-amber-600">
                            {formatCurrency(cash.totalPending)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={driver.isActive ? "success" : "secondary"}
                        >
                          {driver.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-slate-500 text-xs">
                        {formatDate(driver.createdAt)}
                      </td>
                      <td className="px-6 py-3">
                        <Button
                          size="sm"
                          variant={driver.isActive ? "destructive" : "outline"}
                          onClick={() =>
                            toggleMutation.mutate({
                              id: driver.id,
                              isActive: !driver.isActive,
                            })
                          }
                          disabled={toggleMutation.isPending}
                        >
                          {driver.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
