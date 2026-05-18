import { supabaseAdmin } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

async function getSettings() {
  const sb = supabaseAdmin();
  const { data } = await sb.from("settings").select("*").limit(1).maybeSingle();
  return data;
}

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <h1 className="font-display font-bold text-navy text-2xl sm:text-3xl mb-6">
        Settings
      </h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
