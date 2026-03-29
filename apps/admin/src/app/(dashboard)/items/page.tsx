"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Link2,
  Image as ImageIcon,
} from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { formatCurrency } from "../../../lib/utils";
import { ImageUpload } from "../../../components/shared/ImageUpload";
import type { Item, Service } from "../../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemForm = {
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

type ServiceAssignment = {
  serviceId: string;
  price: string;
  enabled: boolean;
};

const EMPTY_FORM: ItemForm = {
  name: "",
  description: "",
  imageUrl: "",
  isActive: true,
};

// ─── Item Create/Edit Modal ───────────────────────────────────────────────────

function ItemModal({
  open,
  editing,
  form,
  onChange,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  editing: Item | null;
  form: ItemForm;
  onChange: (f: ItemForm) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name *</Label>
            <Input
              id="item-name"
              placeholder="e.g. Shirt"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              placeholder="Brief description"
              rows={2}
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
            />
          </div>
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => onChange({ ...form, imageUrl: url })}
            folder="laundry-app/items"
            label="Item Image"
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="item-active"
              checked={form.isActive}
              onChange={(e) =>
                onChange({ ...form, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-input accent-indigo-600"
            />
            <Label htmlFor="item-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!form.name.trim() || isPending}>
            {isPending ? "Saving…" : editing ? "Save Changes" : "Create Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Service Assignment Modal ─────────────────────────────────────────────────

function ServiceAssignModal({
  open,
  item,
  services,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  item: Item | null;
  services: Service[];
  onClose: () => void;
  onSave: (assignments: Array<{ serviceId: string; price: number }>) => void;
  isPending: boolean;
}) {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [prevItemId, setPrevItemId] = useState<string | null>(null);

  // Re-initialize when item changes
  const itemId = item?.id ?? null;
  if (itemId !== prevItemId) {
    setPrevItemId(itemId);
    if (item && services.length > 0) {
      const existing = new Map(
        (item.serviceItems ?? []).map((si) => [si.serviceId, si]),
      );
      setAssignments(
        services.map((svc) => {
          const ex = existing.get(svc.id);
          return {
            serviceId: svc.id,
            price: ex ? String(ex.price) : "",
            enabled: !!ex,
          };
        }),
      );
    }
  }

  function toggleService(serviceId: string) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.serviceId === serviceId ? { ...a, enabled: !a.enabled } : a,
      ),
    );
  }

  function setPrice(serviceId: string, price: string) {
    setAssignments((prev) =>
      prev.map((a) => (a.serviceId === serviceId ? { ...a, price } : a)),
    );
  }

  const enabledAssignments = assignments.filter((a) => a.enabled);
  const allValid = enabledAssignments.every(
    (a) => !isNaN(parseFloat(a.price)) && parseFloat(a.price) > 0,
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Services — {item?.name ?? "Item"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select which services this item belongs to and set per-service
          pricing.
        </p>
        <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
          {assignments.map((a) => {
            const svc = services.find((s) => s.id === a.serviceId);
            if (!svc) return null;
            return (
              <div
                key={a.serviceId}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  a.enabled
                    ? "border-indigo-200 bg-indigo-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={() => toggleService(a.serviceId)}
                  className="h-4 w-4 rounded border-input accent-indigo-600"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-800">
                    {svc.name}
                  </span>
                  <Badge
                    variant={svc.isActive ? "success" : "secondary"}
                    className="ml-2 text-xs"
                  >
                    {svc.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {a.enabled && (
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="Price"
                      className="pl-6 h-8 text-sm"
                      value={a.price}
                      onChange={(e) => setPrice(a.serviceId, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No services found. Create services first.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave(
                enabledAssignments.map((a) => ({
                  serviceId: a.serviceId,
                  price: parseFloat(a.price),
                })),
              )
            }
            disabled={!allValid || isPending}
          >
            {isPending
              ? "Saving…"
              : enabledAssignments.length === 0
                ? "Remove All Assignments"
                : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItemsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [itemModal, setItemModal] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [assignModal, setAssignModal] = useState(false);
  const [assignItem, setAssignItem] = useState<Item | null>(null);

  // Fetch items
  const { data, isLoading, isError } = useQuery({
    queryKey: ["items", { page }],
    queryFn: () => adminApi.listItems({ page, limit: 20 }),
  });

  // Fetch all services for assignment
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => adminApi.listServices(),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  // Mutations
  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateItem(editing.id, {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            imageUrl: form.imageUrl || undefined,
            isActive: form.isActive,
          })
        : adminApi.createItem({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            imageUrl: form.imageUrl || undefined,
            isActive: form.isActive,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success(editing ? "Item updated" : "Item created");
      setItemModal(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save item";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item deleted");
    },
    onError: () => toast.error("Failed to delete item"),
  });

  const assignMutation = useMutation({
    mutationFn: ({
      itemId,
      assignments,
    }: {
      itemId: string;
      assignments: Array<{ serviceId: string; price: number }>;
    }) => adminApi.assignItemServices(itemId, assignments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["service-items"] });
      toast.success("Services assigned");
      setAssignModal(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to assign services";
      toast.error(msg);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setItemModal(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      isActive: item.isActive,
    });
    setItemModal(true);
  }

  function openAssign(item: Item) {
    setAssignItem(item);
    setAssignModal(true);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Items</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master item catalog — assign items to services with per-service
            pricing
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          New Item
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load items. Check that the API server is running.
        </div>
      )}

      <Card className="flex-1 min-h-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Services</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Package size={40} className="text-slate-300" />
                        <p className="font-medium">No items yet</p>
                        <p className="text-sm">
                          Create items and assign them to services
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openCreate}
                        >
                          <Plus size={14} className="mr-1.5" />
                          Create First Item
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-slate-50 group"
                  >
                    <td className="px-6 py-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <ImageIcon size={16} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 text-slate-600 max-w-[200px] truncate">
                      {item.description || "—"}
                    </td>
                    <td className="px-6 py-3">
                      {(item.serviceItems ?? []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Not assigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(item.serviceItems ?? []).map((si) => (
                            <Badge
                              key={si.serviceId}
                              variant="outline"
                              className="text-xs"
                            >
                              {si.service.name}: {formatCurrency(si.price)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={item.isActive ? "success" : "secondary"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssign(item)}
                          title="Assign to services"
                        >
                          <Link2 size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(item)}
                          title="Edit item"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          title="Delete item"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete "${item.name}"? This will remove it from all services. This cannot be undone.`,
                              )
                            ) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.total} items)
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

      {/* Create/Edit Modal */}
      <ItemModal
        open={itemModal}
        editing={editing}
        form={form}
        onChange={setForm}
        onClose={() => setItemModal(false)}
        onSave={() => saveMutation.mutate()}
        isPending={saveMutation.isPending}
      />

      {/* Service Assignment Modal */}
      <ServiceAssignModal
        open={assignModal}
        item={assignItem}
        services={services}
        onClose={() => setAssignModal(false)}
        onSave={(assignments) => {
          if (assignItem) {
            assignMutation.mutate({
              itemId: assignItem.id,
              assignments,
            });
          }
        }}
        isPending={assignMutation.isPending}
      />
    </div>
  );
}
