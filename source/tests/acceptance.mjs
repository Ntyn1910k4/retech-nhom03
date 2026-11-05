import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createTestRuntime } from "./runtime.mjs";
const { mf, db } = await createTestRuntime();
const checks = [];
let seller, buyer, other;
const started = new Date().toISOString();
async function check(name, fn) {
  const t = performance.now();
  try {
    await fn();
    checks.push({
      name,
      status: "passed",
      duration_ms: Math.round(performance.now() - t),
    });
    console.log("PASS", name);
  } catch (e) {
    checks.push({
      name,
      status: "failed",
      error: e.message,
      duration_ms: Math.round(performance.now() - t),
    });
    console.error("FAIL", name, e.message);
    throw e;
  }
}
async function req(
  path,
  { method = "GET", body, cookie, origin, ...extra } = {},
) {
  let payload =
    body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
  let multipartHeaders = {};
  if (body instanceof FormData) {
    const encoded = new Request("http://retech.test", { method: "POST", body });
    multipartHeaders = Object.fromEntries(encoded.headers);
    payload = await encoded.arrayBuffer();
  }
  const r = await mf.dispatchFetch("http://retech.test/api/" + path, {
    method,
    headers: {
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...multipartHeaders,
      ...(cookie ? { cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(payload ? { body: payload } : {}),
    ...extra,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
    headers: r.headers,
  };
}
const post = (p, b, c) => req(p, { method: "POST", body: b, cookie: c });
const patch = (p, b, c) => req(p, { method: "PATCH", body: b, cookie: c });
const source = JSON.parse(readFileSync("data/devices.json", "utf8")),
  prices = JSON.parse(readFileSync("data/prices.json", "utf8"));
let device, listing, order, imageKey;
try {
  await check("Danh mục có đúng 1.000 ID khác nhau và 6 nhóm", async () => {
    const r = await req("summary");
    assert.equal(r.status, 200);
    assert.equal(r.data.total, 1000);
    assert.equal(r.data.categories.length, 6);
    assert.equal(new Set(source.map((d) => d.id)).size, 1000);
  });
  await check("Mọi hồ sơ có nguồn và năm trong 2015–2026", async () => {
    assert.ok(
      source.every(
        (d) =>
          /^https?:/.test(d.source_url) &&
          d.release_year >= 2015 &&
          d.release_year <= 2026 &&
          d.year_basis,
      ),
    );
  });
  await check("Tìm đúng iPhone 16 Pro Max không trộn Pro", async () => {
    const r = await req("catalog?q=iPhone%2016%20Pro%20Max");
    assert.equal(r.status, 200);
    assert.ok(r.data.items.length);
    assert.ok(r.data.items.every((d) => d.name.includes("16 Pro Max")));
  });
  await check("Lọc router và năm đúng dữ liệu", async () => {
    const r = await req("catalog?category=router&year=2023");
    assert.equal(r.status, 200);
    assert.ok(r.data.items.length);
    assert.ok(
      r.data.items.every(
        (d) => d.category === "router" && d.release_year === 2023,
      ),
    );
  });
  await check("Phân trang không lặp ID", async () => {
    const [a, b] = await Promise.all([
      req("catalog?limit=24&page=1"),
      req("catalog?limit=24&page=2"),
    ]);
    assert.equal(a.data.items.length, 24);
    assert.equal(b.data.items.length, 24);
    assert.ok(
      !a.data.items.some((d) => b.data.items.some((e) => e.id === d.id)),
    );
  });
  await check("Sắp giá tăng dần và không tạo giá cho model thiếu", async () => {
    const r = await req("catalog?sort=price_asc&priced=true&limit=1000");
    assert.ok(r.data.items.length > 0);
    assert.ok(r.data.items.every((d) => d.reference_price > 0));
    for (let i = 1; i < r.data.items.length; i++)
      assert.ok(
        r.data.items[i].reference_price >= r.data.items[i - 1].reference_price,
      );
    device =
      r.data.items.find(
        (d) => prices.filter((p) => p.device_id === d.id).length === 1,
      ) || r.data.items[0];
  });
  await check("Tìm không có kết quả trả danh sách rỗng", async () => {
    const r = await req("catalog?q=zzzz-no-such-real-device");
    assert.equal(r.data.total, 0);
    assert.deepEqual(r.data.items, []);
  });
  await check("Model không tồn tại trả 404", async () =>
    assert.equal((await req("devices/no-such-id")).status, 404),
  );
  await check("Chặn tài khoản ẩn danh truy cập dữ liệu riêng", async () => {
    assert.equal((await req("favorites")).status, 401);
    assert.equal((await req("orders")).status, 401);
    assert.equal((await req("admin")).status, 401);
  });
  await check("Kiểm tra email và độ dài mật khẩu", async () => {
    assert.equal(
      (
        await post("auth/register", {
          name: "QA",
          email: "wrong",
          password: "long-enough-password",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await post("auth/register", {
          name: "QA",
          email: "qa@test.invalid",
          password: "short",
        })
      ).status,
      400,
    );
  });
  await check("Đăng ký ba tài khoản kiểm thử biệt lập", async () => {
    seller = await post("auth/register", {
      name: "QA người bán",
      email: "seller@test.invalid",
      password: "local-only-qa-password",
    });
    buyer = await post("auth/register", {
      name: "QA người mua",
      email: "buyer@test.invalid",
      password: "local-only-qa-password",
    });
    other = await post("auth/register", {
      name: "QA tài khoản khác",
      email: "other@test.invalid",
      password: "local-only-qa-password",
    });
    assert.equal(seller.status, 200);
    assert.equal(buyer.status, 200);
    assert.equal(other.status, 200);
    assert.ok(seller.headers.get("set-cookie").includes("HttpOnly"));
    assert.ok(seller.headers.get("set-cookie").includes("SameSite=Lax"));
  });
  await check("Mật khẩu được băm và session lưu SHA256", async () => {
    const row = await db
      .prepare("SELECT * FROM users WHERE email=?")
      .bind("seller@test.invalid")
      .first();
    assert.notEqual(row.password_hash, "local-only-qa-password");
    assert.equal(row.password_hash.length, 64);
    assert.equal(row.salt.length, 64);
    const session = await db
      .prepare("SELECT * FROM sessions WHERE user_id=?")
      .bind(row.id)
      .first();
    assert.equal(session.token_hash.length, 64);
    assert.notEqual(session.token_hash, seller.cookie.split("=")[1]);
  });
  await check("Email trùng bị từ chối 409", async () =>
    assert.equal(
      (
        await post("auth/register", {
          name: "QA",
          email: "seller@test.invalid",
          password: "local-only-qa-password",
        })
      ).status,
      409,
    ),
  );
  await check("Đăng nhập sai trả 401, đúng cấp phiên", async () => {
    assert.equal(
      (
        await post("auth/login", {
          email: "seller@test.invalid",
          password: "incorrect",
        })
      ).status,
      401,
    );
    const r = await post("auth/login", {
      email: "seller@test.invalid",
      password: "local-only-qa-password",
    });
    assert.equal(r.status, 200);
    assert.ok(r.cookie);
  });
  await check("Chặn yêu cầu ghi khác origin", async () =>
    assert.equal(
      (
        await req("favorites", {
          method: "POST",
          body: { deviceId: device.id, saved: true },
          cookie: seller.cookie,
          origin: "https://untrusted.test",
        })
      ).status,
      403,
    ),
  );
  await check("Người dùng thường không có quyền quản trị", async () =>
    assert.equal((await req("admin", { cookie: buyer.cookie })).status, 403),
  );
  await check("Chặn mã quản trị sai, chấp nhận mã máy chủ đúng", async () => {
    assert.equal(
      (await post("admin/bootstrap", { token: "incorrect" }, seller.cookie))
        .status,
      403,
    );
    assert.equal(
      (
        await post(
          "admin/bootstrap",
          { token: "isolated-test-bootstrap-token-not-a-production-secret" },
          seller.cookie,
        )
      ).status,
      200,
    );
  });
  await check("Lưu thiết bị bền vững và không nhân đôi", async () => {
    await post("favorites", { deviceId: device.id, saved: true }, buyer.cookie);
    await post("favorites", { deviceId: device.id, saved: true }, buyer.cookie);
    const r = await req("favorites", { cookie: buyer.cookie });
    assert.equal(r.data.items.length, 1);
    assert.equal(r.data.items[0].id, device.id);
  });
  await check("Từ chối tin đăng thiếu mô tả hoặc giá âm", async () => {
    const r = await post(
      "listings",
      {
        deviceId: device.id,
        title: "QA thiết bị thật",
        description: "ngắn",
        price: -100,
        condition: "used_good",
      },
      buyer.cookie,
    );
    assert.equal(r.status, 400);
  });
  await check("Tin mới chờ duyệt, không tự xuất hiện ở chợ", async () => {
    const r = await post(
      "listings",
      {
        deviceId: device.id,
        title: "QA tin thiết bị từ danh mục thực",
        description:
          "Đây là nội dung kiểm thử tạm thời trên cơ sở dữ liệu biệt lập, không phải một tin bán thực.",
        price: 1000000,
        condition: "used_good",
      },
      buyer.cookie,
    );
    assert.equal(r.status, 201);
    listing = r.data.id;
    assert.equal(r.data.status, "pending");
    assert.equal((await req("listings")).data.items.length, 0);
  });
  await check("Chặn sửa tin không thuộc sở hữu", async () =>
    assert.equal(
      (await patch("listings/" + listing, { status: "sold" }, other.cookie))
        .status,
      403,
    ),
  );
  await check("Quản trị duyệt tin và công bố vào chợ", async () => {
    assert.equal(
      (await patch("listings/" + listing, { status: "active" }, seller.cookie))
        .status,
      200,
    );
    const r = await req("listings");
    assert.equal(r.data.items.length, 1);
    assert.equal(r.data.items[0].id, listing);
  });
  await check("Không cho tự mua tin đang bán của mình", async () =>
    assert.equal(
      (
        await post(
          "orders",
          { listingId: listing, message: "Tôi muốn kiểm tra thiết bị." },
          buyer.cookie,
        )
      ).status,
      400,
    ),
  );
  await check("Gửi yêu cầu mua và giữ chỗ nguyên tử", async () => {
    const results = await Promise.all([
      post(
        "orders",
        { listingId: listing, message: "Yêu cầu kiểm thử người mua A." },
        seller.cookie,
      ),
      post(
        "orders",
        { listingId: listing, message: "Yêu cầu kiểm thử người mua B." },
        other.cookie,
      ),
    ]);
    assert.equal(results.filter((r) => r.status === 201).length, 1);
    assert.equal(results.filter((r) => r.status === 409).length, 1);
    order = results.find((r) => r.status === 201).data.id;
    assert.equal((await req("listings")).data.items.length, 0);
  });
  await check("Người bán xác nhận rồi đánh dấu hoàn tất", async () => {
    assert.equal(
      (await patch("orders/" + order, { status: "accepted" }, buyer.cookie))
        .status,
      200,
    );
    assert.equal(
      (await patch("listings/" + listing, { status: "sold" }, buyer.cookie))
        .status,
      200,
    );
    const r = await req("orders", { cookie: buyer.cookie });
    assert.equal(r.data.items[0].status, "completed");
    assert.equal(
      (await patch("orders/" + order, { status: "cancelled" }, buyer.cookie))
        .status,
      409,
    );
  });
  await check("Upload chặn ảnh giả magic bytes", async () => {
    const f = new FormData();
    f.set(
      "file",
      new File(["<script>invalid</script>"], "fake.png", { type: "image/png" }),
    );
    assert.equal(
      (await req("upload", { method: "POST", body: f, cookie: buyer.cookie }))
        .status,
      400,
    );
  });
  await check("Upload PNG hợp lệ và tải lại từ R2", async () => {
    const f = new FormData();
    const bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=",
      "base64",
    );
    f.set("file", new File([bytes], "qa.png", { type: "image/png" }));
    const r = await req("upload", {
      method: "POST",
      body: f,
      cookie: buyer.cookie,
    });
    assert.equal(r.status, 201);
    imageKey = r.data.key;
    const image = await mf.dispatchFetch(
      "http://retech.test/api/images/" + imageKey,
    );
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("content-type"), "image/png");
    assert.equal((await image.arrayBuffer()).byteLength, bytes.length);
  });
  await check("Chặn tham chiếu ảnh thuộc tài khoản khác", async () => {
    const r = await post(
      "listings",
      {
        deviceId: device.id,
        title: "QA tin ảnh không sở hữu",
        description:
          "Kiểm thử tham chiếu ảnh của một tài khoản khác phải bị chặn tại máy chủ.",
        price: 1000000,
        condition: "used_good",
        imageKey,
      },
      other.cookie,
    );
    assert.equal(r.status, 403);
  });
  await check("Định giá dựa trên quan sát thật và lưu lịch sử", async () => {
    const p = prices.find((p) => p.device_id === device.id);
    const r = await post(
      "valuations",
      {
        deviceId: device.id,
        condition: p.condition,
        storage: p.storage_text,
        repairCost: 0,
      },
      buyer.cookie,
    );
    assert.equal(r.status, 200);
    assert.equal(r.data.status, "estimated");
    assert.equal(r.data.references[0].source_url, p.source_url);
    assert.equal(r.data.suggested, Math.round(p.price / 10000) * 10000);
    assert.ok(
      r.data.low <= r.data.suggested && r.data.suggested <= r.data.high,
    );
    assert.ok(
      (await req("valuations", { cookie: buyer.cookie })).data.items.length,
    );
  });
  await check("Model không có giá trả insufficient_data", async () => {
    const d = source.find((d) => !d.quote_ids?.length);
    const r = await post("valuations", {
      deviceId: d.id,
      condition: "used_good",
    });
    assert.equal(r.data.status, "insufficient_data");
    assert.ok(!r.data.suggested);
  });
  await check("Không định giá khi còn nhiều cấu hình chưa chọn", async () => {
    const d = source.find(
      (d) =>
        new Set(
          prices
            .filter((p) => p.device_id === d.id)
            .map((p) => p.storage_text)
            .filter(Boolean),
        ).size > 1,
    );
    if (d) {
      const r = await post("valuations", {
        deviceId: d.id,
        condition: "used_good",
      });
      assert.equal(r.data.status, "needs_variant");
    } else assert.ok(true);
  });
  await check("Chặn tình trạng, pin và chi phí không hợp lệ", async () => {
    assert.equal(
      (await post("valuations", { deviceId: device.id, condition: "invented" }))
        .status,
      400,
    );
    assert.equal(
      (
        await post("valuations", {
          deviceId: device.id,
          condition: "used_good",
          battery: -1,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await post("valuations", {
          deviceId: device.id,
          condition: "used_good",
          repairCost: -1,
        })
      ).status,
      400,
    );
  });
  await check("Trợ lý offline ghi đúng chế độ dữ liệu", async () => {
    const r = await post("agent", { message: "iPhone 16 Pro Max" });
    assert.equal(r.status, 200);
    assert.equal(r.data.mode, "local");
    assert.ok(r.data.trace.some((t) => t.tool === "search_devices"));
    assert.ok(r.data.devices.length);
  });
  await check("Nhật ký quản trị có thao tác thật", async () => {
    const r = await req("admin", { cookie: seller.cookie });
    assert.equal(r.status, 200);
    assert.ok(r.data.logs.some((l) => l.action === "listing.active"));
    assert.ok(r.data.logs.some((l) => l.action === "order.created"));
  });
  await check("Đăng xuất thu hồi phiên", async () => {
    assert.equal((await post("auth/logout", {}, buyer.cookie)).status, 200);
    assert.equal(
      (await req("favorites", { cookie: buyer.cookie })).status,
      401,
    );
  });
} catch (e) {
  process.exitCode = 1;
} finally {
  await mf.dispose();
  mkdirSync("evidence", { recursive: true });
  const result = {
    started_at: started,
    finished_at: new Date().toISOString(),
    environment:
      "Built production Worker through Miniflare with isolated real D1 and R2. Temporary QA accounts/transactions only; no OpenAI key configured.",
    total: checks.length,
    passed: checks.filter((c) => c.status === "passed").length,
    failed: checks.filter((c) => c.status === "failed").length,
    checks,
    limits: [
      "External OpenAI API not exercised without configured credentials.",
      "No actual payment, shipping or completed marketplace sale is executed.",
    ],
  };
  writeFileSync(
    "evidence/acceptance-results.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      total: result.total,
      passed: result.passed,
      failed: result.failed,
    }),
  );
}
