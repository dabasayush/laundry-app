"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
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
import { ImageUpload } from "../../../components/shared/ImageUpload";
import { formatCurrency } from "../../../lib/utils";
import type { Product } from "../../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  stock: string;
  isActive: boolean;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  stock: "0",
  isActive: true,
};

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({
  open,
  editing,
  form,
  onChange,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  editing: Product | null;
  form: ProductForm;
  onChange: (f: ProductForm) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}) {
  const price = parseFloat(form.price);
  const stock = parseInt(form.stock, 10);
  const valid =
    form.name.trim().length >= 2 &&
    !isNaN(price) &&
    price > 0 &&
    !isNaN(stock) &&
    stock >= 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Image Upload */}
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => onChange({ ...form, imageUrl: url })}
            folder="laundry-app/products"
            label="Product Image (optional)"
          />

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Product Name *</Label>
            <Input
              id="prod-name"
              placeholder="e.g. Washing Powder 500g"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-desc">Description</Label>
            <Textarea
              id="prod-desc"
              placeholder="Brief product description…"
              rows={3}
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Price + Stock row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Price (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  id="prod-price"
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
            <div className="space-y-1.5">
              <Label htmlFor="prod-stock">Stock</Label>
              <Input
                id="prod-stock"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={form.stock}
                onChange={(e) => onChange({ ...form, stock: e.target.value })}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="prod-active"
              checked={form.isActive}
              onChange={(e) =>
                onChange({ ...form, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-input accent-indigo-600"
            />
            <Label htmlFor="prod-active">Active (visible to customers)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!valid || isPending}>
            {isPending ? "Saving…" : editing ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Products Page ────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["products", { page }],
    queryFn: () => adminApi.listProducts({ page, limit: 20 }),
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateProduct(editing.id, {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: parseFloat(form.price),
            imageUrl: form.imageUrl || undefined,
            stock: parseInt(form.stock, 10),
            isActive: form.isActive,
          })
        : adminApi.createProduct({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: parseFloat(form.price),
            imageUrl: form.imageUrl || undefined,
            stock: parseInt(form.stock, 10),
            isActive: form.isActive,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setModal(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateProduct(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      imageUrl: product.imageUrl ?? "",
      stock: String(product.stock),
      isActive: product.isActive,
    });
    setModal(true);
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage products available for purchase
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} className="mr-2" />
          Add Product
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base">
            {meta
              ? `${meta.total} product${meta.total !== 1 ? "s" : ""}`
              : "Products"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
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

                {!isLoading && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ShoppingBag size={40} className="text-slate-300" />
                        <p className="font-medium text-slate-500">
                          No products yet
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openCreate}
                        >
                          <Plus size={14} className="mr-1.5" />
                          Add Your First Product
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}

                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-0 hover:bg-slate-50 group"
                  >
                    {/* Image */}
                    <td className="px-6 py-3">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded-md object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
                          <ShoppingBag size={16} className="text-slate-400" />
                        </div>
                      )}
                    </td>

                    {/* Name + Description */}
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </div>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-3 font-semibold text-slate-700">
                      {formatCurrency(product.price)}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.stock === 0
                            ? "bg-red-50 text-red-700"
                            : product.stock < 10
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: product.id,
                            isActive: !product.isActive,
                          })
                        }
                        title="Click to toggle"
                      >
                        <Badge
                          variant={product.isActive ? "success" : "secondary"}
                          className="cursor-pointer"
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(product)}
                          title="Edit product"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          title="Delete product"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete "${product.name}"? This cannot be undone.`,
                              )
                            ) {
                              deleteMutation.mutate(product.id);
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

      <ProductModal
        open={modal}
        editing={editing}
        form={form}
        onChange={setForm}
        onClose={() => setModal(false)}
        onSave={() => saveMutation.mutate()}
        isPending={saveMutation.isPending}
      />
    </main>
  );
}
