"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { formatCurrency, formatDate } from "../../../lib/utils";
import type { Offer, DiscountType } from "../../../types";

type OfferForm = {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
  isActive: boolean;
};

const EMPTY_FORM: OfferForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  validFrom: "",
  validTo: "",
  usageLimit: "",
  isActive: true,
};

function toApiPayload(form: OfferForm) {
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description || undefined,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderAmount: form.minOrderAmount
      ? Number(form.minOrderAmount)
      : undefined,
    maxDiscountAmount: form.maxDiscountAmount
      ? Number(form.maxDiscountAmount)
      : undefined,
    validFrom: new Date(form.validFrom).toISOString(),
    validTo: new Date(form.validTo).toISOString(),
    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
    isActive: form.isActive,
  };
}

export default function OffersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["offers", { page }],
    queryFn: () => adminApi.listOffers({ page, limit: 15 }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateOffer(editing.id, toApiPayload(form))
        : adminApi.createOffer(toApiPayload(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateOffer(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  }

  function openEdit(offer: Offer) {
    setEditing(offer);
    setForm({
      code: offer.code,
      description: offer.description ?? "",
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      minOrderAmount: offer.minOrderAmount ? String(offer.minOrderAmount) : "",
      maxDiscountAmount: offer.maxDiscountAmount
        ? String(offer.maxDiscountAmount)
        : "",
      validFrom: offer.validFrom.slice(0, 16),
      validTo: offer.validTo.slice(0, 16),
      usageLimit: offer.usageLimit ? String(offer.usageLimit) : "",
      isActive: offer.isActive,
    });
    setIsOpen(true);
  }

  const offers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Offers</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          New Offer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Min Order</th>
                  <th className="px-6 py-3">Valid Until</th>
                  <th className="px-6 py-3">Usage</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
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
                {!isLoading && offers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No offers yet. Create one to attract customers.
                    </td>
                  </tr>
                )}
                {offers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3">
                      <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {offer.code}
                      </span>
                      {offer.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {offer.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {offer.discountType === "PERCENTAGE"
                        ? `${offer.discountValue}%`
                        : formatCurrency(offer.discountValue)}
                    </td>
                    <td className="px-6 py-3">
                      {offer.minOrderAmount
                        ? formatCurrency(offer.minOrderAmount)
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {formatDate(offer.validTo)}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="font-semibold">{offer.usedCount}</span>
                      {offer.usageLimit && (
                        <span className="text-muted-foreground">
                          /{offer.usageLimit}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: offer.id,
                            isActive: !offer.isActive,
                          })
                        }
                      >
                        <Badge
                          variant={offer.isActive ? "success" : "secondary"}
                          className="cursor-pointer"
                        >
                          {offer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(offer)}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete offer "${offer.code}"? This cannot be undone.`,
                              )
                            ) {
                              deleteMutation.mutate(offer.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
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

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(o) => !o && setIsOpen(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Offer" : "New Offer"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="offer-code">Code *</Label>
              <Input
                id="offer-code"
                placeholder="e.g. FIRST50"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="offer-desc">Description</Label>
              <Input
                id="offer-desc"
                placeholder="Short description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Discount Type *</Label>
              <Select
                value={form.discountType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountType: e.target.value as DiscountType,
                  })
                }
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-val">
                {form.discountType === "PERCENTAGE"
                  ? "Discount % *"
                  : "Discount Amount ₹ *"}
              </Label>
              <Input
                id="offer-val"
                type="number"
                min={1}
                placeholder={
                  form.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 100"
                }
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-min">Min Order Amount (₹)</Label>
              <Input
                id="offer-min"
                type="number"
                min={0}
                placeholder="e.g. 200"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({ ...form, minOrderAmount: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-max">Max Discount Cap (₹)</Label>
              <Input
                id="offer-max"
                type="number"
                min={0}
                placeholder="e.g. 500"
                value={form.maxDiscountAmount}
                onChange={(e) =>
                  setForm({ ...form, maxDiscountAmount: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-from">Valid From *</Label>
              <Input
                id="offer-from"
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) =>
                  setForm({ ...form, validFrom: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-to">Valid To *</Label>
              <Input
                id="offer-to"
                type="datetime-local"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-limit">Usage Limit</Label>
              <Input
                id="offer-limit"
                type="number"
                min={1}
                placeholder="Leave empty for unlimited"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm({ ...form, usageLimit: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-3 self-end pb-1">
              <input
                type="checkbox"
                id="offer-active"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-input accent-indigo-600"
              />
              <Label htmlFor="offer-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                !form.code.trim() ||
                !form.discountValue ||
                !form.validFrom ||
                !form.validTo ||
                saveMutation.isPending
              }
            >
              {saveMutation.isPending
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
