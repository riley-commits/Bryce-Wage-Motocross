"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError, FieldHelp } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type SettingsInput = {
  ordering_open: boolean;
  ordering_window_label: string | null;
  etransfer_email: string | null;
  owner_phone_e164: string | null;
};

export function SettingsForm({ initial }: { initial: SettingsInput | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    ordering_open: initial?.ordering_open ?? false,
    ordering_window_label: initial?.ordering_window_label ?? "",
    etransfer_email: initial?.etransfer_email ?? "",
    owner_phone_e164: initial?.owner_phone_e164 ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordering_open: form.ordering_open,
          ordering_window_label: form.ordering_window_label || null,
          etransfer_email: form.etransfer_email || null,
          owner_phone_e164: form.owner_phone_e164 || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Save failed");
        setSaving(false);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h2 className="font-display font-semibold text-navy text-lg mb-4">
          Ordering Window
        </h2>

        <div className="mb-4">
          <Label>Status</Label>
          <label className="flex items-center gap-3 cursor-pointer mt-1">
            <input
              type="checkbox"
              className="w-4 h-4 accent-red"
              checked={form.ordering_open}
              onChange={(e) => update("ordering_open", e.target.checked)}
            />
            <span className="text-sm text-navy">
              {form.ordering_open ? "Open — accepting orders" : "Closed"}
            </span>
          </label>
        </div>

        <div>
          <Label htmlFor="batch_label">Batch label</Label>
          <Input
            id="batch_label"
            placeholder="e.g. Spring 2026 Drop — closes March 15"
            value={form.ordering_window_label}
            onChange={(e) => update("ordering_window_label", e.target.value)}
          />
          <FieldHelp>
            Displayed on the storefront when ordering is open. Also snapshotted on
            each order in this batch so reports stay coherent later.
          </FieldHelp>
        </div>
      </Card>

      <Card>
        <h2 className="font-display font-semibold text-navy text-lg mb-4">
          Contact Details
        </h2>

        <div className="mb-4">
          <Label htmlFor="etransfer">E-transfer email</Label>
          <Input
            id="etransfer"
            type="email"
            placeholder="payments@example.ca"
            value={form.etransfer_email}
            onChange={(e) => update("etransfer_email", e.target.value)}
          />
          <FieldHelp>Shown on the confirmation page to e-transfer customers.</FieldHelp>
        </div>

        <div>
          <Label htmlFor="phone">Owner phone (for SMS notifications)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+12045551234 or (204) 555-1234"
            value={form.owner_phone_e164}
            onChange={(e) => update("owner_phone_e164", e.target.value)}
          />
          <FieldHelp>
            Twilio sends a text to this number every time a customer submits an
            interest order. 10-digit Canadian numbers are accepted.
          </FieldHelp>
        </div>
      </Card>

      <Card>
        <h2 className="font-display font-semibold text-navy text-lg mb-2">
          Start a New Batch
        </h2>
        <p className="text-sm text-muted mb-4">
          Past orders stay in the database with their original batch label snapshot,
          so old reports remain accurate. To start fresh: close ordering, change the
          batch label above, then re-open. Each new order picks up the new label.
        </p>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {success && <span className="text-sm text-red eyebrow">Saved ✓</span>}
        <FieldError>{error}</FieldError>
      </div>
    </form>
  );
}
