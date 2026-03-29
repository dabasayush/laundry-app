"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../../services/adminApi";
import { ImageUpload } from "../../../components/shared/ImageUpload";

export default function BannersPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: () => adminApi.listBanners(),
  });

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.sortOrder - b.sortOrder),
    [banners],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createBanner({
        title: title.trim() || undefined,
        imageUrl,
        isActive: true,
        sortOrder: Number(sortOrder) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner uploaded");
      setTitle("");
      setImageUrl("");
      setSortOrder("0");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload banner";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted");
    },
    onError: () => toast.error("Failed to delete banner"),
  });

  const canSave = Boolean(imageUrl) && !createMutation.isPending;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">App Banners</h1>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Upload New Banner
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Banner title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Sort order (0 = highest priority)"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!canSave}
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add Banner
                </>
              )}
            </button>
          </div>
          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            folder="laundry-app/banners"
            label="Banner Image"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-slate-900">
            Existing Banners
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            Loading banners...
          </div>
        ) : sortedBanners.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No banners yet. Upload your first banner.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
            {sortedBanners.map((banner) => (
              <div
                key={banner.id}
                className="rounded-xl border border-slate-200 overflow-hidden bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? "Banner"}
                  className="w-full h-44 object-cover"
                />
                <div className="p-3 space-y-2">
                  <p className="font-medium text-slate-800 truncate">
                    {banner.title || "Untitled banner"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Sort order: {banner.sortOrder}
                  </p>
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    onClick={() => {
                      if (confirm("Delete this banner?")) {
                        deleteMutation.mutate(banner.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete Banner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
