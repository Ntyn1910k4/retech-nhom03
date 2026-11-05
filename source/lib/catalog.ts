import raw from "@/data/devices.json";
import quotesRaw from "@/data/prices.json";
import { Device, Quote, categoryNames } from "./types";
export const devices = raw as Device[];
export const quotes = quotesRaw as Quote[];
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
export function deviceQuotes(d: Device) {
  return quotes.filter(
    (q) => q.device_id === d.id || d.quote_ids?.includes(q.id),
  );
}
export function enrich(d: Device) {
  const refs = deviceQuotes(d),
    ref = refs.find((q) => q.condition === "new") || refs[0];
  return {
    ...d,
    image_url: d.image_url || ref?.image_url || null,
    reference_price: ref?.price || null,
    reference_condition: ref?.condition || null,
    reference_count: refs.length,
    reference_url: ref?.source_url || null,
  };
}
export function catalogSummary() {
  return {
    total: devices.length,
    categories: Object.entries(categoryNames).map(([id, name]) => ({
      id,
      name,
      count: devices.filter((d) => d.category === id).length,
    })),
    brands: [...new Set(devices.map((d) => d.brand))].sort(),
    years: [...new Set(devices.map((d) => d.release_year))].sort(
      (a, b) => b - a,
    ),
    quotes: quotes.length,
    priced: devices.filter((d) => deviceQuotes(d).length).length,
    heroOther: enrich(
      devices.find(
        (d) =>
          d.category === "laptop" &&
          d.source_name === "Apple Support" &&
          d.image_url,
      ) || devices[0],
    ),
    updated: "02/11/2026",
  };
}
export function getCatalog(
  p: {
    q?: string;
    category?: string;
    brand?: string;
    year?: string;
    min?: string;
    max?: string;
    sort?: string;
    page?: number;
    limit?: number;
    priced?: boolean;
  } = {},
) {
  let items = devices.map(enrich);
  if (p.q) {
    const n = normalize(p.q);
    items = items.filter((d) =>
      normalize([d.name, d.brand, d.model].join(" ")).includes(n),
    );
  }
  if (p.category) items = items.filter((d) => d.category === p.category);
  if (p.brand) items = items.filter((d) => d.brand === p.brand);
  if (p.year) items = items.filter((d) => d.release_year === Number(p.year));
  if (p.min)
    items = items.filter(
      (d) => d.reference_price != null && d.reference_price >= Number(p.min),
    );
  if (p.max)
    items = items.filter(
      (d) => d.reference_price != null && d.reference_price <= Number(p.max),
    );
  if (p.priced) items = items.filter((d) => d.reference_price != null);
  items.sort((a, b) =>
    p.sort === "price_asc"
      ? (a.reference_price ?? Infinity) - (b.reference_price ?? Infinity)
      : p.sort === "price_desc"
        ? (b.reference_price ?? -1) - (a.reference_price ?? -1)
        : p.sort === "name"
          ? a.name.localeCompare(b.name)
          : p.sort === "year"
            ? b.release_year - a.release_year
            : Number(!!b.image_url && !!b.reference_price) -
                Number(!!a.image_url && !!a.reference_price) ||
              Number(!!b.image_url) - Number(!!a.image_url) ||
              b.release_year - a.release_year,
  );
  if (!p.sort || p.sort === "featured") {
    const order = ["phone", "laptop", "tablet", "router", "tv", "desktop"];
    const groups = order.map((c) => items.filter((d) => d.category === c));
    const mixed: typeof items = [];
    while (groups.some((g) => g.length))
      for (const g of groups) {
        const d = g.shift();
        if (d) mixed.push(d);
      }
    items = mixed;
  }
  const total = items.length,
    limit = Math.max(1, Math.min(p.limit || 24, 1000)),
    page = Math.max(1, p.page || 1);
  return {
    items: items.slice((page - 1) * limit, page * limit),
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}
export function getDevice(id: string) {
  const d = devices.find((d) => d.id === id);
  return d ? { ...enrich(d), quotes: deviceQuotes(d) } : null;
}
