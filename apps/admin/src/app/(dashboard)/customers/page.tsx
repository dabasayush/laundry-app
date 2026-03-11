"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { formatCurrency, formatDate } from "../../../lib/utils";
import type { User } from "../../../types";

export default function CustomersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(
      () => {
        setDebouncedSearch(v);
        setPage(1);
      },
      400,
    );
  };

  const { data, isLoading } = useQuery({
    queryKey: ["users", "customers", { page, search: debouncedSearch }],
    queryFn: () =>
      adminApi.listUsers({
        page,
        limit: 15,
        role: "CUSTOMER",
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.toggleUserActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "customers"] }),
  });

  const users: User[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {meta ? `${meta.total} customers` : ""}
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Total Orders</th>
                  <th className="px-6 py-3">Total Spent</th>
                  <th className="px-6 py-3">Last Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No customers found
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">
                        {user.name ?? "—"}
                      </div>
                      {user.email && (
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs">
                      {user.phone}
                    </td>
                    <td className="px-6 py-3 text-center font-semibold">
                      {user.totalOrders}
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {formatCurrency(user.totalSpent ?? 0)}
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {user.lastOrderDate
                        ? formatDate(user.lastOrderDate)
                        : "Never"}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={user.isActive ? "success" : "secondary"}>
                        {user.isActive ? "Active" : "Blocked"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Button
                        size="sm"
                        variant={user.isActive ? "destructive" : "outline"}
                        onClick={() =>
                          toggleMutation.mutate({
                            id: user.id,
                            isActive: !user.isActive,
                          })
                        }
                        disabled={toggleMutation.isPending}
                      >
                        {user.isActive ? "Block" : "Unblock"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
