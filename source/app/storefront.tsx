"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Heart,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Router,
  Tv,
  SlidersHorizontal,
  Scale,
  UserRound,
  LogOut,
  ExternalLink,
  CheckCheck,
  FileText,
  Clock3,
  ShieldCheck,
  CircleHelp,
  Send,
  Upload,
  Menu,
  RefreshCw,
  Database,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { categoryNames, type Category } from "@/lib/types";

type Item = any;
type View =
  | "home"
  | "catalog"
  | "valuation"
  | "market"
  | "sell"
  | "account"
  | "favorites"
  | "sources"
  | "admin"
  | "compare";
const icons: Record<string, any> = {
  phone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  desktop: Monitor,
  router: Router,
  tv: Tv,
};
const conditions: Record<string, string> = {
  new: "Mới nguyên hộp",
  used_good: "Cũ đẹp, hoạt động tốt",
  used_scratched: "Cũ, có trầy xước",
  activated: "Đã kích hoạt",
  display: "Hàng trưng bày",
  warranty_replacement: "Hàng đổi bảo hành",
  repair: "Cần sửa chữa",
};
const yearLabels: Record<string, string> = {
  manufacturer_model_year: "Năm model do hãng công bố",
  source_released_year: "Năm phát hành tại nguồn",
  source_announced_year: "Năm công bố tại nguồn",
  market_availability_date: "Năm bắt đầu có bán theo EPA",
  manufacturer_announcement_year: "Năm thông cáo của hãng",
  retailer_explicit_model_year: "Năm model trong tên sản phẩm",
  retailer_specification_release_year: "Năm ra mắt trong thông số nhà bán lẻ",
};
const specLabels: Record<string, string> = {
  storage: "Dung lượng",
  colors: "Màu sắc",
  model_numbers: "Mã model",
  display: "Màn hình",
  cpu: "Bộ xử lý",
  memory: "Bộ nhớ",
  battery: "Pin",
  weight: "Khối lượng",
  dimensions: "Kích thước",
  ram: "RAM",
  screen_size: "Kích thước màn hình",
  operating_system: "Hệ điều hành",
  markets: "Thị trường ghi nhận",
  product_type: "Loại thiết bị",
  network: "Kết nối mạng",
  historical_price_text: "Giá lịch sử trong nguồn",
};
const statuses: Record<string, string> = {
  pending: "Chờ duyệt",
  active: "Đang bán",
  reserved: "Đang giữ chỗ",
  sold: "Đã bán",
  rejected: "Cần chỉnh sửa",
  accepted: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};
const money = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);
const when = (s: string) => new Date(s).toLocaleDateString("vi-VN");
async function api(path: string, options: RequestInit = {}) {
  const r = await fetch("/api/" + path, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const data: any = await r.json();
  if (!r.ok) throw new Error(data.error || "Không thể tải dữ liệu");
  return data;
}
const post = (path: string, data: unknown, method = "POST") =>
  api(path, { method, body: JSON.stringify(data) });

function DeviceImage({ item, hero = false }: { item: Item; hero?: boolean }) {
  const [failed, setFailed] = useState(false);
  const Icon = icons[item?.category] || Monitor;
  return item?.image_url && !failed ? (
    <img
      className={hero ? "hero-product" : "device-image"}
      src={item.image_url}
      alt={item.name}
      loading={hero ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="device-placeholder">
      <Icon size={hero ? 110 : 64} strokeWidth={1} />
      <span>Hình danh mục</span>
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <Loader2 className="spin" size={24} />
      <span>Đang tải dữ liệu…</span>
    </div>
  );
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <ShoppingBag size={30} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export default function Storefront({
  initial,
  summary,
}: {
  initial: Item;
  summary: Item;
}) {
  const [view, setView] = useState<View>("home"),
    [catalog, setCatalog] = useState(initial),
    [q, setQ] = useState(""),
    [category, setCategory] = useState(""),
    [brand, setBrand] = useState(""),
    [year, setYear] = useState(""),
    [budget, setBudget] = useState(""),
    [sort, setSort] = useState("featured"),
    [page, setPage] = useState(1),
    [priced, setPriced] = useState(false),
    [loading, setLoading] = useState(false),
    [filters, setFilters] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null),
    [user, setUser] = useState<Item | null>(null),
    [auth, setAuth] = useState(false),
    [register, setRegister] = useState(false),
    [authBusy, setAuthBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [mobileMenu, setMobileMenu] = useState(false);
  const [saved, setSaved] = useState<string[]>([]),
    [compare, setCompare] = useState<Item[]>([]),
    [favoriteItems, setFavoriteItems] = useState<Item[]>([]),
    [valDevice, setValDevice] = useState<Item | null>(null),
    [result, setResult] = useState<Item | null>(null),
    [valBusy, setValBusy] = useState(false),
    [condition, setCondition] = useState("used_good");
  const [listings, setListings] = useState<Item[]>([]),
    [mine, setMine] = useState<Item[]>([]),
    [orders, setOrders] = useState<Item[]>([]),
    [history, setHistory] = useState<Item[]>([]),
    [admin, setAdmin] = useState<Item | null>(null),
    [refresh, setRefresh] = useState(0);
  const [chat, setChat] = useState(false),
    [chatInput, setChatInput] = useState(""),
    [messages, setMessages] = useState<Item[]>([
      {
        role: "assistant",
        content:
          "Chào bạn. Hãy nhập tên thiết bị bạn muốn tìm hoặc mô tả nhu cầu. Mọi giá tham khảo đều cần dữ liệu có nguồn.",
      },
    ]),
    [chatBusy, setChatBusy] = useState(false),
    [aiMode, setAiMode] = useState("local"),
    [trace, setTrace] = useState<Item[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function toast(s: string) {
    setNotice(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(""), 5000);
  }
  function go(v: View) {
    setView(v);
    setMobileMenu(false);
    setSelected(null);
    setPage(1);
    window.history.pushState({}, "", v === "home" ? "/" : "/?view=" + v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function chooseCategory(c: string) {
    setCategory(c);
    setBrand("");
    setYear("");
    setQ("");
    go("catalog");
  }
  async function openDevice(id: string) {
    try {
      setSelected(await api("devices/" + id));
      window.history.replaceState(
        {},
        "",
        "/?view=" + view + "&device=" + encodeURIComponent(id),
      );
    } catch (e) {
      toast((e as Error).message);
    }
  }
  function closeDevice() {
    setSelected(null);
    window.history.replaceState({}, "", "/?view=" + view);
  }
  function valueDevice(d: Item) {
    setValDevice(d);
    setResult(null);
    go("valuation");
  }
  function sellDevice(d: Item) {
    setValDevice(d);
    go("sell");
  }
  async function loadMe() {
    try {
      const r = await api("me");
      setUser(r.user);
      setAiMode(r.ai_mode);
      if (r.user) {
        const f = await api("favorites");
        setSaved(f.items.map((d: Item) => d.id));
        setFavoriteItems(f.items);
      }
    } catch {
      /* Anonymous catalogue remains available if storage is temporarily unavailable. */
    }
  }
  useEffect(() => {
    const params = new URLSearchParams(location.search),
      v = params.get("view") as View;
    const allowed = [
      "home",
      "catalog",
      "valuation",
      "market",
      "sell",
      "account",
      "favorites",
      "sources",
      "admin",
      "compare",
    ];
    if (v && allowed.includes(v)) setView(v);
    const id = params.get("device");
    if (id)
      api("devices/" + id)
        .then(setSelected)
        .catch((e) => toast(e.message));
    try {
      setSaved(JSON.parse(localStorage.getItem("retech-saved") || "[]"));
    } catch {}
    void loadMe();
    const pop = () => {
      const p = new URLSearchParams(location.search);
      setView((p.get("view") as View) || "home");
      setSelected(null);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    if (view !== "catalog") return;
    const abort = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        q,
        category,
        brand,
        year,
        sort,
        page: String(page),
        limit: "24",
        priced: String(priced),
        ...(budget ? { max: budget } : {}),
      });
      api("catalog?" + params, { signal: abort.signal })
        .then(setCatalog)
        .catch((e) => {
          if (e.name !== "AbortError") toast(e.message);
        })
        .finally(() => {
          if (!abort.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [view, q, category, brand, year, budget, sort, page, priced]);
  useEffect(() => {
    if (view === "market")
      api("listings")
        .then((r) => setListings(r.items))
        .catch((e) => toast(e.message));
    if (view === "account" && user)
      Promise.all([api("listings?mine=true"), api("orders"), api("valuations")])
        .then(([a, b, c]) => {
          setMine(a.items);
          setOrders(b.items);
          setHistory(c.items);
        })
        .catch((e) => toast(e.message));
    if (view === "admin" && user?.role === "admin")
      api("admin")
        .then(setAdmin)
        .catch((e) => toast(e.message));
    if (view === "favorites") {
      if (user)
        api("favorites")
          .then((r) => setFavoriteItems(r.items))
          .catch((e) => toast(e.message));
      else
        Promise.all(
          saved.map((id) => api("devices/" + id).catch(() => null)),
        ).then((r) => setFavoriteItems(r.filter(Boolean)));
    }
  }, [view, user, refresh]);
  useEffect(() => {
    if (!selected && !auth && !chat && !mobileMenu) return;
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelected(null);
        setAuth(false);
        setChat(false);
        setMobileMenu(false);
      }
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [selected, auth, chat, mobileMenu]);
  async function save(d: Item) {
    const next = saved.includes(d.id)
      ? saved.filter((id) => id !== d.id)
      : [...saved, d.id];
    try {
      if (user)
        await post("favorites", { deviceId: d.id, saved: next.includes(d.id) });
      localStorage.setItem("retech-saved", JSON.stringify(next));
      setSaved(next);
      setFavoriteItems((prev) =>
        next.includes(d.id)
          ? [...prev.filter((i) => i.id !== d.id), d]
          : prev.filter((i) => i.id !== d.id),
      );
      toast(
        next.includes(d.id)
          ? user
            ? "Đã lưu vào tài khoản"
            : "Đã lưu trên thiết bị này"
          : "Đã bỏ lưu",
      );
    } catch (e) {
      toast((e as Error).message);
    }
  }
  function toggleCompare(d: Item) {
    if (compare.some((i) => i.id === d.id))
      setCompare(compare.filter((i) => i.id !== d.id));
    else if (compare.length === 3) toast("Chọn tối đa 3 thiết bị để so sánh");
    else setCompare([...compare, d]);
  }
  async function authenticate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setAuthBusy(true);
    try {
      const r = await post(
        register ? "auth/register" : "auth/login",
        Object.fromEntries(f),
      );
      setUser(r.user);
      setAuth(false);
      toast(register ? "Tạo tài khoản thành công" : "Đăng nhập thành công");
      void loadMe();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }
  async function valuation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valDevice) {
      toast("Hãy chọn một thiết bị trong danh mục");
      return;
    }
    setValBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const b: any = {
        deviceId: valDevice.id,
        condition: f.get("condition"),
        repairCost: Number(f.get("repairCost") || 0),
      };
      if (f.get("battery")) b.battery = Number(f.get("battery"));
      if (f.get("storage")) b.storage = f.get("storage");
      setResult(await post("valuations", b));
      setRefresh((v) => v + 1);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setValBusy(false);
    }
  }
  async function createListing(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      setAuth(true);
      return;
    }
    if (!valDevice) {
      toast("Hãy chọn thiết bị trước");
      return;
    }
    const f = new FormData(e.currentTarget);
    setLoading(true);
    try {
      let imageKey;
      const file = f.get("photo");
      if (file instanceof File && file.size) {
        const data = new FormData();
        data.append("file", file);
        imageKey = (await api("upload", { method: "POST", body: data })).key;
      }
      await post("listings", {
        deviceId: valDevice.id,
        title: f.get("title"),
        description: f.get("description"),
        price: Number(f.get("price")),
        condition: f.get("condition"),
        imageKey,
      });
      toast("Đã gửi tin đăng. Tin sẽ xuất hiện sau khi quản trị viên duyệt.");
      setRefresh((v) => v + 1);
      go("account");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function update(path: string, b: Item) {
    try {
      await post(path, b, "PATCH");
      setRefresh((v) => v + 1);
      toast("Đã cập nhật");
    } catch (e) {
      toast((e as Error).message);
    }
  }
  async function buy(l: Item) {
    if (!user) {
      setAuth(true);
      return;
    }
    const message = window.prompt(
      "Lời nhắn cho người bán (tối thiểu 5 ký tự):",
      "Tôi muốn trao đổi thêm và kiểm tra thiết bị trước khi mua.",
    );
    if (!message) return;
    try {
      await post("orders", { listingId: l.id, message });
      toast(
        "Đã gửi yêu cầu và giữ chỗ. Hai bên tiếp tục xác nhận trong tài khoản.",
      );
      setRefresh((v) => v + 1);
    } catch (e) {
      toast((e as Error).message);
    }
  }
  async function sendChat(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatBusy) return;
    const next = [...messages, { role: "user", content: chatInput.trim() }];
    setMessages(next);
    setChatInput("");
    setChatBusy(true);
    try {
      const r = await post("agent", {
        messages: next
          .filter((m) => !m.intro)
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages([
        ...next,
        { role: "assistant", content: r.message, devices: r.devices },
      ]);
      setTrace(r.trace || []);
      setAiMode(r.mode);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: (e as Error).message },
      ]);
    } finally {
      setChatBusy(false);
    }
  }
  function Card({ d }: { d: Item }) {
    return (
      <article className="product-card">
        <div className={"product-visual visual-" + d.category}>
          <button
            className="product-main-image"
            onClick={() => openDevice(d.id)}
            aria-label={"Xem " + d.name}
          >
            <DeviceImage item={d} />
          </button>
          <span className="year-chip">{d.release_year}</span>
          <button
            className={
              "save-button " + (saved.includes(d.id) ? "is-saved" : "")
            }
            onClick={() => save(d)}
            aria-label={
              saved.includes(d.id) ? "Bỏ lưu " + d.name : "Lưu " + d.name
            }
          >
            <Heart
              size={17}
              fill={saved.includes(d.id) ? "currentColor" : "none"}
            />
          </button>
          <button
            className={
              "compare-check " +
              (compare.some((i) => i.id === d.id) ? "checked" : "")
            }
            onClick={() => toggleCompare(d)}
          >
            <Scale size={14} /> So sánh
          </button>
        </div>
        <div className="product-body">
          <span className="product-brand">
            {d.brand} <span>•</span> {categoryNames[d.category as Category]}
          </span>
          <button className="product-title" onClick={() => openDevice(d.id)}>
            {d.name}
          </button>
          <div className="product-bottom">
            <div>
              <small>
                {d.reference_price
                  ? "Giá niêm yết tham khảo"
                  : "Hồ sơ thiết bị có nguồn"}
              </small>
              <strong>
                {d.reference_price
                  ? money(d.reference_price)
                  : "Khám phá thiết bị"}
              </strong>
            </div>
            <button
              className="round-link"
              onClick={() => openDevice(d.id)}
              aria-label={"Chi tiết " + d.name}
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
          {d.reference_price && (
            <span className="price-condition">
              {conditions[d.reference_condition] || "Theo nguồn"} ·{" "}
              {d.reference_count} quan sát
            </span>
          )}
        </div>
      </article>
    );
  }
  const featured = initial.items.slice(0, 8),
    heroPhone =
      initial.items.find((d: Item) => d.category === "phone" && d.image_url) ||
      initial.items[0],
    heroOther =
      summary.heroOther ||
      initial.items.find(
        (d: Item) => ["laptop", "tablet"].includes(d.category) && d.image_url,
      ) ||
      initial.items[1];
  return (
    <div className="site-shell">
      <div className="announcement">
        <span>THÊM MỘT VÒNG ĐỜI. THÊM NHIỀU GIÁ TRỊ.</span>
        <a
          href="/?view=sources"
          onClick={(e) => {
            e.preventDefault();
            go("sources");
          }}
        >
          Dữ liệu có nguồn <ArrowUpRight size={13} />
        </a>
      </div>
      <header className="header">
        <div className="header-inner">
          <a
            className="logo"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
          >
            <span className="logo-symbol">
              <ArrowUpRight size={23} />
            </span>
            retech<span className="logo-dot">.</span>
          </a>
          <nav
            className={mobileMenu ? "nav nav-open" : "nav"}
            aria-label="Điều hướng chính"
          >
            <button
              className={view === "catalog" ? "active" : ""}
              onClick={() => go("catalog")}
            >
              Khám phá thiết bị
            </button>
            <button
              className={view === "valuation" ? "active" : ""}
              onClick={() => go("valuation")}
            >
              Định giá
            </button>
            <button
              className={view === "market" ? "active" : ""}
              onClick={() => go("market")}
            >
              Chợ thiết bị
            </button>
            <button
              className={view === "sources" ? "active" : ""}
              onClick={() => go("sources")}
            >
              Về dữ liệu
            </button>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button desktop-only"
              onClick={() => go("favorites")}
              aria-label="Thiết bị đã lưu"
            >
              <Heart size={21} />
              {saved.length > 0 && (
                <span className="count-dot">{saved.length}</span>
              )}
            </button>
            <button
              className="icon-button"
              onClick={() => (user ? go("account") : setAuth(true))}
              aria-label={user ? "Tài khoản" : "Đăng nhập"}
            >
              <UserRound size={21} />
            </button>
            <button
              className="button button-dark header-sell"
              onClick={() => go("sell")}
            >
              <Plus size={16} /> Đăng bán
            </button>
            <button
              className="icon-button mobile-only"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Mở menu"
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main>
        {view === "home" && (
          <>
            <section className="hero wrap">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="status-dot" /> CÔNG NGHỆ TIẾP NỐI GIÁ TRỊ
                </span>
                <h1>
                  Thiết bị tốt.
                  <br />
                  <span>Giá trị xứng đáng.</span>
                </h1>
                <p>
                  Mua bán thông minh bắt đầu từ việc hiểu đúng thiết bị. Khám
                  phá, so sánh và định giá với dữ liệu có nguồn.
                </p>
                <div className="hero-buttons">
                  <button
                    className="button button-dark button-large"
                    onClick={() => go("catalog")}
                  >
                    Khám phá ngay <ArrowUpRight size={19} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => go("valuation")}
                  >
                    Định giá thiết bị <ArrowRight size={17} />
                  </button>
                </div>
                <div className="hero-proof">
                  <div className="proof-seal">
                    <CheckCheck size={21} />
                  </div>
                  <p>
                    <strong>
                      {summary.total.toLocaleString("vi-VN")} hồ sơ thiết bị
                      thực
                    </strong>
                    <span>6 danh mục · Có nguồn để đối chiếu</span>
                  </p>
                </div>
              </div>
              <div className="hero-art">
                <div className="hero-grid" />
                <div className="hero-circle" />
                <div className="hero-device hero-device-one">
                  {heroPhone && <DeviceImage item={heroPhone} hero />}
                </div>
                <div className="hero-device hero-device-two">
                  {heroOther && <DeviceImage item={heroOther} hero />}
                </div>
                <div className="hero-label">
                  <span className="status-dot" /> ĐỜI MÁY 2015 — NAY
                </div>
                <button
                  className="valuation-teaser"
                  onClick={() => go("valuation")}
                >
                  <span className="teaser-icon">
                    <Scale size={21} />
                  </span>
                  <span>
                    <small>HIỂU GIÁ TRƯỚC KHI BÁN</small>
                    <strong>
                      Định giá có căn cứ <ArrowUpRight size={16} />
                    </strong>
                  </span>
                </button>
                <div className="hero-caption">
                  A SECOND LIFE. A SMARTER CHOICE.
                </div>
              </div>
            </section>
            <section className="category-section wrap">
              <div className="section-overline">
                <span>TÌM ĐÚNG THIẾT BỊ CỦA BẠN</span>
                <span>01 — 06</span>
              </div>
              <div className="categories">
                {summary.categories.map((c: Item) => {
                  const Icon = icons[c.id];
                  return (
                    <button
                      className="category-tile"
                      key={c.id}
                      onClick={() => chooseCategory(c.id)}
                    >
                      <Icon strokeWidth={1.4} size={29} />
                      <span>{c.name}</span>
                      <small>
                        {c.count} thiết bị <ArrowUpRight size={13} />
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="section wrap">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">TUYỂN CHỌN TỪ DANH MỤC</span>
                  <h2>
                    Đáng để khám phá<span className="heading-dot">.</span>
                  </h2>
                </div>
                <button className="text-button" onClick={() => go("catalog")}>
                  Xem tất cả thiết bị <ArrowUpRight size={18} />
                </button>
              </div>
              <div className="product-grid">
                {featured.map((d: Item) => (
                  <Card key={d.id} d={d} />
                ))}
              </div>
              <p className="catalog-footnote">
                <CircleHelp size={14} /> Giá niêm yết tại nguồn vào ngày thu
                thập. Tin bán của người dùng được hiển thị riêng tại Chợ thiết
                bị.
              </p>
            </section>
            <section className="valuation-banner wrap">
              <div className="banner-mark">
                <Scale strokeWidth={1} size={76} />
                <span>Re / Value</span>
              </div>
              <div>
                <span className="eyebrow">TRƯỚC KHI MUA. TRƯỚC KHI BÁN.</span>
                <h2>
                  Thiết bị của bạn
                  <br />
                  đáng giá bao nhiêu?
                </h2>
                <p>
                  Chọn model, mô tả tình trạng, đối chiếu nguồn.
                  <br />
                  Nhận khoảng giá và hiểu cách tính.
                </p>
              </div>
              <button
                className="button button-dark button-large"
                onClick={() => go("valuation")}
              >
                Bắt đầu định giá <ArrowUpRight size={18} />
              </button>
            </section>
            <section className="process-section wrap">
              <div>
                <span className="eyebrow">MỘT LỰA CHỌN CÓ CƠ SỞ</span>
                <h2>
                  Rõ thông tin.
                  <br />
                  Dễ quyết định.
                </h2>
              </div>
              <div className="process-steps">
                {[
                  [
                    "01",
                    "Khám phá & đối chiếu",
                    "Tìm thiết bị theo hãng, năm và nhu cầu. Mở nguồn để xem thông tin gốc.",
                  ],
                  [
                    "02",
                    "Hiểu đúng giá trị",
                    "Định giá dựa trên quan sát giá và tình trạng, kèm giải thích phương pháp.",
                  ],
                  [
                    "03",
                    "Kết nối người mua bán",
                    "Đăng tin, chờ duyệt và gửi yêu cầu mua trước khi hai bên xác nhận.",
                  ],
                ].map(([n, t, d]) => (
                  <div key={n}>
                    <span>{n}</span>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        {view === "catalog" && (
          <div className="wrap catalog-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">THE DEVICE INDEX / 2015 — NAY</span>
                <h1>
                  Khám phá thiết bị<span className="heading-dot">.</span>
                </h1>
                <p>
                  {summary.total.toLocaleString("vi-VN")} hồ sơ thực. Chọn điều
                  phù hợp với bạn.
                </p>
              </div>
              <button className="text-button" onClick={() => go("sources")}>
                <Database size={17} /> Nguồn dữ liệu
              </button>
            </div>
            <div className="catalog-layout">
              <aside className={"filters " + (filters ? "show-filters" : "")}>
                <div className="filter-title">
                  <h3>Bộ lọc</h3>
                  <button
                    onClick={() => {
                      setCategory("");
                      setBrand("");
                      setYear("");
                      setBudget("");
                      setPriced(false);
                      setQ("");
                      setPage(1);
                    }}
                  >
                    Đặt lại
                  </button>
                </div>
                <div className="filter-group">
                  <label>Danh mục</label>
                  <button
                    className={
                      !category ? "filter-category checked" : "filter-category"
                    }
                    onClick={() => {
                      setCategory("");
                      setPage(1);
                    }}
                  >
                    Tất cả thiết bị <small>{summary.total}</small>
                  </button>
                  {summary.categories.map((c: Item) => {
                    const Icon = icons[c.id];
                    return (
                      <button
                        key={c.id}
                        className={
                          category === c.id
                            ? "filter-category checked"
                            : "filter-category"
                        }
                        onClick={() => {
                          setCategory(c.id);
                          setBrand("");
                          setPage(1);
                        }}
                      >
                        <span>
                          <Icon size={16} />
                          {c.name}
                        </span>
                        <small>{c.count}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="filter-group">
                  <label htmlFor="brand-filter">Thương hiệu</label>
                  <select
                    id="brand-filter"
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Tất cả thương hiệu</option>
                    {summary.brands.map((b: string) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="year-filter">Năm theo nguồn</label>
                  <select
                    id="year-filter"
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Tất cả các năm</option>
                    {summary.years.map((y: number) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="budget-filter">Giá tham khảo tối đa</label>
                  <select
                    id="budget-filter"
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Không giới hạn</option>
                    <option value="5000000">5 triệu đồng</option>
                    <option value="10000000">10 triệu đồng</option>
                    <option value="20000000">20 triệu đồng</option>
                    <option value="40000000">40 triệu đồng</option>
                  </select>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={priced}
                      onChange={(e) => {
                        setPriced(e.target.checked);
                        setPage(1);
                      }}
                    />{" "}
                    Chỉ hiện thiết bị có giá
                  </label>
                </div>
                <div className="filter-note">
                  <ShieldCheck size={22} />
                  <p>
                    Thông tin có nguồn.
                    <br />
                    Giá có ngày thu thập.
                  </p>
                </div>
              </aside>
              <div className="catalog-content">
                <div className="catalog-toolbar">
                  <div className="search-field">
                    <Search size={18} />
                    <input
                      aria-label="Tìm thiết bị"
                      placeholder="Tìm tên thiết bị, model…"
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setPage(1);
                      }}
                    />
                    {q && (
                      <button
                        onClick={() => setQ("")}
                        aria-label="Xóa tìm kiếm"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    className="icon-button filter-toggle"
                    onClick={() => setFilters(!filters)}
                    aria-label="Bật bộ lọc"
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                  <select
                    aria-label="Sắp xếp"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="featured">Đề xuất khám phá</option>
                    <option value="year">Năm mới nhất</option>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                    <option value="name">Tên A — Z</option>
                  </select>
                </div>
                <div className="results-count">
                  <span>
                    <strong>{catalog.total}</strong> thiết bị{" "}
                    {category && " / " + categoryNames[category as Category]}
                  </span>
                  {loading && <Loader2 size={15} className="spin" />}
                </div>
                {catalog.items.length ? (
                  <div className="product-grid catalog-grid">
                    {catalog.items.map((d: Item) => (
                      <Card key={d.id} d={d} />
                    ))}
                  </div>
                ) : loading ? (
                  <Loading />
                ) : (
                  <Empty
                    title="Chưa tìm thấy thiết bị"
                    text="Thử một tên model ngắn hơn hoặc thay đổi bộ lọc."
                    action={
                      <button
                        className="button button-dark"
                        onClick={() => {
                          setQ("");
                          setCategory("");
                          setBrand("");
                          setYear("");
                          setBudget("");
                          setPriced(false);
                        }}
                      >
                        Xóa bộ lọc
                      </button>
                    }
                  />
                )}
                <div className="pagination">
                  <button
                    disabled={page <= 1 || loading}
                    onClick={() => {
                      setPage(page - 1);
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>
                    Trang {page} / {Math.max(1, catalog.pages)}
                  </span>
                  <button
                    disabled={page >= catalog.pages || loading}
                    onClick={() => {
                      setPage(page + 1);
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {view === "valuation" && (
          <div className="wrap value-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">RE / VALUE</span>
                <h1>
                  Hiểu giá trị thiết bị<span className="heading-dot">.</span>
                </h1>
                <p>Một khoảng giá tham khảo. Đầy đủ căn cứ để bạn đối chiếu.</p>
              </div>
              <button
                className="button button-outline"
                onClick={() => setChat(true)}
              >
                <CircleHelp size={18} /> Hỏi trợ lý
              </button>
            </div>
            <div className="value-layout">
              <form className="form-panel" onSubmit={valuation}>
                <div className="form-step">
                  <span>01</span>
                  <div>
                    <h3>Chọn thiết bị</h3>
                    <p>Tìm model trong danh mục đã kiểm tra nguồn.</p>
                  </div>
                </div>
                <ModelPicker
                  selected={valDevice}
                  onSelect={(d) => {
                    setValDevice(d);
                    setResult(null);
                  }}
                />
                <div className="form-step">
                  <span>02</span>
                  <div>
                    <h3>Tình trạng hiện tại</h3>
                    <p>Thông tin chính xác giúp kết quả phù hợp hơn.</p>
                  </div>
                </div>
                <label>
                  Tình trạng thiết bị
                  <select
                    name="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    {Object.entries(conditions).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-columns">
                  <label>
                    Cấu hình tại nguồn
                    <select
                      defaultValue={
                        [
                          ...new Set<string>(
                            valDevice?.quotes
                              ?.map((r: Item) => r.storage_text)
                              .filter(Boolean) || [],
                          ),
                        ].length === 1
                          ? valDevice?.quotes?.find((r: Item) => r.storage_text)
                              ?.storage_text
                          : ""
                      }
                      name="storage"
                      required={
                        new Set(
                          valDevice?.quotes
                            ?.map((r: Item) => r.storage_text)
                            .filter(Boolean),
                        ).size > 1
                      }
                      key={valDevice?.id}
                    >
                      <option value="">Chọn cấu hình nếu có</option>
                      {[
                        ...new Set<string>(
                          valDevice?.quotes
                            ?.map((r: Item) => r.storage_text)
                            .filter(Boolean) || [],
                        ),
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tình trạng pin (%)
                    <input
                      name="battery"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Không rõ: để trống"
                    />
                  </label>
                </div>
                <label>
                  Chi phí sửa chữa đã xác nhận (đ)
                  <input
                    name="repairCost"
                    type="number"
                    min="0"
                    max="1000000000"
                    step="10000"
                    defaultValue="0"
                  />
                </label>
                <p className="field-help">
                  Pin là thông tin khai báo. Hệ thống không suy đoán lỗi hay chi
                  phí thay linh kiện từ ảnh.
                </p>
                <button
                  className="button button-dark button-full"
                  disabled={valBusy || !valDevice}
                >
                  {valBusy ? (
                    <Loader2 className="spin" size={17} />
                  ) : (
                    <Scale size={18} />
                  )}{" "}
                  Xem kết quả định giá <ArrowUpRight size={17} />
                </button>
              </form>
              <div className="value-result">
                {valBusy ? (
                  <Loading />
                ) : result ? (
                  <>
                    <span className="eyebrow">KẾT QUẢ ĐỐI CHIẾU</span>
                    <h2>{result.device}</h2>
                    {result.status === "estimated" ? (
                      <>
                        <span className="result-label">
                          Khoảng giá tham khảo
                        </span>
                        <div className="price-range">
                          {money(result.low)}
                          <span>—</span>
                          {money(result.high)}
                        </div>
                        <div className="result-suggested">
                          <span>Giá gợi ý theo phương pháp</span>
                          <strong>{money(result.suggested)}</strong>
                        </div>
                        <div className="result-tags">
                          <span>{result.sample_count} quan sát giá</span>
                          <span>{result.data_adequacy}</span>
                          <span>Giá niêm yết</span>
                        </div>
                        <p className="method-note">{result.assumptions}</p>
                        <details>
                          <summary>
                            Phương pháp tính <ChevronDown size={16} />
                          </summary>
                          <p>
                            {result.adjusted_condition
                              ? "Giá từng quan sát × hệ số tình trạng yêu cầu ÷ hệ số tình trạng tại nguồn; sau đó lấy trung vị."
                              : "Lấy trung vị các quan sát cùng tình trạng."}{" "}
                            Trừ chi phí sửa chữa đã khai báo. Biên dưới và trên
                            thêm 5% theo quy tắc thử nghiệm. Hệ số yêu cầu:{" "}
                            {result.condition_factor}.
                          </p>
                        </details>
                        <h3 className="references-title">Nguồn đối chiếu</h3>
                        <div className="quote-list">
                          {result.references.map((r: Item) => (
                            <a
                              href={r.source_url}
                              target="_blank"
                              rel="noreferrer"
                              key={r.id}
                            >
                              <div>
                                <strong>{r.device_name}</strong>
                                <span>
                                  {r.source_name} · {when(r.observed_at)} ·{" "}
                                  {conditions[r.condition]}
                                </span>
                              </div>
                              <span>
                                {money(r.price)} <ExternalLink size={13} />
                              </span>
                            </a>
                          ))}
                        </div>
                        <button
                          className="button button-outline"
                          onClick={() => sellDevice(valDevice)}
                        >
                          Đăng bán thiết bị này <ArrowUpRight size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="insufficient">
                        <Database size={32} />
                        <h3>Chưa đủ dữ liệu để đưa ra giá</h3>
                        <p>{result.message}</p>
                        <button
                          className="text-button"
                          onClick={() => openDevice(valDevice.id)}
                        >
                          Xem hồ sơ và nguồn thiết bị <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                    <details className="trace">
                      <summary>
                        Các bước xử lý <ChevronDown size={15} />
                      </summary>
                      {result.trace.map((t: Item, i: number) => (
                        <div key={i}>
                          <Check size={15} />
                          <span>
                            <code>{t.tool}</code>
                            <small>{t.detail}</small>
                          </span>
                        </div>
                      ))}
                    </details>
                  </>
                ) : (
                  <div className="result-intro">
                    <div className="value-art">
                      <Scale size={78} strokeWidth={1} />
                      <span>VALUE IS IN THE DETAILS.</span>
                    </div>
                    <h2>
                      Có dữ liệu.
                      <br />
                      Có lý do.
                    </h2>
                    <p>
                      Kết quả hiển thị nguồn giá, thời điểm thu thập và phương
                      pháp. Nếu chưa đủ dữ liệu phù hợp, hệ thống sẽ thông báo
                      rõ.
                    </p>
                    <div className="value-points">
                      <span>
                        <Check size={16} /> Tra đúng model
                      </span>
                      <span>
                        <Check size={16} /> Đối chiếu tình trạng
                      </span>
                      <span>
                        <Check size={16} /> Giải thích kết quả
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {view === "market" && (
          <div className="wrap section">
            <div className="page-heading">
              <div>
                <span className="eyebrow">CỘNG ĐỒNG RE / TECH</span>
                <h1>
                  Chợ thiết bị<span className="heading-dot">.</span>
                </h1>
                <p>Tin do người dùng đăng và được quản trị viên duyệt.</p>
              </div>
              <button className="button button-dark" onClick={() => go("sell")}>
                <Plus size={17} /> Đăng bán thiết bị
              </button>
            </div>
            {listings.length ? (
              <div className="product-grid">
                {listings.map((l) => (
                  <article className="product-card" key={l.id}>
                    <div
                      className={"product-visual visual-" + l.device?.category}
                    >
                      {l.image_key ? (
                        <img
                          className="device-image"
                          src={"/api/images/" + l.image_key}
                          alt={l.title}
                        />
                      ) : (
                        <DeviceImage item={l.device} />
                      )}
                      <span className="year-chip">
                        {conditions[l.condition]}
                      </span>
                    </div>
                    <div className="product-body">
                      <span className="product-brand">
                        Người bán · {l.seller_name}
                      </span>
                      <h3>{l.title}</h3>
                      <p className="listing-description">{l.description}</p>
                      <strong className="listing-price">
                        {money(l.price)}
                      </strong>
                      <div className="market-actions">
                        <button
                          className="button button-dark"
                          onClick={() => buy(l)}
                        >
                          Gửi yêu cầu mua <ArrowUpRight size={16} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => openDevice(l.device_id)}
                          aria-label="Hồ sơ thiết bị"
                        >
                          <FileText size={20} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Chờ thiết bị đầu tiên của cộng đồng"
                text="Bạn có một thiết bị còn tốt? Tạo tin đăng với tình trạng và mức giá rõ ràng để bắt đầu kết nối."
                action={
                  <button
                    className="button button-dark"
                    onClick={() => go("sell")}
                  >
                    Đăng tin đầu tiên <ArrowUpRight size={17} />
                  </button>
                }
              />
            )}
            <p className="catalog-footnote">
              <CircleHelp size={15} /> Yêu cầu mua giúp hai bên giữ chỗ và xác
              nhận. Việc kiểm tra, thanh toán và giao nhận do hai bên thỏa thuận
              trực tiếp.
            </p>
          </div>
        )}
        {view === "sell" && (
          <div className="wrap sell-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">TRAO THIẾT BỊ MỘT VÒNG ĐỜI MỚI</span>
                <h1>
                  Đăng bán thiết bị<span className="heading-dot">.</span>
                </h1>
                <p>Một tin đăng rõ ràng là khởi đầu của một giao dịch tốt.</p>
              </div>
            </div>
            <div className="sell-layout">
              <form className="form-panel" onSubmit={createListing}>
                <ModelPicker selected={valDevice} onSelect={setValDevice} />
                <label>
                  Tiêu đề tin đăng
                  <input
                    name="title"
                    minLength={8}
                    maxLength={160}
                    required
                    placeholder="Tên máy, cấu hình và điểm nổi bật"
                    key={valDevice?.id}
                    defaultValue={
                      valDevice ? valDevice.name + " — máy cá nhân" : ""
                    }
                  />
                </label>
                <div className="form-columns">
                  <label>
                    Giá muốn bán (đ)
                    <input
                      name="price"
                      type="number"
                      min="10000"
                      max="1000000000"
                      step="10000"
                      required
                      placeholder="VD: 12500000"
                    />
                  </label>
                  <label>
                    Tình trạng
                    <select name="condition">
                      {Object.entries(conditions).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Mô tả chi tiết
                  <textarea
                    name="description"
                    minLength={30}
                    maxLength={5000}
                    rows={6}
                    required
                    placeholder="Tình trạng ngoại hình, chức năng, pin, lịch sử sửa chữa, phụ kiện và cách kiểm tra máy…"
                  />
                </label>
                <label className="upload-field">
                  <Upload size={22} />
                  <span>
                    Thêm ảnh thiết bị thực tế
                    <small>JPG, PNG hoặc WebP · tối đa 5 MB</small>
                  </span>
                  <input
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" required /> Tôi xác nhận thông tin và
                  ảnh thuộc quyền sử dụng của mình.
                </label>
                <button
                  className="button button-dark button-full"
                  disabled={loading || !valDevice}
                >
                  {loading ? (
                    <Loader2 className="spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}{" "}
                  {user ? "Gửi tin để duyệt" : "Đăng nhập để gửi tin"}
                </button>
              </form>
              <aside className="sell-guide">
                <span className="eyebrow">MỘT TIN ĐĂNG TỐT</span>
                <h2>
                  Rõ từng
                  <br />
                  chi tiết nhỏ.
                </h2>
                {[
                  [
                    "01",
                    "Chọn đúng model",
                    "Đối chiếu mã máy trong cài đặt hoặc nhãn sản phẩm.",
                  ],
                  [
                    "02",
                    "Nói rõ tình trạng",
                    "Ghi nhận cả lỗi đang có và những linh kiện đã thay.",
                  ],
                  [
                    "03",
                    "Đặt giá có căn cứ",
                    "Dùng bộ định giá để xem nguồn trước khi chọn mức bán.",
                  ],
                ].map(([n, t, d]) => (
                  <div key={n}>
                    <span>{n}</span>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                ))}
                <button className="text-button" onClick={() => go("valuation")}>
                  Định giá trước khi đăng <ArrowRight size={17} />
                </button>
              </aside>
            </div>
          </div>
        )}
        {view === "favorites" && (
          <div className="wrap section">
            <div className="page-heading">
              <div>
                <span className="eyebrow">BỘ SƯU TẬP CỦA BẠN</span>
                <h1>
                  Thiết bị đã lưu<span className="heading-dot">.</span>
                </h1>
                <p>
                  {user
                    ? "Được lưu trong tài khoản của bạn."
                    : "Đang lưu trên trình duyệt này. Đăng nhập để lưu vào tài khoản."}
                </p>
              </div>
            </div>
            {favoriteItems.length ? (
              <div className="product-grid">
                {favoriteItems.map((d) => (
                  <Card key={d.id} d={d} />
                ))}
              </div>
            ) : (
              <Empty
                title="Dành chỗ cho lựa chọn của bạn"
                text="Bấm biểu tượng trái tim trên thiết bị bạn quan tâm để xem lại tại đây."
                action={
                  <button
                    className="button button-dark"
                    onClick={() => go("catalog")}
                  >
                    Khám phá thiết bị <ArrowUpRight size={17} />
                  </button>
                }
              />
            )}
          </div>
        )}
        {view === "compare" && (
          <div className="wrap section">
            <div className="page-heading">
              <div>
                <span className="eyebrow">CÙNG NHÌN KỸ HƠN</span>
                <h1>
                  So sánh thiết bị<span className="heading-dot">.</span>
                </h1>
                <p>Chọn tối đa 3 thiết bị trong danh mục.</p>
              </div>
            </div>
            {compare.length ? (
              <div className="compare-table">
                <table>
                  <thead>
                    <tr>
                      <th>Thông tin</th>
                      {compare.map((d) => (
                        <th key={d.id}>
                          <DeviceImage item={d} />
                          <strong>{d.name}</strong>
                          <button
                            className="text-button"
                            onClick={() => toggleCompare(d)}
                          >
                            Bỏ chọn <X size={13} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Thương hiệu", (d: Item) => d.brand],
                      [
                        "Danh mục",
                        (d: Item) => categoryNames[d.category as Category],
                      ],
                      ["Năm theo nguồn", (d: Item) => d.release_year],
                      [
                        "Giá niêm yết tham khảo",
                        (d: Item) =>
                          d.reference_price
                            ? money(d.reference_price)
                            : "Chưa có dữ liệu giá",
                      ],
                      ["Model", (d: Item) => d.model],
                      [
                        "Thông số từ nguồn",
                        (d: Item) =>
                          Object.entries(d.specs || {})
                            .slice(0, 8)
                            .map(([k, v]) => (
                              <p key={k}>
                                <b>{k}:</b>{" "}
                                {typeof v === "object"
                                  ? JSON.stringify(v)
                                  : String(v)}
                              </p>
                            )),
                      ],
                      [
                        "Nguồn",
                        (d: Item) => (
                          <a
                            href={d.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {d.source_name} <ExternalLink size={13} />
                          </a>
                        ),
                      ],
                    ].map(([name, fn]) => (
                      <tr key={name as string}>
                        <td>{name as string}</td>
                        {compare.map((d) => (
                          <td key={d.id}>{(fn as any)(d)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Chọn thiết bị để so sánh"
                text="Dùng nút So sánh trên các thẻ thiết bị trong danh mục."
                action={
                  <button
                    className="button button-dark"
                    onClick={() => go("catalog")}
                  >
                    Mở danh mục
                  </button>
                }
              />
            )}
          </div>
        )}
        {view === "account" && (
          <div className="wrap section">
            {user ? (
              <>
                <div className="page-heading">
                  <div>
                    <span className="eyebrow">KHÔNG GIAN CÁ NHÂN</span>
                    <h1>
                      Chào, {user.name.split(" ").at(-1)}
                      <span className="heading-dot">.</span>
                    </h1>
                    <p>{user.email}</p>
                  </div>
                  <div className="inline-actions">
                    {user.role === "admin" && (
                      <button
                        className="button button-outline"
                        onClick={() => go("admin")}
                      >
                        Quản trị
                      </button>
                    )}
                    <button
                      className="text-button"
                      onClick={async () => {
                        try {
                          await post("auth/logout", {});
                          setUser(null);
                          go("home");
                          toast("Đã đăng xuất");
                        } catch (e) {
                          toast((e as Error).message);
                        }
                      }}
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </div>
                <div className="account-stats">
                  <div>
                    <small>Tin đăng của bạn</small>
                    <strong>{mine.length}</strong>
                  </div>
                  <div>
                    <small>Yêu cầu mua và bán</small>
                    <strong>{orders.length}</strong>
                  </div>
                  <div>
                    <small>Lịch sử định giá</small>
                    <strong>{history.length}</strong>
                  </div>
                </div>
                <div className="section-heading">
                  <h2>Tin đăng của bạn</h2>
                  <button className="text-button" onClick={() => go("sell")}>
                    Thêm tin mới <Plus size={16} />
                  </button>
                </div>
                {mine.length ? (
                  <div className="record-list">
                    {mine.map((l) => (
                      <div key={l.id}>
                        <div>
                          <strong>{l.title}</strong>
                          <span>
                            {money(l.price)} · {when(l.created_at)}
                          </span>
                        </div>
                        <span className={"status-badge status-" + l.status}>
                          {statuses[l.status]}
                        </span>
                        {["active", "reserved"].includes(l.status) && (
                          <button
                            className="button button-small button-outline"
                            onClick={() =>
                              update("listings/" + l.id, { status: "sold" })
                            }
                          >
                            Đánh dấu đã bán
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted empty-line">Bạn chưa có tin đăng.</p>
                )}
                <h2 className="account-title">Yêu cầu mua và bán</h2>
                {orders.length ? (
                  <div className="record-list">
                    {orders.map((o) => (
                      <div key={o.id}>
                        <div>
                          <strong>{o.title}</strong>
                          <span>
                            {o.buyer_id === user.id
                              ? "Bạn gửi yêu cầu mua"
                              : "Người mua: " + o.buyer_name}{" "}
                            · {money(o.price)}
                          </span>
                          <p>{o.message}</p>
                        </div>
                        <span className="status-badge">
                          {statuses[o.status]}
                        </span>
                        {o.status === "pending" && (
                          <div className="inline-actions">
                            {o.seller_id === user.id && (
                              <button
                                className="button button-small button-dark"
                                onClick={() =>
                                  update("orders/" + o.id, {
                                    status: "accepted",
                                  })
                                }
                              >
                                Xác nhận
                              </button>
                            )}
                            <button
                              className="button button-small button-outline"
                              onClick={() =>
                                update("orders/" + o.id, {
                                  status: "cancelled",
                                })
                              }
                            >
                              Hủy yêu cầu
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted empty-line">Chưa có yêu cầu giao dịch.</p>
                )}
                <h2 className="account-title">Lịch sử định giá</h2>
                {history.length ? (
                  <div className="record-list">
                    {history.map((h) => (
                      <div key={h.id}>
                        <div>
                          <strong>{h.result.device}</strong>
                          <span>
                            {when(h.created_at)} ·{" "}
                            {h.result.status === "estimated"
                              ? money(h.result.suggested)
                              : "Chưa đủ dữ liệu"}
                          </span>
                        </div>
                        <button
                          className="text-button"
                          onClick={async () => {
                            setValDevice(await api("devices/" + h.device_id));
                            setResult(h.result);
                            go("valuation");
                          }}
                        >
                          Xem lại <ArrowUpRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted empty-line">
                    Kết quả định giá sẽ được lưu khi bạn đăng nhập.
                  </p>
                )}
                {user.role !== "admin" && (
                  <button
                    className="text-button admin-entry"
                    onClick={() => go("admin")}
                  >
                    Thiết lập quản trị <ArrowUpRight size={14} />
                  </button>
                )}
              </>
            ) : (
              <Empty
                title="Chào mừng đến ReTech"
                text="Đăng nhập để đăng bán, quản lý yêu cầu mua và xem lại kết quả định giá của bạn."
                action={
                  <button
                    className="button button-dark"
                    onClick={() => setAuth(true)}
                  >
                    Đăng nhập / Tạo tài khoản
                  </button>
                }
              />
            )}
          </div>
        )}
        {view === "admin" && (
          <div className="wrap section">
            <div className="page-heading">
              <div>
                <span className="eyebrow">RETECH / QUẢN TRỊ</span>
                <h1>
                  Quản lý hệ thống<span className="heading-dot">.</span>
                </h1>
              </div>
            </div>
            {!user ? (
              <Empty
                title="Cần đăng nhập"
                text="Chức năng này dành cho tài khoản quản trị."
                action={
                  <button
                    className="button button-dark"
                    onClick={() => setAuth(true)}
                  >
                    Đăng nhập
                  </button>
                }
              />
            ) : user.role !== "admin" ? (
              <form
                className="form-panel setup-panel"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  try {
                    await post("admin/bootstrap", { token: f.get("token") });
                    await loadMe();
                    toast("Đã cấp quyền quản trị");
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                <h3>Khởi tạo quản trị viên</h3>
                <p>
                  Mã khởi tạo do người triển khai cấu hình trên máy chủ. Xem
                  hướng dẫn cài đặt đi kèm mã nguồn.
                </p>
                <label>
                  Mã khởi tạo
                  <input
                    name="token"
                    type="password"
                    required
                    autoComplete="off"
                  />
                </label>
                <button className="button button-dark">Xác nhận</button>
              </form>
            ) : admin ? (
              <>
                <div className="account-stats">
                  {Object.entries(admin.stats).map(([k, v]) => (
                    <div key={k}>
                      <small>
                        {{
                          users: "Tài khoản",
                          listings: "Tin đăng",
                          orders: "Yêu cầu mua",
                          valuations: "Lượt định giá đã lưu",
                        }[k] || k}
                      </small>
                      <strong>{String(v)}</strong>
                    </div>
                  ))}
                </div>
                <h2 className="account-title">Kiểm duyệt tin đăng</h2>
                <div className="record-list">
                  {admin.listings.length ? (
                    admin.listings.map((l: Item) => (
                      <div key={l.id}>
                        <div>
                          <strong>{l.title}</strong>
                          <span>
                            {l.seller_name} · {money(l.price)}
                          </span>
                          <p>{l.description}</p>
                        </div>
                        <span className="status-badge">
                          {statuses[l.status]}
                        </span>
                        {l.status === "pending" && (
                          <div className="inline-actions">
                            <button
                              className="button button-small button-dark"
                              onClick={() =>
                                update("listings/" + l.id, { status: "active" })
                              }
                            >
                              Duyệt tin
                            </button>
                            <button
                              className="button button-small button-outline"
                              onClick={() =>
                                update("listings/" + l.id, {
                                  status: "rejected",
                                })
                              }
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="empty-line muted">Chưa có tin cần quản lý.</p>
                  )}
                </div>
                <h2 className="account-title">Nhật ký thao tác</h2>
                <div className="record-list audit-list">
                  {admin.logs.map((l: Item) => (
                    <div key={l.id}>
                      <code>{l.action}</code>
                      <span>{when(l.created_at)}</span>
                      <small>{l.entity_id}</small>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Loading />
            )}
          </div>
        )}
        {view === "sources" && (
          <div className="wrap sources-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  NGUỒN RÕ RÀNG / QUYẾT ĐỊNH CÓ CĂN CỨ
                </span>
                <h1>
                  Phía sau mỗi hồ sơ<span className="heading-dot">.</span>
                </h1>
                <p>Dữ liệu có thể kiểm tra, phương pháp có thể giải thích.</p>
              </div>
            </div>
            <div className="data-overview">
              <div>
                <strong>{summary.total.toLocaleString("vi-VN")}</strong>
                <span>Hồ sơ thiết bị thực</span>
              </div>
              <div>
                <strong>2015—2026</strong>
                <span>Năm được ghi nhận tại nguồn</span>
              </div>
              <div>
                <strong>{summary.quotes}</strong>
                <span>Quan sát giá niêm yết có nguồn</span>
              </div>
            </div>
            <div className="sources-layout">
              <div>
                <h2>Danh mục thiết bị</h2>
                <p>
                  Các hồ sơ được tổng hợp từ nguồn hãng, chương trình ENERGY
                  STAR và bộ dữ liệu kỹ thuật có ghi nguồn. Mỗi thiết bị giữ
                  đường dẫn và cách xác định năm. Năm có thể là năm ra mắt, công
                  bố hoặc xuất hiện trên thị trường theo trường dữ liệu gốc.
                </p>
                <p>
                  Danh mục bao gồm cả thiết bị cũ và model mới. Việc có trong
                  danh mục không đồng nghĩa thiết bị đang còn bán mới hoặc có
                  hàng tại ReTech.
                </p>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Danh mục</th>
                        <th>Số hồ sơ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.categories.map((c: Item) => (
                        <tr key={c.id}>
                          <td>{c.name}</td>
                          <td>{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h2>Giá và phương pháp định giá</h2>
                <p>
                  Giá tham khảo là giá niêm yết tại nhà bán lẻ vào ngày thu
                  thập, giữ nguyên tình trạng và cấu hình của quan sát. Hệ thống
                  không xem giá rao là giá giao dịch đã hoàn tất.
                </p>
                <p>
                  Bộ định giá ưu tiên cùng model, dung lượng và tình trạng, sử
                  dụng quan sát trong 90 ngày. Khi cần quy đổi tình trạng, hệ số
                  được công khai là quy tắc thử nghiệm chưa hiệu chỉnh. Biên 5%
                  phục vụ tham khảo, không phải khoảng tin cậy thống kê.
                </p>
                <h2>ChatGPT và AI Agent</h2>
                <p>
                  ChatGPT cùng các Agent hỗ trợ phân tích, thiết kế, lập trình,
                  thu thập dữ liệu và kiểm thử trong quá trình xây dựng đồ án.
                  Trong sản phẩm, bộ định giá theo dữ liệu hoạt động độc lập;
                  hội thoại AI gọi công cụ được bật khi người triển khai cấu
                  hình dịch vụ.
                </p>
              </div>
              <aside className="source-sidebar">
                <Database size={31} strokeWidth={1.3} />
                <h3>Mở dữ liệu để đối chiếu</h3>
                <p>
                  Bản chụp dữ liệu được thu thập ngày {summary.updated}. Giá có
                  thể thay đổi sau thời điểm này.
                </p>
                <a className="download-row" href="/data/devices.csv" download>
                  <span>Danh mục thiết bị</span>
                  <span>
                    CSV <ArrowUpRight size={15} />
                  </span>
                </a>
                <a className="download-row" href="/data/devices.json" download>
                  <span>Dữ liệu và nguồn</span>
                  <span>
                    JSON <ArrowUpRight size={15} />
                  </span>
                </a>
                <a className="download-row" href="/data/prices.csv" download>
                  <span>Quan sát giá</span>
                  <span>
                    CSV <ArrowUpRight size={15} />
                  </span>
                </a>
                <p className="field-help">
                  Ảnh sản phẩm và dữ liệu nguồn thuộc các chủ thể tương ứng. Xem
                  tệp DATA_SOURCES đi kèm bộ mã nguồn để biết phạm vi sử dụng.
                </p>
              </aside>
            </div>
          </div>
        )}
      </main>
      <footer className="footer">
        <div className="wrap footer-main">
          <div>
            <a
              className="logo"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                go("home");
              }}
            >
              <span className="logo-symbol">
                <ArrowUpRight size={22} />
              </span>
              retech<span className="logo-dot">.</span>
            </a>
            <p>
              Thiết bị tốt.
              <br />
              Giá trị xứng đáng.
            </p>
          </div>
          <div>
            <h4>Khám phá</h4>
            <button onClick={() => go("catalog")}>Danh mục thiết bị</button>
            <button onClick={() => go("valuation")}>Định giá thiết bị</button>
            <button onClick={() => go("market")}>Chợ thiết bị</button>
          </div>
          <div>
            <h4>Cùng ReTech</h4>
            <button onClick={() => go("sell")}>Đăng bán thiết bị</button>
            <button onClick={() => go("favorites")}>Thiết bị đã lưu</button>
            <button onClick={() => (user ? go("account") : setAuth(true))}>
              Tài khoản của bạn
            </button>
          </div>
          <div className="footer-project">
            <span className="eyebrow">ĐỒ ÁN NHÓM 03 / UTH</span>
            <p>
              Sử dụng ChatGPT hỗ trợ xây dựng website mua bán và định giá thiết
              bị điện tử.
            </p>
            <button className="text-button" onClick={() => go("sources")}>
              Tìm hiểu về dữ liệu <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© 2026 ReTech · Sản phẩm học tập Nhóm 03.</span>
          <span>THÔNG TIN RÕ RÀNG. GIÁ TRỊ BỀN LÂU.</span>
        </div>
      </footer>
      <button
        className="chat-launch"
        onClick={() => setChat(true)}
        aria-label="Mở trợ lý tra cứu"
      >
        <span className="agent-symbol">r.</span>
        <span>Hỏi ReTech</span>
        <ArrowUpRight size={16} />
      </button>
      {compare.length > 0 && view !== "compare" && (
        <div className="compare-bar">
          <span>
            <Scale size={18} /> {compare.length}/3 thiết bị
          </span>
          <button onClick={() => go("compare")}>
            So sánh ngay <ArrowRight size={16} />
          </button>
          <button
            aria-label="Xóa danh sách so sánh"
            onClick={() => setCompare([])}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Đóng thông báo">
            <X size={15} />
          </button>
        </div>
      )}
      {selected && (
        <div className="modal-overlay" onClick={closeDevice}>
          <section
            className="device-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="device-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closeDevice}
              aria-label="Đóng chi tiết"
            >
              <X size={22} />
            </button>
            <div className={"detail-visual visual-" + selected.category}>
              <DeviceImage item={selected} hero />
              <div className="detail-visual-label">
                {categoryNames[selected.category as Category]} /{" "}
                {selected.release_year}
              </div>
            </div>
            <div className="detail-content">
              <span className="eyebrow">{selected.brand} / HỒ SƠ THIẾT BỊ</span>
              <h2 id="device-title">{selected.name}</h2>
              <p className="model-number">Model: {selected.model}</p>
              <div className="detail-price">
                <small>
                  {selected.reference_price
                    ? "Giá niêm yết tham khảo"
                    : "Giá tham khảo"}
                </small>
                <strong>
                  {selected.reference_price
                    ? money(selected.reference_price)
                    : "Chưa có quan sát giá"}
                </strong>
                <span>
                  {selected.reference_price
                    ? conditions[selected.reference_condition] +
                      " · Giá tại nguồn, chưa phải giá bán của ReTech"
                    : "Bạn có thể xem nguồn và đăng bán theo tình trạng thực tế."}
                </span>
              </div>
              <div className="detail-actions">
                <button
                  className="button button-dark"
                  onClick={() => valueDevice(selected)}
                >
                  Định giá thiết bị <ArrowUpRight size={17} />
                </button>
                <button
                  className="button button-outline"
                  onClick={() => sellDevice(selected)}
                >
                  Đăng bán <Plus size={16} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => save(selected)}
                  aria-label="Lưu thiết bị"
                >
                  <Heart
                    size={20}
                    fill={saved.includes(selected.id) ? "currentColor" : "none"}
                  />
                </button>
              </div>
              <h3>Thông tin từ nguồn</h3>
              <dl className="spec-list">
                <div>
                  <dt>Năm theo nguồn</dt>
                  <dd>{selected.release_year}</dd>
                </div>
                <div>
                  <dt>Căn cứ thời gian</dt>
                  <dd>
                    {yearLabels[selected.year_basis] || "Theo dữ liệu nguồn"}
                  </dd>
                </div>
                {Object.entries(selected.specs || {})
                  .filter(([, v]) => v !== null && v !== undefined && v !== "")
                  .slice(0, 16)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt>{specLabels[k] || k.replace(/_/g, " ")}</dt>
                      <dd>
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </dd>
                    </div>
                  ))}
              </dl>
              <a
                className="source-link"
                href={selected.source_url}
                target="_blank"
                rel="noreferrer"
              >
                <ShieldCheck size={17} />
                <span>
                  {selected.source_name}
                  <small>
                    Thu thập {selected.retrieved_at?.slice(0, 10)} · Mở nguồn
                    gốc
                  </small>
                </span>
                <ExternalLink size={16} />
              </a>
              {selected.quotes?.length > 0 && (
                <>
                  <h3>Quan sát giá có nguồn</h3>
                  <div className="quote-list">
                    {selected.quotes.map((r: Item) => (
                      <a
                        key={r.id}
                        href={r.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div>
                          <strong>{r.device_name}</strong>
                          <span>
                            {conditions[r.condition]} · {when(r.observed_at)}
                          </span>
                        </div>
                        <span>
                          {money(r.price)} <ExternalLink size={13} />
                        </span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
      {auth && (
        <div className="modal-overlay" onClick={() => setAuth(false)}>
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setAuth(false)}
              aria-label="Đóng đăng nhập"
            >
              <X size={21} />
            </button>
            <span className="eyebrow">RETECH / TÀI KHOẢN</span>
            <h2 id="auth-title">
              {register ? "Bắt đầu cùng ReTech." : "Chào mừng trở lại."}
            </h2>
            <p>
              {register
                ? "Lưu lựa chọn. Kết nối mua bán."
                : "Tiếp tục hành trình của thiết bị."}
            </p>
            <form onSubmit={authenticate}>
              {register && (
                <label>
                  Họ và tên
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Nhập họ và tên"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  placeholder="ban@example.com"
                />
              </label>
              <label>
                Mật khẩu
                <input
                  name="password"
                  type="password"
                  required
                  minLength={register ? 10 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={register ? "Ít nhất 10 ký tự" : "Nhập mật khẩu"}
                />
              </label>
              <button
                className="button button-dark button-full"
                disabled={authBusy}
              >
                {authBusy ? (
                  <Loader2 size={18} className="spin" />
                ) : register ? (
                  "Tạo tài khoản"
                ) : (
                  "Đăng nhập"
                )}
                <ArrowRight size={17} />
              </button>
            </form>
            <button
              className="auth-switch"
              onClick={() => setRegister(!register)}
            >
              {register
                ? "Đã có tài khoản? Đăng nhập"
                : "Chưa có tài khoản? Tạo tài khoản"}
            </button>
          </section>
        </div>
      )}
      {chat && (
        <aside
          className="chat-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Trợ lý ReTech"
        >
          <div className="chat-header">
            <span className="agent-symbol">r.</span>
            <div>
              <strong>Trợ lý ReTech</strong>
              <span>
                <i />
                {aiMode === "openai"
                  ? "Hội thoại AI có công cụ"
                  : "Tra cứu theo dữ liệu"}
              </span>
            </div>
            <button
              className="icon-button"
              onClick={() => setChat(false)}
              aria-label="Đóng trợ lý"
            >
              <X size={20} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div className={"message message-" + m.role} key={i}>
                <p>{m.content}</p>
                {m.devices?.map((d: Item) => (
                  <button
                    key={d.id}
                    className="chat-device"
                    onClick={() => {
                      setChat(false);
                      openDevice(d.id);
                    }}
                  >
                    {d.name}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            ))}
            {chatBusy && (
              <div className="message message-assistant">
                <Loader2 size={17} className="spin" /> Đang tra cứu…
              </div>
            )}
            {trace.length > 0 && (
              <details className="trace">
                <summary>Các công cụ đã dùng</summary>
                {trace.map((t, i) => (
                  <div key={i}>
                    <Check size={13} />
                    <code>{t.tool}</code>
                  </div>
                ))}
              </details>
            )}
          </div>
          <form className="chat-compose" onSubmit={sendChat}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={2000}
              placeholder="Nhập tên model hoặc nhu cầu…"
              aria-label="Nội dung gửi trợ lý"
            />
            <button
              disabled={chatBusy || !chatInput.trim()}
              aria-label="Gửi tin nhắn"
            >
              <Send size={19} />
            </button>
          </form>
          <small className="chat-footnote">
            Đối chiếu nguồn trước khi quyết định mua bán.
          </small>
        </aside>
      )}
    </div>
  );
}

function ModelPicker({
  selected,
  onSelect,
}: {
  selected: Item | null;
  onSelect: (d: Item) => void;
}) {
  const [query, setQuery] = useState(""),
    [items, setItems] = useState<Item[]>([]),
    [open, setOpen] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(
      () =>
        api("catalog?limit=7&q=" + encodeURIComponent(query), {
          signal: abort.signal,
        })
          .then((r) => setItems(r.items))
          .catch(() => {}),
      180,
    );
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query]);
  return (
    <div className="model-picker">
      <label htmlFor="device-search">Tên hoặc mã model</label>
      <div className="search-field">
        <Search size={18} />
        <input
          id="device-search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="VD: iPhone, MacBook, Archer…"
          autoComplete="off"
        />
        <button
          type="button"
          aria-label="Đóng danh sách"
          onClick={() => setOpen(!open)}
        >
          <ChevronDown size={17} />
        </button>
      </div>
      {open && (
        <div className="model-results">
          {items.length ? (
            items.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => {
                  api("devices/" + d.id)
                    .then(onSelect)
                    .catch(() => onSelect(d));
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span>
                  {d.name}
                  <small>
                    {d.brand} · {d.release_year}
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))
          ) : (
            <p>Chưa tìm thấy model phù hợp.</p>
          )}
        </div>
      )}
      {selected && (
        <div className="selected-model">
          <div className="selected-model-image">
            <DeviceImage item={selected} />
          </div>
          <div>
            <strong>{selected.name}</strong>
            <small>
              {selected.brand} · {selected.release_year}
            </small>
          </div>
          <Check size={18} />
        </div>
      )}
    </div>
  );
}
