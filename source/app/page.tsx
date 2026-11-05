import Storefront from "./storefront";
import { catalogSummary, getCatalog } from "@/lib/catalog";
export default function Page() {
  return (
    <Storefront
      initial={getCatalog({ limit: 12, sort: "featured" })}
      summary={catalogSummary()}
    />
  );
}
