import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/admin"
            className="font-display font-bold tracking-tight text-white"
          >
            BWM <span className="text-red">ADMIN</span>
          </Link>
          <nav className="flex items-center gap-1 text-xs eyebrow">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xs hover:bg-white/10 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="px-3 py-1.5 rounded-xs hover:bg-white/10 transition-colors"
            >
              Products
            </Link>
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 rounded-xs hover:bg-white/10 transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/admin/settings"
              className="px-3 py-1.5 rounded-xs hover:bg-white/10 transition-colors"
            >
              Settings
            </Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
