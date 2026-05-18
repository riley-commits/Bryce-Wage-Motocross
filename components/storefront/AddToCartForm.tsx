"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SizePicker } from "@/components/ui/SizePicker";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { useCart } from "@/lib/cart";

type Props = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  sizes: { id: string; label: string }[];
  primaryImagePath: string | null;
  orderingOpen: boolean;
};

export function AddToCartForm({
  productId,
  productName,
  unitPriceCents,
  sizes,
  primaryImagePath,
  orderingOpen,
}: Props) {
  const { addLine } = useCart();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes[0]?.label ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [confirm, setConfirm] = useState(false);

  const disabled = !orderingOpen || !selectedSize;

  function handleAdd() {
    if (!selectedSize) return;
    addLine({
      product_id: productId,
      product_name: productName,
      size_label: selectedSize,
      unit_price_cents: unitPriceCents,
      image_path: primaryImagePath,
      quantity,
    });
    setConfirm(true);
    setTimeout(() => setConfirm(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow text-navy mb-2">Size</p>
        <SizePicker
          sizes={sizes}
          value={selectedSize}
          onChange={setSelectedSize}
          disabled={!orderingOpen}
        />
      </div>

      <div>
        <p className="eyebrow text-navy mb-2">Quantity</p>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          size="lg"
          disabled={disabled}
          onClick={handleAdd}
          title={!orderingOpen ? "Ordering window is closed" : undefined}
          className="flex-1"
        >
          {orderingOpen ? "Add to Cart" : "Ordering Closed"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            handleAdd();
            router.push("/cart");
          }}
          className="flex-1"
        >
          Buy Now
        </Button>
      </div>

      {confirm && (
        <p className="eyebrow text-red animate-pulse">Added to cart ✓</p>
      )}
    </div>
  );
}
