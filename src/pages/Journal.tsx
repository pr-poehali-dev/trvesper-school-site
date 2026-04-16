import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  DEMO_TRADES, DEFAULT_ACCOUNTS,
  Trade, PropAccount, Session, Timeframe, EntryModel,
  PROP_COMPANIES,
  getMonths, getAssets, filterTrades, calcStats, monthLabel,
  calcEquity, calcDrawdown,
} from "@/data/journal";

// ─── constants ───────────────────────────────────────────────────
const SESSIONS: Session[]    = ["Азия","Лондон","Нью-Йорк","Перекрытие","Другое"];
const TIMEFRAMES: Timeframe[] = ["M1","M5","M15","M30","H1","H4","D1","W1"];
const MODELS: EntryModel[]   = ["FVG","Order Block","Sweep + BOS","Sweep + FVG","BOS + OB","Liquidity Grab","CHOCH","Inversion FVG","Rejection Block","Другое"];
const EMOTIONS = ["calm","fomo","revenge","confident","hesitant"] as const;
const EMOTION_LABEL: Record<string, string> = { calm:"Спокойный", fomo:"FOMO", revenge:"Месть", confident:"Уверенный", hesitant:"Сомневался" };
const EMOTION_COLOR: Record<string, string> = { calm:"#00e676", fomo:"#ff4060", revenge:"#ff2d9b", confident:"#00b5ff", hesitant:"#ffd600" };
const STATUS_C: Record<string, string> = { Win:"#00e676", Loss:"#ff4060", BE:"#ffd600" };
const STATUS_BG: Record<string, string> = { Win:"rgba(0,230,118,.1)", Loss:"rgba(255,64,96,.1)", BE:"rgba(255,214,0,.1)" };
const SIDE_C: Record<string, string>   = { Long:"#00b5ff", Short:"#ff4060" };
const ASSETS_PRESETS = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","LINK/USDT","DOGE/USDT","AVAX/USDT","EUR/USD","GBP/USD","GBP/JPY","XAUUSD","US30","NAS100"];

const G = { bg:"#0a0a0f", card:"#111118", border:"rgba(255,255,255,.07)", text:"#e8e8f0", muted:"rgba(255,255,255,.35)", dim:"rgba(255,255,255,.12)" };

// ─── helpers ─────────────────────────────────────────────────────
const pC = (v: number) => v > 0 ? "#00e676" : v < 0 ? "#ff4060" : G.muted;
const fmtN = (n: number, d = 0) => Math.abs(n).toLocaleString("ru-RU", { maximumFractionDigits: d });
const fmt$ = (n: number) => (n >= 0 ? "+" : "−") + fmtN(n) + " $";
const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

// ─── small UI pieces ─────────────────────────────────────────────
const Pill = ({ c, bg, border, children }: { c: string; bg: string; border: string; children: React.ReactNode }) => (
  <span style={{ color: c, background: bg, border: `1px solid ${border}`, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600, letterSpacing: ".03em", whiteSpace: "nowrap" }}>
    {children}
  </span>
);

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "rgba(255,255,255,.04)", border: `1px solid ${G.border}`, borderRadius: 8,
  padding: "9px 12px", color: G.text, fontSize: 13, outline: "none", width: "100%", ...extra,
});

// ─── Pie chart ───────────────────────────────────────────────────
interface PieSlice { label: string; value: number; color: string }
function PieChart({ slices, size = 140 }: { slices: PieSlice[]; size?: number }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total === 0) return <div style={{ color: G.muted, fontSize: 13, textAlign: "center" }}>Нет данных</div>;
  let angle = -Math.PI / 2;
  const r = size / 2 - 4;
  const cx = size / 2, cy = size / 2;
  const paths = slices.map((s) => {
    const a = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    angle += a;
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    const large = a > Math.PI ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} Z`, color: s.color, label: s.label, value: s.value };
  });
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r + 2} fill="rgba(255,255,255,.03)" />
        {paths.map((p, i) => <path key={i} d={p.path} fill={p.color} opacity={.85} />)}
        <circle cx={cx} cy={cy} r={r * .52} fill={G.card} />
      </svg>
      <div className="flex flex-col gap-2">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: G.muted }}>{p.label}</span>
            <span style={{ fontSize: 12, color: G.text, marginLeft: "auto", paddingLeft: 12 }}>{((p.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Equity curve ────────────────────────────────────────────────
function EquityCurve({ trades, startBalance, height = 80 }: { trades: Trade[]; startBalance: number; height?: number }) {
  const pts = calcEquity(trades, startBalance);
  if (pts.length < 2) return null;
  const W = 400, H = height;
  const vals = pts.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const toY = (v: number) => H - 4 - ((v - min) / range) * (H - 8);
  const toX = (i: number) => (i / (pts.length - 1)) * W;
  const polyline = pts.map((p, i) => `${toX(i)},${toY(p.value)}`).join(" ");
  const isUp = pts[pts.length - 1].value >= pts[0].value;
  const col = isUp ? "#00e676" : "#ff4060";
  const fillPoly = `0,${H} ${polyline} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity=".2" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoly} fill="url(#eq)" />
      <polyline points={polyline} fill="none" stroke={col} strokeWidth="1.5" />
    </svg>
  );
}

// ─── Mini bar chart ──────────────────────────────────────────────
function BarChart({ trades }: { trades: Trade[] }) {
  const months = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => { const m = t.date.slice(0, 7); map[m] = (map[m] ?? 0) + t.pnl; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [trades]);
  if (!months.length) return null;
  const max = Math.max(...months.map(([, v]) => Math.abs(v)));
  return (
    <div className="flex items-end gap-1.5" style={{ height: 64 }}>
      {months.map(([m, pnl]) => {
        const h = Math.max(3, (Math.abs(pnl) / max) * 52);
        return (
          <div key={m} className="flex flex-col items-center gap-1 flex-1" title={`${monthLabel(m)}: ${fmt$(pnl)}`}>
            <div style={{ height: 52, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div style={{ width: "100%", height: h, borderRadius: "3px 3px 0 0", background: pnl >= 0 ? "rgba(0,230,118,.5)" : "rgba(255,64,96,.5)", border: `1px solid ${pnl >= 0 ? "rgba(0,230,118,.4)" : "rgba(255,64,96,.4)"}` }} />
            </div>
            <span style={{ fontSize: 9, color: G.dim, whiteSpace: "nowrap" }}>{monthLabel(m).slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Trade detail drawer ─────────────────────────────────────────
function TradeDrawer({ trade, onClose, onEdit }: { trade: Trade; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="h-full overflow-y-auto flex flex-col" style={{ width: "min(480px, 100vw)", background: G.card, borderLeft: `1px solid ${G.border}` }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${G.border}` }}>
          <div className="flex items-center gap-3">
            <Pill c={SIDE_C[trade.side]} bg={`${SIDE_C[trade.side]}14`} border={`${SIDE_C[trade.side]}30`}>{trade.side}</Pill>
            <span style={{ color: G.text, fontWeight: 600, fontSize: 16 }}>{trade.asset}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} style={{ color: G.muted, padding: 6 }}><Icon name="Pencil" size={16} /></button>
            <button onClick={onClose} style={{ color: G.muted, padding: 6 }}><Icon name="X" size={16} /></button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* PnL hero */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: pC(trade.pnl), fontVariantNumeric: "tabular-nums" }}>{fmt$(trade.pnl)}</div>
            <div style={{ fontSize: 13, color: G.muted }}>{fmtPct(trade.pnlPct)} · R:R {trade.rr.toFixed(1)}</div>
          </div>
          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Дата", `${trade.date} ${trade.time ?? ""}`],
              ["Актив", trade.asset],
              ["Модель", trade.model],
              ["Таймфрейм", trade.timeframe],
              ["Сессия", trade.session],
              ["Объём", `${fmtN(trade.size)} $`],
              ["Вход", trade.entry.toLocaleString()],
              ["Выход", trade.exit.toLocaleString()],
              ["SL", trade.sl ? trade.sl.toLocaleString() : "—"],
              ["TP", trade.tp ? trade.tp.toLocaleString() : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "rgba(255,255,255,.03)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: G.dim, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{k}</div>
                <div style={{ fontSize: 13, color: G.text }}>{v}</div>
              </div>
            ))}
          </div>
          {/* Status / emotion / rating */}
          <div className="flex gap-2 flex-wrap">
            <Pill c={STATUS_C[trade.status]} bg={STATUS_BG[trade.status]} border={`${STATUS_C[trade.status]}30`}>{trade.status}</Pill>
            <Pill c={EMOTION_COLOR[trade.emotion]} bg={`${EMOTION_COLOR[trade.emotion]}12`} border={`${EMOTION_COLOR[trade.emotion]}30`}>{EMOTION_LABEL[trade.emotion]}</Pill>
            <Pill c="#ffd600" bg="rgba(255,214,0,.1)" border="rgba(255,214,0,.3)">{"★".repeat(trade.rating)}</Pill>
          </div>
          {/* Tags */}
          {trade.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {trade.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 11, color: G.muted, background: G.border, borderRadius: 4, padding: "2px 8px" }}>{tag}</span>
              ))}
            </div>
          )}
          {/* Notes */}
          {trade.notes && (
            <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid rgba(255,255,255,.15)` }}>
              <div style={{ fontSize: 10, color: G.dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Заметки</div>
              <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.6 }}>{trade.notes}</p>
            </div>
          )}
          {/* Screenshots */}
          {trade.screenshots.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: G.dim, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Скриншоты</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                {trade.screenshots.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ borderRadius: 8, width: "100%", objectFit: "cover", aspectRatio: "16/9", cursor: "pointer" }} onClick={() => window.open(src, "_blank")} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trade modal (add/edit) ───────────────────────────────────────
function TradeModal({ trade, accounts, onSave, onClose }: { trade: Partial<Trade> | null; accounts: PropAccount[]; onSave: (t: Trade) => void; onClose: () => void }) {
  const blank: Partial<Trade> = {
    accountId: accounts[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10), time: "",
    asset: "BTC/USDT", side: "Long", entry: 0, exit: 0, sl: undefined, tp: undefined,
    size: 500, pnl: 0, pnlPct: 0, rr: 1, status: "Win",
    session: "Лондон", timeframe: "H1", model: "FVG",
    tags: [], notes: "", screenshots: [], rating: 3, emotion: "calm",
  };
  const [form, setForm] = useState<Partial<Trade>>(trade ?? blank);
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Trade, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const autoCalc = useCallback((f: Partial<Trade>) => {
    const { entry, exit, sl, size, side } = f;
    if (!entry || !exit || !size) return f;
    const delta = side === "Long" ? exit - entry : entry - exit;
    const pnl = (delta / entry) * size;
    const pnlPct = (delta / entry) * 100;
    let rr = f.rr ?? 1;
    if (sl && Math.abs(entry - sl) > 0) {
      const riskPts = Math.abs(entry - sl);
      const rewardPts = Math.abs(exit - entry);
      rr = rewardPts / riskPts;
    }
    const status: Trade["status"] = pnl > 0.5 ? "Win" : pnl < -0.5 ? "Loss" : "BE";
    return { ...f, pnl: parseFloat(pnl.toFixed(2)), pnlPct: parseFloat(pnlPct.toFixed(2)), rr: parseFloat(rr.toFixed(2)), status };
  }, []);

  const handleChange = (k: keyof Trade, v: unknown) => {
    setForm((p) => {
      const updated = { ...p, [k]: v };
      return autoCalc(updated);
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags?.includes(t)) set("tags", [...(form.tags ?? []), t]);
    setTagInput("");
  };

  const removeTag = (t: string) => set("tags", form.tags?.filter((x) => x !== t) ?? []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setForm((p) => ({ ...p, screenshots: [...(p.screenshots ?? []), src] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    const final = autoCalc(form);
    onSave({ ...blank, ...final, id: form.id ?? Date.now().toString() } as Trade);
  };

  const F = ({ label, half, children }: { label: string; half?: boolean; children: React.ReactNode }) => (
    <div className={half ? "" : ""} style={{ gridColumn: half ? "span 1" : "span 2" }}>
      <label style={{ display: "block", fontSize: 10, color: G.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</label>
      {children}
    </div>
  );

  const sel = (k: keyof Trade, opts: string[]) => (
    <select style={{ ...inp(), appearance: "none" }} value={(form[k] as string) ?? ""} onChange={(e) => handleChange(k, e.target.value)}>
      {opts.map((o) => <option key={o} value={o} style={{ background: G.card }}>{o}</option>)}
    </select>
  );

  const num = (k: keyof Trade, placeholder?: string) => (
    <input type="number" style={inp()} placeholder={placeholder} value={(form[k] as number) ?? ""} onChange={(e) => handleChange(k, parseFloat(e.target.value) || 0)} />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full overflow-y-auto" style={{ maxWidth: 580, maxHeight: "95vh", background: G.card, borderRadius: "16px 16px 0 0", border: `1px solid ${G.border}` }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-5" style={{ borderBottom: `1px solid ${G.border}` }}>
          <span style={{ color: G.text, fontWeight: 600, fontSize: 15 }}>{form.id ? "Редактировать сделку" : "Новая сделка"}</span>
          <button onClick={onClose} style={{ color: G.muted }}><Icon name="X" size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <F label="Счёт" half>
              <select style={{ ...inp(), appearance: "none" }} value={form.accountId ?? ""} onChange={(e) => set("accountId", e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={a.id} style={{ background: G.card }}>{a.name}</option>)}
              </select>
            </F>
            <F label="Актив" half>
              <select style={{ ...inp(), appearance: "none" }} value={form.asset ?? ""} onChange={(e) => handleChange("asset", e.target.value)}>
                {ASSETS_PRESETS.map((a) => <option key={a} value={a} style={{ background: G.card }}>{a}</option>)}
              </select>
            </F>
            <F label="Дата" half>
              <input type="date" style={inp()} value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} />
            </F>
            <F label="Время" half>
              <input type="time" style={inp()} value={form.time ?? ""} onChange={(e) => set("time", e.target.value)} />
            </F>
          </div>

          {/* Direction + session + tf + model */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <F label="Направление" half>{sel("side", ["Long","Short"])}</F>
            <F label="Сессия" half>{sel("session", SESSIONS)}</F>
            <F label="Таймфрейм" half>{sel("timeframe", TIMEFRAMES)}</F>
            <F label="Модель входа" half>{sel("model", MODELS)}</F>
          </div>

          {/* Prices */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            <F label="Вход" half>{num("entry")}</F>
            <F label="Выход" half>{num("exit")}</F>
            <F label="Стоп-лосс" half>{num("sl","необязательно")}</F>
            <F label="Тейк-профит" half>{num("tp","необязательно")}</F>
            <F label="Объём (USDT)" half>{num("size")}</F>
            <F label="PnL (USDT)" half>
              <input type="number" style={inp({ color: pC(form.pnl ?? 0) })} value={form.pnl ?? ""} onChange={(e) => handleChange("pnl", parseFloat(e.target.value) || 0)} />
            </F>
          </div>

          {/* Calculated */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, background: "rgba(255,255,255,.025)", borderRadius: 10, padding: "12px 14px" }}>
            {[
              ["R:R", (form.rr ?? 0).toFixed(2), G.text],
              ["PnL %", fmtPct(form.pnlPct ?? 0), pC(form.pnlPct ?? 0)],
              ["Статус", form.status ?? "—", STATUS_C[form.status ?? "BE"]],
            ].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: G.dim, marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: c as string }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Emotion + rating */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <F label="Психология" half>{sel("emotion", [...EMOTIONS])}</F>
            <F label="Оценка сделки" half>
              <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
                {[1,2,3,4,5].map((r) => (
                  <button key={r} onClick={() => set("rating", r as Trade["rating"])} style={{ fontSize: 18, color: r <= (form.rating ?? 0) ? "#ffd600" : G.dim, background: "none", border: "none", cursor: "pointer", padding: 2 }}>★</button>
                ))}
              </div>
            </F>
          </div>

          {/* Tags */}
          <F label="Теги">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {(form.tags ?? []).map((t) => (
                <span key={t} style={{ fontSize: 12, color: G.muted, background: G.border, borderRadius: 4, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  {t}
                  <button onClick={() => removeTag(t)} style={{ color: G.dim, background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={inp({ flex: 1 })} placeholder="Добавить тег..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} />
              <button onClick={addTag} style={{ ...inp({ width: "auto", padding: "9px 14px" }), cursor: "pointer" }}>+</button>
            </div>
          </F>

          {/* Notes */}
          <F label="Описание / Заметки">
            <textarea style={{ ...inp(), minHeight: 80, resize: "vertical" }} placeholder="Почему зашёл? Что увидел на графике? Что можно улучшить?" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </F>

          {/* Screenshots */}
          <F label="Скриншоты (TF, паттерн)">
            <div
              style={{ border: `1.5px dashed ${G.border}`, borderRadius: 10, padding: "18px", textAlign: "center", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              <Icon name="Upload" size={20} style={{ color: G.dim, margin: "0 auto 6px" }} />
              <div style={{ fontSize: 12, color: G.dim }}>Перетащите скриншоты или нажмите для выбора</div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
            </div>
            {(form.screenshots ?? []).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginTop: 10 }}>
                {(form.screenshots ?? []).map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={src} alt="" style={{ width: "100%", borderRadius: 6, objectFit: "cover", aspectRatio: "16/9" }} />
                    <button
                      onClick={() => set("screenshots", (form.screenshots ?? []).filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,.7)", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", padding: "2px 5px", fontSize: 11 }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </F>
        </div>

        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${G.border}`, background: "none", color: G.muted, cursor: "pointer", fontSize: 13 }}>Отмена</button>
          <button
            onClick={handleSave}
            style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.9)", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: ".04em" }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account modal ───────────────────────────────────────────────
function AccountModal({ account, onSave, onClose }: { account: Partial<PropAccount> | null; onSave: (a: PropAccount) => void; onClose: () => void }) {
  const blank: Partial<PropAccount> = { name: "", company: "FTMO", balance: 10000, maxDrawdown: 10, dailyDrawdown: 5, profitTarget: 10, phase: "Challenge", currency: "USD" };
  const [form, setForm] = useState<Partial<PropAccount>>(account ?? blank);
  const set = (k: keyof PropAccount, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ display: "block", fontSize: 10, color: G.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 440, background: G.card, borderRadius: 16, border: `1px solid ${G.border}`, overflow: "hidden" }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${G.border}` }}>
          <span style={{ color: G.text, fontWeight: 600 }}>{form.id ? "Редактировать счёт" : "Новый счёт"}</span>
          <button onClick={onClose} style={{ color: G.muted }}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-6" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "span 2" }}>
            <F label="Название счёта">
              <input style={inp()} value={form.name ?? ""} placeholder="FTMO $25k Phase 1" onChange={(e) => set("name", e.target.value)} />
            </F>
          </div>
          <F label="Проп компания">
            <select style={{ ...inp(), appearance: "none" }} value={form.company ?? ""} onChange={(e) => set("company", e.target.value)}>
              {[...PROP_COMPANIES, "Личный"].map((c) => <option key={c} value={c} style={{ background: G.card }}>{c}</option>)}
            </select>
          </F>
          <F label="Фаза">
            <select style={{ ...inp(), appearance: "none" }} value={form.phase ?? "Challenge"} onChange={(e) => set("phase", e.target.value)}>
              {["Challenge","Verification","Funded","Personal"].map((p) => <option key={p} value={p} style={{ background: G.card }}>{p}</option>)}
            </select>
          </F>
          <F label="Начальный баланс $">
            <input type="number" style={inp()} value={form.balance ?? ""} onChange={(e) => set("balance", +e.target.value)} />
          </F>
          <F label="Валюта">
            <select style={{ ...inp(), appearance: "none" }} value={form.currency ?? "USD"} onChange={(e) => set("currency", e.target.value)}>
              {["USD","EUR","GBP"].map((c) => <option key={c} value={c} style={{ background: G.card }}>{c}</option>)}
            </select>
          </F>
          <F label="Макс. просадка %">
            <input type="number" style={inp()} value={form.maxDrawdown ?? ""} onChange={(e) => set("maxDrawdown", +e.target.value)} />
          </F>
          <F label="Дневная просадка %">
            <input type="number" style={inp()} value={form.dailyDrawdown ?? ""} onChange={(e) => set("dailyDrawdown", +e.target.value)} />
          </F>
          <div style={{ gridColumn: "span 2" }}>
            <F label="Цель прибыли %">
              <input type="number" style={inp()} value={form.profitTarget ?? ""} onChange={(e) => set("profitTarget", +e.target.value)} />
            </F>
          </div>
        </div>
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${G.border}`, background: "none", color: G.muted, cursor: "pointer", fontSize: 13 }}>Отмена</button>
          <button onClick={() => onSave({ ...blank, ...form, id: form.id ?? Date.now().toString() } as PropAccount)}
            style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "rgba(255,255,255,.9)", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Journal ─────────────────────────────────────────────────
type Tab = "overview" | "trades" | "analytics" | "accounts";

export default function Journal() {
  const navigate = useNavigate();
  const [trades,   setTrades]   = useState<Trade[]>(DEMO_TRADES);
  const [accounts, setAccounts] = useState<PropAccount[]>(DEFAULT_ACCOUNTS);
  const [activeAccountId, setActiveAccountId] = useState<string>(DEFAULT_ACCOUNTS[0].id);
  const [tab,     setTab]       = useState<Tab>("overview");
  const [month,   setMonth]     = useState<string | null>(null);
  const [asset,   setAsset]     = useState("Все");
  const [search,  setSearch]    = useState("");
  const [sortBy,  setSortBy]    = useState<"date" | "pnl" | "rr">("date");
  const [sortDir, setSortDir]   = useState<1 | -1>(-1);
  const [tradeModal,   setTradeModal]   = useState<Partial<Trade> | null | undefined>(undefined);
  const [accountModal, setAccountModal] = useState<Partial<PropAccount> | null | undefined>(undefined);
  const [detailTrade,  setDetailTrade]  = useState<Trade | null>(null);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  const filtered = useMemo(() => {
    let list = filterTrades(trades, month, asset, activeAccountId);
    if (search) list = list.filter((t) =>
      [t.asset, t.model, t.session, t.notes, ...t.tags].some((f) => f.toLowerCase().includes(search.toLowerCase()))
    );
    return [...list].sort((a, b) => {
      if (sortBy === "date") return a.date.localeCompare(b.date) * sortDir;
      if (sortBy === "pnl")  return (a.pnl - b.pnl) * sortDir;
      return (a.rr - b.rr) * sortDir;
    });
  }, [trades, month, asset, activeAccountId, search, sortBy, sortDir]);

  const allAccTrades = useMemo(() => trades.filter((t) => t.accountId === activeAccountId), [trades, activeAccountId]);
  const stats = useMemo(() => calcStats(filtered), [filtered]);
  const allStats = useMemo(() => calcStats(allAccTrades), [allAccTrades]);
  const months   = useMemo(() => getMonths(allAccTrades), [allAccTrades]);
  const assets   = useMemo(() => getAssets(allAccTrades), [allAccTrades]);
  const drawdown = useMemo(() => calcDrawdown(allAccTrades, activeAccount?.balance ?? 0), [allAccTrades, activeAccount]);
  const currentBalance = useMemo(() => (activeAccount?.balance ?? 0) + allStats.totalPnl, [activeAccount, allStats]);

  const saveTrade = (t: Trade) => {
    setTrades((p) => { const i = p.findIndex((x) => x.id === t.id); if (i >= 0) { const a = [...p]; a[i] = t; return a; } return [t, ...p]; });
    setTradeModal(undefined);
  };
  const deleteTrade = (id: string) => setTrades((p) => p.filter((t) => t.id !== id));
  const saveAccount = (a: PropAccount) => {
    setAccounts((p) => { const i = p.findIndex((x) => x.id === a.id); if (i >= 0) { const arr = [...p]; arr[i] = a; return arr; } return [...p, a]; });
    setAccountModal(undefined);
  };

  const toggleSort = (k: "date" | "pnl" | "rr") => {
    if (sortBy === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortBy(k); setSortDir(-1); }
  };

  // ── Pie data ──
  const pieByAsset   = assets.filter((a) => a !== "Все").map((a, i) => ({ label: a, value: allAccTrades.filter((t) => t.asset === a).length, color: [`#00b5ff`,`#00e676`,`#ffd600`,`#ff4060`,`#c084fc`,`#fb923c`][i % 6] }));
  const pieBySession = SESSIONS.map((s, i) => ({ label: s, value: allAccTrades.filter((t) => t.session === s).length, color: [`#00b5ff`,`#00e676`,`#ffd600`,`#ff4060`,`#c084fc`][i % 5] }));
  const pieByModel   = MODELS.slice(0, 6).map((m, i) => ({ label: m, value: allAccTrades.filter((t) => t.model === m).length, color: [`#00b5ff`,`#00e676`,`#ffd600`,`#ff4060`,`#c084fc`,`#fb923c`][i % 6] })).filter((p) => p.value > 0);

  // ── Drawdown % usage ──
  const ddUsed = activeAccount ? (drawdown / activeAccount.maxDrawdown) * 100 : 0;
  const profitUsed = activeAccount?.profitTarget ? (allStats.totalPnl / (activeAccount.balance * activeAccount.profitTarget / 100)) * 100 : 0;

  const TAB_LABELS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview",  label: "Обзор",     icon: "LayoutDashboard" },
    { key: "trades",    label: "Сделки",    icon: "List" },
    { key: "analytics", label: "Аналитика", icon: "BarChart2" },
    { key: "accounts",  label: "Счета",     icon: "Wallet" },
  ];

  const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, overflow: "hidden" }}>
      {title && <div style={{ padding: "14px 20px", borderBottom: `1px solid ${G.border}`, fontSize: 12, color: G.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".07em" }}>{title}</div>}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );

  const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: G.dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? G.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: G.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text, fontFamily: "'Inter', 'Rubik', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: `${G.bg}f2`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${G.border}`, padding: "0 20px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/")} style={{ color: G.dim, background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
          <Icon name="ArrowLeft" size={17} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="BookOpen" size={16} style={{ color: G.muted }} />
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: ".03em" }}>Торговый журнал</span>
        </div>

        {/* Account picker */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={activeAccountId}
            onChange={(e) => { setActiveAccountId(e.target.value); setMonth(null); setAsset("Все"); }}
            style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${G.border}`, borderRadius: 8, padding: "5px 10px", color: G.text, fontSize: 12, cursor: "pointer", appearance: "none", outline: "none" }}
          >
            {accounts.map((a) => <option key={a.id} value={a.id} style={{ background: G.card }}>{a.name}</option>)}
          </select>
          <div style={{ fontSize: 13, fontWeight: 600, color: pC(allStats.totalPnl), fontVariantNumeric: "tabular-nums" }}>{fmt$(allStats.totalPnl)}</div>
          <button
            onClick={() => setTradeModal({})}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "rgba(255,255,255,.9)", color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
          >
            <Icon name="Plus" size={14} />
            <span className="hidden sm:inline">Сделка</span>
          </button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 2, padding: "10px 20px 0", borderBottom: `1px solid ${G.border}`, background: G.bg, position: "sticky", top: 56, zIndex: 20 }}>
        {TAB_LABELS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "8px 8px 0 0", border: "none", background: tab === key ? G.card : "none",
              borderTop: tab === key ? `1px solid ${G.border}` : "1px solid transparent",
              borderLeft: tab === key ? `1px solid ${G.border}` : "1px solid transparent",
              borderRight: tab === key ? `1px solid ${G.border}` : "1px solid transparent",
              borderBottom: tab === key ? `1px solid ${G.card}` : "1px solid transparent",
              color: tab === key ? G.text : G.dim, cursor: "pointer", fontSize: 12, fontWeight: tab === key ? 600 : 400, marginBottom: -1,
            }}
          >
            <Icon name={icon} size={13} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 16 }}>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              <KPI label="Баланс" value={`${fmtN(currentBalance)} $`} sub={`Старт: ${fmtN(activeAccount?.balance ?? 0)} $`} color={pC(allStats.totalPnl)} />
              <KPI label="PnL" value={fmt$(allStats.totalPnl)} sub={`${allStats.total} сделок`} color={pC(allStats.totalPnl)} />
              <KPI label="Винрейт" value={`${allStats.winRate.toFixed(1)}%`} sub={`${allStats.wins}W / ${allStats.losses}L / ${allStats.be}BE`} color={allStats.winRate >= 50 ? "#00e676" : "#ff4060"} />
              <KPI label="Ср. R:R" value={allStats.avgRR.toFixed(2)} sub="фактический" />
              <KPI label="Profit Factor" value={allStats.profitFactor > 0 ? allStats.profitFactor.toFixed(2) : "—"} sub="чем выше — тем лучше" color={allStats.profitFactor >= 1.5 ? "#00e676" : allStats.profitFactor > 0 ? "#ffd600" : G.muted} />
              <KPI label="Макс. просадка" value={`${drawdown.toFixed(1)}%`} sub={`Лимит: ${activeAccount?.maxDrawdown ?? "—"}%`} color={drawdown > (activeAccount?.maxDrawdown ?? 100) * 0.7 ? "#ff4060" : "#00e676"} />
            </div>

            {/* Prop account progress */}
            {activeAccount && activeAccount.phase !== "Personal" && (
              <Section title="Прогресс проп аккаунта">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {[
                    { label: "Цель прибыли", pct: Math.min(100, profitUsed), color: "#00e676", value: `${fmtN(allStats.totalPnl)} / ${fmtN(activeAccount.balance * activeAccount.profitTarget / 100)} $` },
                    { label: "Использовано просадки", pct: Math.min(100, ddUsed), color: ddUsed > 70 ? "#ff4060" : ddUsed > 40 ? "#ffd600" : "#00e676", value: `${drawdown.toFixed(1)}% / ${activeAccount.maxDrawdown}%` },
                  ].map(({ label, pct, color, value }) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                        <span style={{ color: G.muted }}>{label}</span>
                        <span style={{ color, fontWeight: 600 }}>{value}</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Equity + bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Section title="Кривая капитала">
                <EquityCurve trades={allAccTrades} startBalance={activeAccount?.balance ?? 0} height={90} />
              </Section>
              <Section title="PnL по месяцам">
                <BarChart trades={allAccTrades} />
              </Section>
            </div>

            {/* Monthly table */}
            <Section title="По месяцам">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Месяц","Сделок","W/L/BE","Винрейт","Ср. R:R","PnL"].map((h) => (
                        <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: G.dim, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: `1px solid ${G.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((m) => {
                      const ms = calcStats(allAccTrades.filter((t) => t.date.startsWith(m)));
                      return (
                        <tr key={m} style={{ cursor: "pointer" }}
                          onClick={() => { setMonth(m); setTab("trades"); }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.025)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "9px 12px", color: G.text, borderBottom: `1px solid ${G.border}` }}>{monthLabel(m)}</td>
                          <td style={{ padding: "9px 12px", color: G.muted, borderBottom: `1px solid ${G.border}` }}>{ms.total}</td>
                          <td style={{ padding: "9px 12px", borderBottom: `1px solid ${G.border}` }}>
                            <span style={{ color: "#00e676" }}>{ms.wins}</span><span style={{ color: G.dim }}> / </span>
                            <span style={{ color: "#ff4060" }}>{ms.losses}</span><span style={{ color: G.dim }}> / </span>
                            <span style={{ color: "#ffd600" }}>{ms.be}</span>
                          </td>
                          <td style={{ padding: "9px 12px", color: ms.winRate >= 50 ? "#00e676" : "#ff4060", borderBottom: `1px solid ${G.border}`, fontWeight: 600 }}>{ms.winRate.toFixed(0)}%</td>
                          <td style={{ padding: "9px 12px", color: G.muted, borderBottom: `1px solid ${G.border}` }}>{ms.avgRR.toFixed(2)}</td>
                          <td style={{ padding: "9px 12px", color: pC(ms.totalPnl), fontWeight: 700, borderBottom: `1px solid ${G.border}`, fontVariantNumeric: "tabular-nums" }}>{fmt$(ms.totalPnl)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {/* ── TRADES ── */}
        {tab === "trades" && (
          <div style={{ display: "grid", gap: 12 }}>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <Icon name="Search" size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.dim }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." style={{ ...inp({ paddingLeft: 30 }) }} />
              </div>
              <select value={asset} onChange={(e) => setAsset(e.target.value)} style={{ ...inp({ width: "auto" }), appearance: "none" }}>
                {assets.map((a) => <option key={a} value={a} style={{ background: G.card }}>{a}</option>)}
              </select>
              <select value={month ?? ""} onChange={(e) => setMonth(e.target.value || null)} style={{ ...inp({ width: "auto" }), appearance: "none" }}>
                <option value="" style={{ background: G.card }}>Все месяцы</option>
                {months.map((m) => <option key={m} value={m} style={{ background: G.card }}>{monthLabel(m)}</option>)}
              </select>
              {(month || asset !== "Все" || search) && (
                <button onClick={() => { setMonth(null); setAsset("Все"); setSearch(""); }} style={{ ...inp({ width: "auto", color: G.dim }), cursor: "pointer" }}>
                  <Icon name="X" size={13} />
                </button>
              )}
              <span style={{ fontSize: 12, color: G.dim, marginLeft: "auto" }}>
                {filtered.length} сделок · <span style={{ color: pC(stats.totalPnl), fontWeight: 600 }}>{fmt$(stats.totalPnl)}</span>
              </span>
            </div>

            {/* Table */}
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 780 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,.02)" }}>
                      {[
                        { k: "date" as const, l: "Дата" }, { k: null, l: "Актив" },
                        { k: null, l: "Направл." }, { k: null, l: "Модель" },
                        { k: null, l: "Сессия" }, { k: null, l: "TF" },
                        { k: "pnl" as const, l: "PnL" }, { k: "rr" as const, l: "R:R" },
                        { k: null, l: "Оценка" }, { k: null, l: "" },
                      ].map(({ k, l }, i) => (
                        <th key={i} style={{ padding: "10px 14px", textAlign: "left", color: G.dim, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: `1px solid ${G.border}`, whiteSpace: "nowrap" }}>
                          {k ? (
                            <button onClick={() => toggleSort(k)} style={{ background: "none", border: "none", color: sortBy === k ? G.text : G.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 500 }}>
                              {l} <Icon name={sortBy === k ? (sortDir === -1 ? "ChevronDown" : "ChevronUp") : "ChevronsUpDown"} size={10} />
                            </button>
                          ) : l}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id} style={{ cursor: "pointer", borderBottom: `1px solid ${G.border}` }}
                        onClick={() => setDetailTrade(t)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.025)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "11px 14px", color: G.dim, fontVariantNumeric: "tabular-nums" }}>{t.date.slice(5)} {t.time ? <span style={{ opacity: .6 }}>{t.time}</span> : null}</td>
                        <td style={{ padding: "11px 14px", color: G.text, fontWeight: 500 }}>{t.asset}</td>
                        <td style={{ padding: "11px 14px" }}><Pill c={SIDE_C[t.side]} bg={`${SIDE_C[t.side]}12`} border={`${SIDE_C[t.side]}25`}>{t.side}</Pill></td>
                        <td style={{ padding: "11px 14px", color: G.muted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.model}</td>
                        <td style={{ padding: "11px 14px", color: G.dim }}>{t.session}</td>
                        <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 10, color: G.dim, background: "rgba(255,255,255,.05)", borderRadius: 3, padding: "2px 5px" }}>{t.timeframe}</span></td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: pC(t.pnl), fontVariantNumeric: "tabular-nums" }}>{fmt$(t.pnl)}</td>
                        <td style={{ padding: "11px 14px", color: G.muted, fontVariantNumeric: "tabular-nums" }}>{t.rr.toFixed(1)}</td>
                        <td style={{ padding: "11px 14px", color: "#ffd600", fontSize: 11 }}>{"★".repeat(t.rating)}</td>
                        <td style={{ padding: "11px 14px" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setTradeModal(t)} style={{ color: G.dim, background: "none", border: "none", cursor: "pointer" }}><Icon name="Pencil" size={13} /></button>
                            <button onClick={() => deleteTrade(t.id)} style={{ color: G.dim, background: "none", border: "none", cursor: "pointer" }}><Icon name="Trash2" size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div style={{ padding: 60, textAlign: "center", color: G.dim }}>
                  <Icon name="Inbox" size={28} style={{ margin: "0 auto 10px", display: "block" }} />
                  Нет сделок
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              <Section title="По активам"><PieChart slices={pieByAsset.filter((s) => s.value > 0)} /></Section>
              <Section title="По сессиям"><PieChart slices={pieBySession.filter((s) => s.value > 0)} /></Section>
              <Section title="По моделям входа"><PieChart slices={pieByModel} /></Section>
            </div>

            {/* Emotion stats */}
            <Section title="Психология торговли">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                {EMOTIONS.map((e) => {
                  const eTrades = allAccTrades.filter((t) => t.emotion === e);
                  const eStats  = calcStats(eTrades);
                  return (
                    <div key={e} style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: EMOTION_COLOR[e], marginBottom: 6, fontWeight: 600 }}>{EMOTION_LABEL[e]}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: G.text }}>{eTrades.length}</div>
                      <div style={{ fontSize: 11, color: G.dim, marginTop: 2 }}>WR: {eStats.winRate.toFixed(0)}%</div>
                      <div style={{ fontSize: 11, color: pC(eStats.totalPnl), marginTop: 1, fontVariantNumeric: "tabular-nums" }}>{fmt$(eStats.totalPnl)}</div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Model stats table */}
            <Section title="Эффективность моделей">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Модель","Сделок","Винрейт","Ср. R:R","PnL"].map((h) => (
                        <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: G.dim, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: `1px solid ${G.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODELS.map((m) => {
                      const mt = allAccTrades.filter((t) => t.model === m);
                      if (!mt.length) return null;
                      const ms = calcStats(mt);
                      return (
                        <tr key={m}>
                          <td style={{ padding: "9px 12px", color: G.text, borderBottom: `1px solid ${G.border}` }}>{m}</td>
                          <td style={{ padding: "9px 12px", color: G.muted, borderBottom: `1px solid ${G.border}` }}>{ms.total}</td>
                          <td style={{ padding: "9px 12px", color: ms.winRate >= 50 ? "#00e676" : "#ff4060", fontWeight: 600, borderBottom: `1px solid ${G.border}` }}>{ms.winRate.toFixed(0)}%</td>
                          <td style={{ padding: "9px 12px", color: G.muted, borderBottom: `1px solid ${G.border}` }}>{ms.avgRR.toFixed(2)}</td>
                          <td style={{ padding: "9px 12px", color: pC(ms.totalPnl), fontWeight: 700, borderBottom: `1px solid ${G.border}`, fontVariantNumeric: "tabular-nums" }}>{fmt$(ms.totalPnl)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Session stats */}
            <Section title="Эффективность по сессиям">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {SESSIONS.map((s) => {
                  const st = allAccTrades.filter((t) => t.session === s);
                  if (!st.length) return null;
                  const ss = calcStats(st);
                  return (
                    <div key={s} style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 12, color: G.text, fontWeight: 600, marginBottom: 8 }}>{s}</div>
                      <div style={{ fontSize: 11, color: G.dim, marginBottom: 2 }}>{ss.total} сделок · WR {ss.winRate.toFixed(0)}%</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: pC(ss.totalPnl), fontVariantNumeric: "tabular-nums" }}>{fmt$(ss.totalPnl)}</div>
                      <div style={{ height: 3, background: "rgba(255,255,255,.05)", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${ss.winRate}%`, background: ss.winRate >= 50 ? "#00e676" : "#ff4060", borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* ── ACCOUNTS ── */}
        {tab === "accounts" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setAccountModal({})}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: `1px solid ${G.border}`, background: "none", color: G.text, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                <Icon name="Plus" size={14} />Добавить счёт
              </button>
            </div>
            {accounts.map((acc) => {
              const accTrades = trades.filter((t) => t.accountId === acc.id);
              const accStats  = calcStats(accTrades);
              const accBalance = acc.balance + accStats.totalPnl;
              const accDD      = calcDrawdown(accTrades, acc.balance);
              const phaseColors: Record<string, string> = { Challenge: "#ffd600", Verification: "#00b5ff", Funded: "#00e676", Personal: G.muted };
              return (
                <div key={acc.id} style={{ background: G.card, border: `1px solid ${activeAccountId === acc.id ? "rgba(255,255,255,.2)" : G.border}`, borderRadius: 14, padding: 20, cursor: "pointer" }}
                  onClick={() => { setActiveAccountId(acc.id); setTab("overview"); }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: G.text }}>{acc.name}</span>
                        <Pill c={phaseColors[acc.phase]} bg={`${phaseColors[acc.phase]}12`} border={`${phaseColors[acc.phase]}25`}>{acc.phase}</Pill>
                      </div>
                      <span style={{ fontSize: 12, color: G.dim }}>{acc.company} · {acc.currency}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: pC(accStats.totalPnl), fontVariantNumeric: "tabular-nums" }}>{fmtN(accBalance)} $</div>
                      <div style={{ fontSize: 12, color: pC(accStats.totalPnl) }}>{fmt$(accStats.totalPnl)}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 16 }}>
                    {[
                      ["Сделок", accStats.total, G.muted],
                      ["Винрейт", `${accStats.winRate.toFixed(0)}%`, accStats.winRate >= 50 ? "#00e676" : "#ff4060"],
                      ["Ср. R:R", accStats.avgRR.toFixed(2), G.muted],
                      ["Просадка", `${accDD.toFixed(1)}%`, accDD > acc.maxDrawdown * 0.7 ? "#ff4060" : "#00e676"],
                    ].map(([l, v, c]) => (
                      <div key={String(l)} style={{ background: "rgba(255,255,255,.03)", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: G.dim, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c as string }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {acc.phase !== "Personal" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: `Цель ${acc.profitTarget}%`, pct: Math.min(100, (accStats.totalPnl / (acc.balance * acc.profitTarget / 100)) * 100), color: "#00e676" },
                        { label: `Просадка ${acc.maxDrawdown}%`, pct: Math.min(100, (accDD / acc.maxDrawdown) * 100), color: accDD / acc.maxDrawdown > 0.7 ? "#ff4060" : "#ffd600" },
                      ].map(({ label, pct, color }) => (
                        <div key={label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                            <span style={{ color: G.dim }}>{label}</span>
                            <span style={{ color, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,.06)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setAccountModal(acc)} style={{ fontSize: 11, color: G.dim, background: "none", border: `1px solid ${G.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>Редактировать</button>
                    {accounts.length > 1 && (
                      <button onClick={() => setAccounts((p) => p.filter((a) => a.id !== acc.id))} style={{ fontSize: 11, color: G.dim, background: "none", border: `1px solid ${G.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>Удалить</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {tradeModal !== undefined && (
        <TradeModal trade={tradeModal} accounts={accounts} onSave={saveTrade} onClose={() => setTradeModal(undefined)} />
      )}
      {accountModal !== undefined && (
        <AccountModal account={accountModal} onSave={saveAccount} onClose={() => setAccountModal(undefined)} />
      )}
      {detailTrade && (
        <TradeDrawer trade={detailTrade} onClose={() => setDetailTrade(null)} onEdit={() => { setTradeModal(detailTrade); setDetailTrade(null); }} />
      )}
    </div>
  );
}
