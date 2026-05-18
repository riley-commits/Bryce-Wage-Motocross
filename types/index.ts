// Domain types shared across server and client code.

export type Settings = {
  id: string;
  ordering_open: boolean;
  ordering_window_label: string | null;
  etransfer_email: string | null;
  owner_phone_e164: string | null;
  updated_at: string;
};

export type PublicSettings = {
  ordering_open: boolean;
  ordering_window_label: string | null;
  etransfer_email: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  sort_order: number;
};

export type ProductSize = {
  id: string;
  product_id: string;
  label: string;
  sort_order: number;
};

export type ProductWithRelations = Product & {
  product_images: ProductImage[];
  product_sizes: ProductSize[];
};

export type ContactMethod = "email" | "phone";
export type PaymentMethod = "etransfer" | "cash";

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  contact_method: ContactMethod;
  contact_value: string;
  payment_method: PaymentMethod;
  subtotal_cents: number;
  notes: string | null;
  batch_label: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  size_label: string;
  quantity: number;
  unit_price_cents: number;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };

// Cart lives only in localStorage on the client. No DB representation.
export type CartLine = {
  product_id: string;
  product_name: string;
  size_label: string;
  unit_price_cents: number;
  image_path: string | null;
  quantity: number;
};
