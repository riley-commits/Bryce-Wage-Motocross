"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="ml-2 px-3 py-1.5 rounded-xs text-red hover:bg-white/10 transition-colors"
    >
      Logout
    </button>
  );
}
