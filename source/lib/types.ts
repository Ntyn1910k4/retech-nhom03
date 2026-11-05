export type Category =
  | "phone"
  | "laptop"
  | "router"
  | "desktop"
  | "tablet"
  | "tv";
export interface Device {
  id: string;
  category: Category;
  brand: string;
  name: string;
  model: string;
  release_year: number;
  release_date?: string;
  year_basis?: string;
  specs: Record<string, unknown>;
  image_url: string | null;
  source_url: string;
  source_name: string;
  source_record_id?: string;
  source_dataset_url?: string;
  retrieved_at: string;
  quote_ids?: string[];
  price?: number | null;
  price_currency?: string | null;
  price_type?: string | null;
}
export interface Quote {
  id: string;
  device_id?: string;
  device_name: string;
  model_name?: string;
  brand: string;
  category: Category;
  price: number;
  currency: string;
  price_type: string;
  condition: string;
  source_name: string;
  source_url: string;
  observed_at: string;
  image_url?: string;
  storage_text?: string;
  listing_source_url?: string;
}
export const categoryNames: Record<Category, string> = {
  phone: "Điện thoại",
  laptop: "Laptop",
  tablet: "iPad & Tablet",
  desktop: "Máy tính bàn",
  router: "Router & Wi-Fi",
  tv: "TV & Màn hình",
};
