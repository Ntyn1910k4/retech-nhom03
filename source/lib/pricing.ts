import type { Device, Quote } from "./types";
export const CONDITION_FACTORS: Record<string, number> = {
  new: 1,
  used_good: 0.8,
  used_scratched: 0.65,
  activated: 0.92,
  display: 0.85,
  warranty_replacement: 0.88,
  repair: 0.45,
};
export const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length
    ? (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2
    : 0;
};
export function estimatePrice(
  d: Device,
  refs: Quote[],
  input: {
    condition: string;
    battery?: number;
    repairCost?: number;
    storage?: string;
  },
) {
  const trace = [{ tool: "get_device", status: "completed", detail: d.name }];
  let valid = refs.filter(
    (q) =>
      q.currency === "VND" &&
      Number.isFinite(q.price) &&
      q.price > 0 &&
      q.source_url &&
      Date.parse(q.observed_at) <= Date.now() + 86400000 &&
      Date.parse(q.observed_at) > Date.now() - 90 * 86400000,
  );
  const variants = [
    ...new Set(valid.map((q) => q.storage_text).filter(Boolean)),
  ];
  if (!input.storage && variants.length > 1)
    return {
      status: "needs_variant",
      device: d.name,
      message:
        "Model có nhiều cấu hình tại nguồn. Hãy chọn đúng cấu hình trước khi định giá.",
      variants,
      references: [],
      trace,
    };
  if (input.storage)
    valid = valid.filter(
      (q) =>
        !!q.storage_text &&
        q.storage_text.replace(/\s/g, "").toLowerCase() ===
          input.storage!.replace(/\s/g, "").toLowerCase(),
    );
  trace.push({
    tool: "search_price_references",
    status: "completed",
    detail: `${valid.length} quan sát giá có nguồn trong 90 ngày`,
  });
  const factor = CONDITION_FACTORS[input.condition];
  if (!Number.isFinite(factor))
    throw new Error("Tình trạng thiết bị không hợp lệ");
  if (
    input.battery !== undefined &&
    (!Number.isFinite(input.battery) ||
      input.battery < 0 ||
      input.battery > 100)
  )
    throw new Error("Tình trạng pin phải từ 0 đến 100");
  if (
    input.repairCost !== undefined &&
    (!Number.isFinite(input.repairCost) ||
      input.repairCost < 0 ||
      input.repairCost > 1000000000)
  )
    throw new Error("Chi phí sửa chữa không hợp lệ");
  if (!valid.length)
    return {
      status: "insufficient_data",
      device: d.name,
      message:
        "Chưa có giá tham khảo phù hợp và đủ mới cho thiết bị này. Hãy đối chiếu nguồn hoặc bổ sung quan sát giá đã kiểm tra.",
      references: [],
      trace,
    };
  const exact = valid.filter((q) => q.condition === input.condition);
  const sample = exact.length ? exact : valid;
  const normalized = sample.map(
    (q) =>
      q.price *
      (exact.length ? 1 : factor / (CONDITION_FACTORS[q.condition] || 1)),
  );
  const repair = input.repairCost || 0,
    base = median(normalized),
    target = Math.max(0, Math.round((base - repair) / 10000) * 10000);
  const low = Math.max(
      0,
      Math.round((Math.min(...normalized) * 0.95 - repair) / 10000) * 10000,
    ),
    high = Math.max(
      low,
      Math.round((Math.max(...normalized) * 1.05 - repair) / 10000) * 10000,
    );
  trace.push({
    tool: "estimate_price",
    status: "completed",
    detail: exact.length
      ? "Trung vị giá cùng tình trạng, dải biên quy tắc 5%"
      : "Chuẩn hóa theo hệ số tình trạng thử nghiệm rồi lấy trung vị",
  });
  return {
    status: "estimated",
    device: d.name,
    low,
    high,
    suggested: target,
    base: Math.round(base),
    repair_cost: repair,
    method: exact.length
      ? "observed_condition_median"
      : "condition_rule_estimate",
    sample_count: sample.length,
    data_adequacy: sample.length >= 3 ? "Có nhiều quan sát" : "Ít quan sát",
    condition_factor: factor,
    adjusted_condition: !exact.length,
    assumptions:
      "Hệ số tình trạng và biên 5% là quy tắc thử nghiệm chưa hiệu chỉnh. Đây là giá tham khảo từ niêm yết, chưa phải giá giao dịch hay khoảng tin cậy thống kê. Pin được ghi nhận để tư vấn kiểm tra, không suy diễn chi phí thay pin.",
    references: sample,
    trace,
    created_at: new Date().toISOString(),
  };
}
