import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-navy/70 hover:text-navy">
          ← Back to products
        </Link>
      </div>
      <h1 className="font-display font-bold text-navy text-2xl sm:text-3xl mb-6">
        New Product
      </h1>
      <ProductForm />
    </div>
  );
}
