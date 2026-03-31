"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi } from "../../../services/adminApi";
import type { PickupConfig } from "../../../types";

export default function PickupSettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<PickupConfig | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pickup-config"],
    queryFn: (): Promise<PickupConfig> => adminApi.getPickupConfig(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: PickupConfig) => adminApi.updatePickupConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pickup-config"] });
      toast.success("Pickup settings updated");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update pickup settings";
      toast.error(msg);
    },
  });

  const cfg = form ?? data;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pickup Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure pickup windows and instant pickup surcharge for mobile checkout.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Pickup Timing Configuration</h2>
        <div className="mt-5 space-y-5">
          {isLoading || !cfg ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Morning Start</label>
                  <input
                    type="time"
                    value={cfg.morningStart}
                    onChange={(e) =>
                      setForm({ ...(cfg as PickupConfig), morningStart: e.target.value })
                    }
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-indigo-500 transition focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Morning End</label>
                  <input
                    type="time"
                    value={cfg.morningEnd}
                    onChange={(e) =>
                      setForm({ ...(cfg as PickupConfig), morningEnd: e.target.value })
                    }
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-indigo-500 transition focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Evening Start</label>
                  <input
                    type="time"
                    value={cfg.eveningStart}
                    onChange={(e) =>
                      setForm({ ...(cfg as PickupConfig), eveningStart: e.target.value })
                    }
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-indigo-500 transition focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Evening End</label>
                  <input
                    type="time"
                    value={cfg.eveningEnd}
                    onChange={(e) =>
                      setForm({ ...(cfg as PickupConfig), eveningEnd: e.target.value })
                    }
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-indigo-500 transition focus:ring-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={cfg.instantEnabled}
                  onChange={(e) =>
                    setForm({ ...(cfg as PickupConfig), instantEnabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input accent-indigo-600"
                />
                <label className="text-sm font-medium text-slate-700">Enable Instant Pickup</label>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <label className="text-sm font-medium text-slate-700">Instant Pickup Fee (Rs)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cfg.instantFee}
                  onChange={(e) =>
                    setForm({
                      ...(cfg as PickupConfig),
                      instantFee: Number(e.target.value || 0),
                    })
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-indigo-500 transition focus:ring-2"
                />
              </div>

              <button
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate(cfg as PickupConfig)}
                className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
