import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  DEMO_TRADES, Trade, getMonths, getAssets,
  filterTrades, calcStats, monthLabel,
} from "@/data/journal";

const SIDE_COLOR: Record<string, string> = {
  Long: "#00f5ff",
  Short: "#ff2d9b",
};
const STATUS_COLOR: Record<string, string> = {
  Win:  "#00e676",
  Loss: "#ff4060",
  BE:   "#ffd600",
};
const STATUS_BG: Record<string, string> = {
  Win:  "rgba(0,230,118,0.1)",
  Loss: "rgba(255,64,96,0.1)",
  BE:   "rgba(255,214,0,0.1)",
};

function pnlColor(v: number) {
  if (v > 0) return "#00e676";
  if (v < 0) return "#ff4060";
  return "#888";
}
function fmt(n: number, sign = true) {
  const s = Math.abs(n).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
  if (!sign) return s;
  return (n >= 0 ? "+" : "−") + s;
}

// Mini bar chart for monthly pnl
function MonthlyChart({ trades }: { trades: Trade[] }) {
  const months = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      const m = t.date.slice(0, 7);
      map[m] = (map[m] ?? 0) + t.pnl;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [trades]);

  if (months.length === 0) return null;
  const max = Math.max(...months.map(([, v]) => Math.abs(v)));

  return (
    <div className="flex items-end gap-1.5 h-14">
      {months.map(([m, pnl]) => {
        const pct = max > 0 ? (Math.abs(pnl) / max) * 100 : 0;
        return (
          <div key={m} className="flex flex-col items-center gap-1 flex-1" title={`${monthLabel(m)}: ${fmt(pnl)} $`}>
            <div className="relative w-full flex justify-center" style={{ height: 44 }}>
              <div
                className="absolute bottom-0 w-full rounded-sm"
                style={{
                  height: `${Math.max(4, pct)}%`,
                  background: pnl >= 0 ? "rgba(0,230,118,0.55)" : "rgba(255,64,96,0.55)",
                  border: `1px solid ${pnl >= 0 ? "rgba(0,230,118,0.4)" : "rgba(255,64,96,0.4)"}`,
                  maxWidth: 32,
                }}
              />
            </div>
            <span className="text-center" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
              {monthLabel(m).slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Equity curve
function EquityCurve({ trades }: { trades: Trade[] }) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const points: number[] = [0];
  sorted.forEach((t) => points.push(points[points.length - 1] + t.pnl));

  const W = 100, H = 50;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pts = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");

  const fill = points[points.length - 1] >= 0 ? "#00e676" : "#ff4060";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 48, display: "block" }}>
      <defs>
        <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.25" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={fill} strokeWidth="1.5" />
      <polygon
        points={`0,${H} ${pts} ${W},${H}`}
        fill="url(#eq-grad)"
      />
    </svg>
  );
}

// Add / Edit modal
function TradeModal({
  trade,
  onSave,
  onClose,
}: {
  trade: Partial<Trade> | null;
  onSave: (t: Trade) => void;
  onClose: () => void;
}) {
  const blank: Partial<Trade> = {
    date: new Date().toISOString().slice(0, 10),
    asset: "BTC/USDT", side: "Long", entry: 0, exit: 0,
    size: 500, pnl: 0, pnlPct: 0, rr: 1, status: "Win",
    strategy: "", notes: "",
  };
  const init = trade ?? blank;
  const [form, setForm] = useState<Partial<Trade>>(init);

  const set = (k: keyof Trade, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.asset || !form.date) return;
    const pnl = (form.pnl ?? 0);
    const pnlPct = form.size ? (pnl / form.size) * 100 : 0;
    const status: Trade["status"] = pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "BE";
    onSave({ ...blank, ...form, pnl, pnlPct, status, id: form.id ?? Date.now().toString() } as Trade);
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </label>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "white",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "#0d1525", border: "1px solid rgba(0,245,255,0.15)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-xl font-bold"
            style={{ fontFamily: "'Oswald', sans-serif", color: "white", letterSpacing: "0.05em" }}
          >
            {form.id ? "РЕДАКТИРОВАТЬ" : "НОВАЯ СДЕЛКА"}
          </h3>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}>
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <F label="Дата">
            <input type="date" style={inputStyle} value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} />
          </F>
          <F label="Актив">
            <select style={selectStyle} value={form.asset ?? ""} onChange={(e) => set("asset", e.target.value)}>
              {["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","LINK/USDT"].map((a) => (
                <option key={a} value={a} style={{ background: "#0d1525" }}>{a}</option>
              ))}
            </select>
          </F>
          <F label="Направление">
            <select style={selectStyle} value={form.side ?? "Long"} onChange={(e) => set("side", e.target.value as Trade["side"])}>
              <option value="Long" style={{ background: "#0d1525" }}>Long</option>
              <option value="Short" style={{ background: "#0d1525" }}>Short</option>
            </select>
          </F>
          <F label="Стратегия">
            <input style={inputStyle} value={form.strategy ?? ""} placeholder="FVG, OB, Sweep..." onChange={(e) => set("strategy", e.target.value)} />
          </F>
          <F label="Цена входа">
            <input type="number" style={inputStyle} value={form.entry ?? 0} onChange={(e) => set("entry", +e.target.value)} />
          </F>
          <F label="Цена выхода">
            <input type="number" style={inputStyle} value={form.exit ?? 0} onChange={(e) => set("exit", +e.target.value)} />
          </F>
          <F label="Объём (USDT)">
            <input type="number" style={inputStyle} value={form.size ?? 0} onChange={(e) => set("size", +e.target.value)} />
          </F>
          <F label="PnL (USDT)">
            <input type="number" style={inputStyle} value={form.pnl ?? 0} onChange={(e) => set("pnl", +e.target.value)} />
          </F>
          <F label="R:R">
            <input type="number" step="0.1" style={inputStyle} value={form.rr ?? 0} onChange={(e) => set("rr", +e.target.value)} />
          </F>
        </div>

        <F label="Заметки">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
            value={form.notes ?? ""}
            placeholder="Что заметил, что сделал хорошо / плохо..."
            onChange={(e) => set("notes", e.target.value)}
          />
        </F>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, #00f5ff, #0088aa)",
              color: "#000",
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: "0.06em",
            }}
          >
            СОХРАНИТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Journal() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>(DEMO_TRADES);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState("Все");
  const [tab, setTab] = useState<"trades" | "stats" | "assets">("stats");
  const [modalTrade, setModalTrade] = useState<Partial<Trade> | null | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"date" | "pnl" | "rr">("date");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [search, setSearch] = useState("");

  const months = useMemo(() => getMonths(trades), [trades]);
  const assets = useMemo(() => getAssets(trades), [trades]);

  const filtered = useMemo(() => {
    let list = filterTrades(trades, selectedMonth, selectedAsset);
    if (search) list = list.filter((t) =>
      t.asset.toLowerCase().includes(search.toLowerCase()) ||
      t.strategy.toLowerCase().includes(search.toLowerCase()) ||
      t.notes.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      if (sortBy === "date") return a.date.localeCompare(b.date) * sortDir;
      if (sortBy === "pnl")  return (a.pnl - b.pnl) * sortDir;
      return (a.rr - b.rr) * sortDir;
    });
    return list;
  }, [trades, selectedMonth, selectedAsset, search, sortBy, sortDir]);

  const stats = useMemo(() => calcStats(filtered), [filtered]);

  const allStats = useMemo(() => calcStats(trades), [trades]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    return months.map((m) => {
      const mt = trades.filter((t) => t.date.startsWith(m));
      const s = calcStats(mt);
      return { month: m, ...s };
    });
  }, [trades, months]);

  // Per-asset breakdown
  const assetBreakdown = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach((t) => { (map[t.asset] ??= []).push(t); });
    return Object.entries(map).map(([asset, ts]) => ({ asset, ...calcStats(ts) }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [trades]);

  const handleSave = (t: Trade) => {
    setTrades((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) { const a = [...prev]; a[idx] = t; return a; }
      return [t, ...prev];
    });
    setModalTrade(undefined);
  };

  const handleDelete = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleSort = (key: "date" | "pnl" | "rr") => {
    if (sortBy === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortBy(key); setSortDir(-1); }
  };

  const SortBtn = ({ k, label }: { k: "date" | "pnl" | "rr"; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-xs transition-colors"
      style={{ color: sortBy === k ? "var(--neon-cyan)" : "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {label}
      <Icon name={sortBy === k ? (sortDir === -1 ? "ChevronDown" : "ChevronUp") : "ChevronsUpDown"} size={12} />
    </button>
  );

  const StatCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </div>
      <div className="text-xl font-bold" style={{ fontFamily: "'Oswald', sans-serif", color: color ?? "white", letterSpacing: "0.03em" }}>
        {value}
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050b14", fontFamily: "'Rubik', sans-serif", color: "white" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 gap-4"
        style={{ background: "rgba(5,11,20,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,245,255,0.12)", border: "1px solid rgba(0,245,255,0.25)" }}
            >
              <Icon name="BookOpen" size={14} style={{ color: "var(--neon-cyan)" }} />
            </div>
            <span
              className="font-bold text-base"
              style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.06em", color: "white" }}
            >
              ТОРГОВЫЙ ЖУРНАЛ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Equity mini */}
          <div className="hidden sm:block w-28" style={{ opacity: 0.7 }}>
            <EquityCurve trades={trades} />
          </div>
          <div
            className="text-sm font-bold px-3 py-1 rounded-lg"
            style={{
              background: allStats.totalPnl >= 0 ? "rgba(0,230,118,0.1)" : "rgba(255,64,96,0.1)",
              color: allStats.totalPnl >= 0 ? "#00e676" : "#ff4060",
              border: `1px solid ${allStats.totalPnl >= 0 ? "rgba(0,230,118,0.2)" : "rgba(255,64,96,0.2)"}`,
              fontFamily: "'Oswald', sans-serif",
            }}
          >
            {fmt(allStats.totalPnl)} $
          </div>
          <button
            onClick={() => setModalTrade({})}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00f5ff, #0088aa)",
              color: "#000",
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: "0.06em",
            }}
          >
            <Icon name="Plus" size={15} />
            <span className="hidden sm:inline">СДЕЛКА</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-56 flex-shrink-0 overflow-y-auto"
          style={{ background: "rgba(255,255,255,0.015)", borderRight: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Icon name="Search" size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "7px 10px 7px 30px",
                  color: "white",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Assets */}
          <div className="px-4 mb-4">
            <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'IBM Plex Mono', monospace" }}>
              Активы
            </div>
            {assets.map((a) => (
              <button
                key={a}
                onClick={() => setSelectedAsset(a)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all"
                style={{
                  background: selectedAsset === a ? "rgba(0,245,255,0.08)" : "transparent",
                  color: selectedAsset === a ? "var(--neon-cyan)" : "rgba(255,255,255,0.45)",
                  border: selectedAsset === a ? "1px solid rgba(0,245,255,0.18)" : "1px solid transparent",
                }}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Months */}
          <div className="px-4">
            <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'IBM Plex Mono', monospace" }}>
              Месяцы
            </div>
            <button
              onClick={() => setSelectedMonth(null)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all"
              style={{
                background: selectedMonth === null ? "rgba(0,245,255,0.08)" : "transparent",
                color: selectedMonth === null ? "var(--neon-cyan)" : "rgba(255,255,255,0.45)",
                border: selectedMonth === null ? "1px solid rgba(0,245,255,0.18)" : "1px solid transparent",
              }}
            >
              Все месяцы
            </button>
            {months.map((m) => {
              const ms = calcStats(trades.filter((t) => t.date.startsWith(m)));
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all"
                  style={{
                    background: selectedMonth === m ? "rgba(0,245,255,0.08)" : "transparent",
                    color: selectedMonth === m ? "var(--neon-cyan)" : "rgba(255,255,255,0.45)",
                    border: selectedMonth === m ? "1px solid rgba(0,245,255,0.18)" : "1px solid transparent",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{monthLabel(m)}</span>
                    <span style={{ fontSize: 11, color: pnlColor(ms.totalPnl), fontFamily: "'IBM Plex Mono', monospace" }}>
                      {fmt(ms.totalPnl)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-5">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)" }}>
            {(["stats", "trades", "assets"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t ? "rgba(0,245,255,0.1)" : "transparent",
                  color: tab === t ? "var(--neon-cyan)" : "rgba(255,255,255,0.4)",
                  border: tab === t ? "1px solid rgba(0,245,255,0.2)" : "1px solid transparent",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                {t === "stats" ? "СТАТИСТИКА" : t === "trades" ? "СДЕЛКИ" : "ПО АКТИВАМ"}
              </button>
            ))}
          </div>

          {/* === STATS === */}
          {tab === "stats" && (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Итоговый PnL" value={`${fmt(stats.totalPnl)} $`} sub={`${stats.total} сделок`} color={pnlColor(stats.totalPnl)} />
                <StatCard label="Винрейт" value={`${stats.winRate.toFixed(1)}%`} sub={`${stats.wins}W · ${stats.losses}L · ${stats.be}BE`} color={stats.winRate >= 50 ? "#00e676" : "#ff4060"} />
                <StatCard label="Ср. R:R" value={stats.avgRR.toFixed(2)} sub="фактический" color="var(--neon-cyan)" />
                <StatCard label="Ср. прибыль" value={`${fmt(stats.avgWin)} $`} sub={`Ср. убыток: ${fmt(stats.avgLoss)} $`} color="#00e676" />
              </div>

              {/* Equity + monthly bars */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-5"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}>
                    // кривая капитала
                  </div>
                  <EquityCurve trades={filtered} />
                </div>
                <div
                  className="rounded-xl p-5"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}>
                    // pnl по месяцам
                  </div>
                  <MonthlyChart trades={trades} />
                </div>
              </div>

              {/* Best / worst */}
              {stats.bestTrade && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[{ label: "Лучшая сделка", t: stats.bestTrade, c: "#00e676" }, { label: "Худшая сделка", t: stats.worstTrade!, c: "#ff4060" }].map(({ label, t, c }) => (
                    <div
                      key={label}
                      className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-sm" style={{ color: "white" }}>{t.asset}</span>
                          <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>{t.date}</span>
                        </div>
                        <span className="font-bold text-lg" style={{ fontFamily: "'Oswald', sans-serif", color: c }}>
                          {fmt(t.pnl)} $
                        </span>
                      </div>
                      {t.notes && <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>{t.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Monthly table */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="px-5 py-3" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}>
                    // статистика по месяцам
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {["Месяц","Сделок","W / L / BE","Винрейт","PnL"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyBreakdown.map((r) => (
                        <tr
                          key={r.month}
                          className="cursor-pointer transition-colors"
                          onClick={() => { setSelectedMonth(r.month); setTab("trades"); }}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="px-5 py-3 font-medium" style={{ color: "white" }}>{monthLabel(r.month)}</td>
                          <td className="px-5 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>{r.total}</td>
                          <td className="px-5 py-3">
                            <span style={{ color: "#00e676" }}>{r.wins}</span>
                            <span style={{ color: "rgba(255,255,255,0.25)" }}> / </span>
                            <span style={{ color: "#ff4060" }}>{r.losses}</span>
                            <span style={{ color: "rgba(255,255,255,0.25)" }}> / </span>
                            <span style={{ color: "#ffd600" }}>{r.be}</span>
                          </td>
                          <td className="px-5 py-3" style={{ color: r.winRate >= 50 ? "#00e676" : "#ff4060" }}>
                            {r.winRate.toFixed(0)}%
                          </td>
                          <td className="px-5 py-3 font-bold" style={{ fontFamily: "'Oswald', sans-serif", color: pnlColor(r.totalPnl) }}>
                            {fmt(r.totalPnl)} $
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === TRADES === */}
          {tab === "trades" && (
            <div>
              {/* Mobile filters */}
              <div className="flex gap-2 mb-4 lg:hidden overflow-x-auto pb-1">
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  style={{ background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "white", fontSize: 13 }}
                >
                  {assets.map((a) => <option key={a}>{a}</option>)}
                </select>
                <select
                  value={selectedMonth ?? ""}
                  onChange={(e) => setSelectedMonth(e.target.value || null)}
                  style={{ background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "white", fontSize: 13 }}
                >
                  <option value="">Все месяцы</option>
                  {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {filtered.length} сделок · {fmt(stats.totalPnl)} $ суммарно
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Сортировка:</span>
                  <SortBtn k="date" label="Дата" />
                  <SortBtn k="pnl" label="PnL" />
                  <SortBtn k="rr" label="R:R" />
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {["Дата","Актив","Направление","Стратегия","Вход","Выход","PnL","R:R","Статус",""].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'IBM Plex Mono', monospace" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => (
                        <tr
                          key={t.id}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                            {t.date.slice(5)}
                          </td>
                          <td className="px-4 py-3 font-semibold" style={{ color: "white" }}>{t.asset}</td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                background: t.side === "Long" ? "rgba(0,245,255,0.1)" : "rgba(255,45,155,0.1)",
                                color: SIDE_COLOR[t.side],
                                border: `1px solid ${t.side === "Long" ? "rgba(0,245,255,0.2)" : "rgba(255,45,155,0.2)"}`,
                                fontFamily: "'Oswald', sans-serif",
                              }}
                            >
                              {t.side}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.strategy || "—"}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'IBM Plex Mono', monospace" }}>
                            {t.entry.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'IBM Plex Mono', monospace" }}>
                            {t.exit.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-bold" style={{ color: pnlColor(t.pnl), fontFamily: "'Oswald', sans-serif" }}>
                            {fmt(t.pnl)} $
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Mono', monospace" }}>
                            {t.rr.toFixed(1)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                background: STATUS_BG[t.status],
                                color: STATUS_COLOR[t.status],
                                fontFamily: "'Oswald', sans-serif",
                              }}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setModalTrade(t)}
                                style={{ color: "rgba(255,255,255,0.2)" }}
                                className="hover:text-white transition-colors"
                              >
                                <Icon name="Pencil" size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                style={{ color: "rgba(255,255,255,0.2)" }}
                                className="hover:text-red-400 transition-colors"
                              >
                                <Icon name="Trash2" size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && (
                  <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.2)" }}>
                    <Icon name="Search" size={32} style={{ margin: "0 auto 12px" }} />
                    <div>Сделки не найдены</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === ASSETS === */}
          {tab === "assets" && (
            <div className="space-y-4">
              {assetBreakdown.map((a) => {
                const winPct = a.total > 0 ? (a.wins / a.total) * 100 : 0;
                return (
                  <div
                    key={a.asset}
                    className="rounded-xl p-5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            background: a.totalPnl >= 0 ? "rgba(0,230,118,0.1)" : "rgba(255,64,96,0.1)",
                            border: `1px solid ${a.totalPnl >= 0 ? "rgba(0,230,118,0.2)" : "rgba(255,64,96,0.2)"}`,
                          }}
                        >
                          <Icon name="BarChart2" size={18} style={{ color: a.totalPnl >= 0 ? "#00e676" : "#ff4060" }} />
                        </div>
                        <div>
                          <div className="font-bold text-base" style={{ color: "white" }}>{a.asset}</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{a.total} сделок</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold" style={{ fontFamily: "'Oswald', sans-serif", color: pnlColor(a.totalPnl) }}>
                        {fmt(a.totalPnl)} $
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                      {[
                        { l: "Винрейт", v: `${winPct.toFixed(0)}%`, c: winPct >= 50 ? "#00e676" : "#ff4060" },
                        { l: "W / L / BE", v: `${a.wins} / ${a.losses} / ${a.be}` },
                        { l: "Ср. R:R", v: a.avgRR.toFixed(2), c: "var(--neon-cyan)" },
                        { l: "Ср. прибыль", v: `${fmt(a.avgWin)} $`, c: "#00e676" },
                        { l: "Ср. убыток", v: `${fmt(a.avgLoss)} $`, c: "#ff4060" },
                      ].map(({ l, v, c }) => (
                        <div key={l}>
                          <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'IBM Plex Mono', monospace" }}>{l}</div>
                          <div className="text-sm font-bold" style={{ color: c ?? "rgba(255,255,255,0.7)" }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Win bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${winPct}%`,
                          background: "linear-gradient(90deg, #00e676, #00b050)",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalTrade !== undefined && (
        <TradeModal
          trade={modalTrade}
          onSave={handleSave}
          onClose={() => setModalTrade(undefined)}
        />
      )}
    </div>
  );
}
