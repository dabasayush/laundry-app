"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Package,
  IndianRupee,
  Layers,
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
import { formatCurrency, formatDate } from "../../../lib/utils";
import type { Service, ServiceItem } from "../../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceForm = { name: string; description: string; isActive: boolean };
type ItemForm = { name: string; price: string; isActive: boolean };

const EMPTY_SVC: ServiceForm = { name: "", description: "", isActive: true };
const EMPTY_ITEM: ItemForm = { name: "", price: "", isActive: true };

// ─── Service Form Modal ───────────────────────────────────────────────────────

function ServiceModal({
  open,
  editing,
  form,
  onChange,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  editing: Service | null;
  form: ServiceForm;
  onChange: (f: ServiceForm) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Service" : "New Service"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Name *</Label>
            <Input
              id="svc-name"
              placeholder="e.g. Dry Cleaning"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">Description</Label>
            <Textarea
              id="svc-desc"
              placeholder="Brief description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="svc-active"
              checked={form.isActive}
              onChange={(e) =>
                onChange({ ...form, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-input accent-indigo-600"
            />
            <Label htmlFor="svc-active">Active (visible to customers)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!form.name.trim() || isPending}>
            {isPending
              ? "Saving…"
              : editing
                ? "Save Changes"
                : "Create Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Form Modal ──────────────────────────────────────────────────────────

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
  editing: ServiceItem | null;
  form: ItemForm;
  onChange: (f: ItemForm) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}) {
  const price = parseFloat(form.price);
  const valid = form.name.trim().length > 0 && !isNaN(price) && price > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Item Name *</Label>
            <Input
              id="item-name"
              placeholder="e.g. Shirt"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-price">Price (₹) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₹
              </span>
              <Input
                id="item-price"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0.00"
                className="pl-7"
                value={form.price}
                onChange={(e) => onChange({ ...form, price: e.target.value })}
              />
            </div>
          </div>
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
          <Button onClick={onSave} disabled={!valid || isPending}>
            {isPending ? "Saving…" : editing ? "Save Changes" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Items Panel ──────────────────────────────────────────────────────────────

function ItemsPanel({ service }: { service: Service }) {
  const qc = useQueryClient();
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);

  const { data: itemsRes, isLoading } = useQuery({
    queryKey: ["service-items", service.id],
    queryFn: () => adminApi.listServiceItems(service.id),
    staleTime: 30_000,
  });

  const items: ServiceItem[] = itemsRes?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () =>
      editingItem
        ? adminApi.updateServiceItem(editingItem.id, {
            name: itemForm.name.trim(),
            price: parseFloat(itemForm.price),
            isActive: itemForm.isActive,
          })
        : adminApi.createServiceItem({
            serviceId: service.id,
            name: itemForm.name.trim(),
            price: parseFloat(itemForm.price),
            isActive: itemForm.isActive,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-items", service.id] });
      setItemModal(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateServiceItem(id, { isActive }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["service-items", service.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteServiceItem(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["service-items", service.id] }),
  });

  function openCreate() {
    setEditingItem(null);
    setItemForm(EMPTY_ITEM);
    setItemModal(true);
  }

  function openEdit(item: ServiceItem) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: String(item.price),
      isActive: item.isActive,
    });
    setItemModal(true);
  }

  return (
    <>
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {service.name}
              </CardTitle>
              {service.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {service.description}
                </p>
              )}
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1.5" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded bg-slate-100"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Package size={36} className="text-slate-300" />
              <div>
                <p className="font-medium text-slate-500">No items yet</p>
                <p className="text-sm text-muted-foreground">
                  Add items like Shirt, Pant, Suit…
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus size={14} className="mr-1.5" />
                Add First Item
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Item Name</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-slate-50 group"
                  >
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-700">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: item.id,
                            isActive: !item.isActive,
                          })
                        }
                        title="Click to toggle"
                      >
                        <Badge
                          variant={item.isActive ? "success" : "secondary"}
                          className="cursor-pointer"
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                `Delete "${item.name}"? This cannot be undone.`,
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
          )}
        </CardContent>
      </Card>

      <ItemModal
        open={itemModal}
        editing={editingItem}
        form={itemForm}
        onChange={setItemForm}
        onClose={() => setItemModal(false)}
        onSave={() => saveMutation.mutate()}
        isPending={saveMutation.isPending}
      />
    </>
  );
}

// ─── Services Panel ───────────────────────────────────────────────────────────

function ServicesPanel({
  services,
  isLoading,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}: {
  services: Service[];
  isLoading: boolean;
  selected: Service | null;
  onSelect: (s: Service) => void;
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="w-72 shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Services
        </h2>
        <Button size="sm" onClick={onAddNew}>
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-slate-100"
            />
          ))}

        {!isLoading && services.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Layers size={32} className="text-slate-300" />
            <p className="text-sm text-muted-foreground">No services yet</p>
            <Button size="sm" variant="outline" onClick={onAddNew}>
              <Plus size={13} className="mr-1" />
              Create First Service
            </Button>
          </div>
        )}

        {services.map((svc) => {
          const isSelected = selected?.id === svc.id;
          return (
            <button
              key={svc.id}
              onClick={() => onSelect(svc)}
              className={`group w-full rounded-lg border px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-indigo-300 bg-indigo-50 shadow-sm"
                  : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium text-sm truncate ${
                        isSelected ? "text-indigo-700" : "text-slate-800"
                      }`}
                    >
                      {svc.name}
                    </span>
                    <Badge
                      variant={svc.isActive ? "success" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {svc.isActive ? "Active" : "Off"}
                    </Badge>
                  </div>
                  {svc.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {svc.description}
                    </p>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className={`shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? "text-indigo-500"
                      : "text-slate-300 group-hover:text-slate-400"
                  }`}
                />
              </div>

              {/* Row actions — visible on hover */}
              <div
                className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                  onClick={() => onEdit(svc)}
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(svc)}
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const qc = useQueryClient();

  // Service modal state
  const [svcModal, setSvcModal] = useState(false);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [svcForm, setSvcForm] = useState<ServiceForm>(EMPTY_SVC);

  // Selected service for items panel
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: adminApi.listServices,
  });

  const saveSvcMutation = useMutation({
    mutationFn: () =>
      editingSvc
        ? adminApi.updateService(editingSvc.id, {
            name: svcForm.name.trim(),
            description: svcForm.description.trim() || undefined,
            isActive: svcForm.isActive,
          })
        : adminApi.createService({
            name: svcForm.name.trim(),
            description: svcForm.description.trim() || undefined,
            isActive: svcForm.isActive,
          }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["services"] });
      // Keep selected in sync if we just edited the selected service
      if (editingSvc && selectedService?.id === editingSvc.id) {
        setSelectedService(updated);
      }
      setSvcModal(false);
    },
  });

  const deleteSvcMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteService(id),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ["services"] });
      if (selectedService?.id === deletedId) setSelectedService(null);
    },
  });

  function openCreateSvc() {
    setEditingSvc(null);
    setSvcForm(EMPTY_SVC);
    setSvcModal(true);
  }

  function openEditSvc(svc: Service) {
    setEditingSvc(svc);
    setSvcForm({
      name: svc.name,
      description: svc.description ?? "",
      isActive: svc.isActive,
    });
    setSvcModal(true);
  }

  function handleDeleteSvc(svc: Service) {
    if (
      confirm(
        `Delete service "${svc.name}"? All its items will also be removed. This cannot be undone.`,
      )
    ) {
      deleteSvcMutation.mutate(svc.id);
    }
  }

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Service Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage services and their items (e.g. Dry Cleaning → Shirt, Pant)
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Layers size={15} />
            {services.length} services
          </span>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex gap-5 min-h-0 flex-1">
        {/* Left: Services List */}
        <ServicesPanel
          services={services}
          isLoading={isLoading}
          selected={selectedService}
          onSelect={setSelectedService}
          onEdit={openEditSvc}
          onDelete={handleDeleteSvc}
          onAddNew={openCreateSvc}
        />

        {/* Right: Items Panel */}
        <div className="flex-1 min-w-0">
          {selectedService ? (
            <ItemsPanel key={selectedService.id} service={selectedService} />
          ) : (
            <Card className="flex-1 h-full">
              <CardContent className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="rounded-full bg-slate-100 p-5">
                  <IndianRupee size={28} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-600">
                    Select a service to manage its items
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click any service on the left to view, add, or edit its
                    items like Shirt, Pant, Suit…
                  </p>
                </div>
                {services.length === 0 && !isLoading && (
                  <Button variant="outline" onClick={openCreateSvc}>
                    <Plus size={14} className="mr-2" />
                    Create Your First Service
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Service Modal */}
      <ServiceModal
        open={svcModal}
        editing={editingSvc}
        form={svcForm}
        onChange={setSvcForm}
        onClose={() => setSvcModal(false)}
        onSave={() => saveSvcMutation.mutate()}
        isPending={saveSvcMutation.isPending}
      />
    </main>
  );
}
