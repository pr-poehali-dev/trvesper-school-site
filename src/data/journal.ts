export type Side = "Long" | "Short";
export type Status = "Win" | "Loss" | "BE";
export type Session = "Азия" | "Лондон" | "Нью-Йорк" | "Перекрытие" | "Другое";
export type Timeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1";
export type EntryModel =
  | "FVG"
  | "Order Block"
  | "Sweep + BOS"
  | "Sweep + FVG"
  | "BOS + OB"
  | "Liquidity Grab"
  | "CHOCH"
  | "Inversion FVG"
  | "Rejection Block"
  | "Другое";

export interface PropAccount {
  id: string;
  name: string;
  company: string;
  balance: number;
  maxDrawdown: number;    // % макс. просадка
  dailyDrawdown: number;  // % дневная просадка
  profitTarget: number;   // % цель прибыли
  phase: "Challenge" | "Verification" | "Funded" | "Personal";
  currency: string;
}

export interface Trade {
  id: string;
  accountId: string;
  date: string;
  time?: string;
  asset: string;
  side: Side;
  entry: number;
  exit: number;
  sl?: number;
  tp?: number;
  size: number;
  pnl: number;
  pnlPct: number;
  rr: number;
  status: Status;
  session: Session;
  timeframe: Timeframe;
  model: EntryModel;
  tags: string[];
  notes: string;
  screenshots: string[];   // base64 или URL
  rating: 1 | 2 | 3 | 4 | 5; // самооценка сделки
  emotion: "calm" | "fomo" | "revenge" | "confident" | "hesitant";
}

// ─── Prop companies ──────────────────────────────────────────────
export const PROP_COMPANIES = [
  "FTMO",
  "MyForexFunds",
  "The Funded Trader",
  "True Forex Funds",
  "Funding Pips",
  "Apex Trader Funding",
  "E8 Funding",
  "TopStep",
  "Другая",
];

// ─── Demo accounts ───────────────────────────────────────────────
export const DEFAULT_ACCOUNTS: PropAccount[] = [
  {
    id: "acc1",
    name: "FTMO $25k",
    company: "FTMO",
    balance: 25000,
    maxDrawdown: 10,
    dailyDrawdown: 5,
    profitTarget: 10,
    phase: "Funded",
    currency: "USD",
  },
  {
    id: "acc2",
    name: "Личный счёт",
    company: "Личный",
    balance: 5000,
    maxDrawdown: 20,
    dailyDrawdown: 10,
    profitTarget: 0,
    phase: "Personal",
    currency: "USD",
  },
];

// ─── Demo trades ─────────────────────────────────────────────────
export const DEMO_TRADES: Trade[] = [
  { id:"1",  accountId:"acc1", date:"2025-01-07", time:"10:15", asset:"BTC/USDT",  side:"Long",  entry:94200, exit:96800, sl:93500,  tp:97200,  size:1500, pnl:+412,  pnlPct:+2.76, rr:2.1, status:"Win",  session:"Лондон",    timeframe:"H1",  model:"FVG",           tags:["по плану","чистая"],    notes:"Чёткий имбаланс на H1, заход от OB. Цена уважала уровень, вошёл по лимитке.",     screenshots:[], rating:5, emotion:"confident" },
  { id:"2",  accountId:"acc1", date:"2025-01-12", time:"15:30", asset:"ETH/USDT",  side:"Short", entry:3380,  exit:3290,  sl:3420,   tp:3250,   size:1000, pnl:+226,  pnlPct:+2.26, rr:1.8, status:"Win",  session:"Нью-Йорк",  timeframe:"H4",  model:"Sweep + BOS",   tags:["по плану"],             notes:"Ликвидность снята, BOS вниз подтверждён.",                                        screenshots:[], rating:4, emotion:"calm" },
  { id:"3",  accountId:"acc1", date:"2025-01-18", time:"09:45", asset:"BTC/USDT",  side:"Long",  entry:95100, exit:94600, sl:94500,  tp:96200,  size:1200, pnl:-118,  pnlPct:-0.98, rr:0.5, status:"Loss", session:"Лондон",    timeframe:"M15", model:"FVG",           tags:["ранний вход"],          notes:"Ложный пробой, вынесло стоп. Не дождался подтверждения на M15.",                  screenshots:[], rating:2, emotion:"fomo" },
  { id:"4",  accountId:"acc1", date:"2025-01-22", time:"12:00", asset:"SOL/USDT",  side:"Long",  entry:188,   exit:197,   sl:184,    tp:198,    size:800,  pnl:+192,  pnlPct:+2.40, rr:2.4, status:"Win",  session:"Нью-Йорк",  timeframe:"M15", model:"Order Block",   tags:["по плану","чистая"],    notes:"Откат к OB на M15, чисто зашёл.",                                                 screenshots:[], rating:5, emotion:"confident" },
  { id:"5",  accountId:"acc1", date:"2025-01-29", time:"04:00", asset:"ETH/USDT",  side:"Short", entry:3250,  exit:3255,  sl:3270,   tp:3200,   size:900,  pnl:-9,    pnlPct:-0.10, rr:0.0, status:"BE",   session:"Азия",      timeframe:"H1",  model:"Sweep + BOS",   tags:["перевёл в б/у"],        notes:"Закрыл в ноль, непонятная структура на открытии азиатской сессии.",               screenshots:[], rating:3, emotion:"hesitant" },
  { id:"6",  accountId:"acc1", date:"2025-02-04", time:"14:45", asset:"BTC/USDT",  side:"Long",  entry:97800, exit:101200,sl:96800,  tp:102000, size:2000, pnl:+694,  pnlPct:+3.47, rr:3.2, status:"Win",  session:"Нью-Йорк",  timeframe:"H4",  model:"Sweep + FVG",   tags:["топ сделка","по плану"],notes:"Sweep HTF, FVG LTF, отличная сделка. Всё совпало по плану.",                      screenshots:[], rating:5, emotion:"confident" },
  { id:"7",  accountId:"acc1", date:"2025-02-09", time:"08:30", asset:"SOL/USDT",  side:"Short", entry:210,   exit:198,   sl:215,    tp:196,    size:700,  pnl:+280,  pnlPct:+4.00, rr:2.8, status:"Win",  session:"Лондон",    timeframe:"H4",  model:"BOS + OB",      tags:["по плану"],             notes:"BOS на H4, заход от OB H1.",                                                      screenshots:[], rating:4, emotion:"calm" },
  { id:"8",  accountId:"acc1", date:"2025-02-14", time:"16:00", asset:"BNB/USDT",  side:"Long",  entry:615,   exit:601,   sl:608,    tp:632,    size:600,  pnl:-136,  pnlPct:-2.27, rr:0.4, status:"Loss", session:"Нью-Йорк",  timeframe:"H1",  model:"FVG",           tags:["новости"],              notes:"Вышли неожиданные данные CPI, цена пробила OB.",                                  screenshots:[], rating:2, emotion:"revenge" },
  { id:"9",  accountId:"acc1", date:"2025-02-19", time:"10:00", asset:"BTC/USDT",  side:"Short", entry:98200, exit:95600, sl:99000,  tp:95000,  size:1800, pnl:+476,  pnlPct:+2.64, rr:2.2, status:"Win",  session:"Лондон",    timeframe:"H1",  model:"Liquidity Grab",tags:["по плану","чистая"],    notes:"Двойной sweep, отличная ликвидность снята.",                                      screenshots:[], rating:5, emotion:"confident" },
  { id:"10", accountId:"acc2", date:"2025-02-25", time:"13:15", asset:"ETH/USDT",  side:"Long",  entry:2780,  exit:2820,  sl:2750,   tp:2840,   size:1100, pnl:+158,  pnlPct:+1.44, rr:1.6, status:"Win",  session:"Перекрытие", timeframe:"M30", model:"Order Block",  tags:[],                       notes:"",                                                                                screenshots:[], rating:3, emotion:"calm" },
  { id:"11", accountId:"acc2", date:"2025-03-03", time:"11:30", asset:"SOL/USDT",  side:"Long",  entry:175,   exit:168,   sl:171,    tp:183,    size:900,  pnl:-189,  pnlPct:-2.10, rr:0.3, status:"Loss", session:"Лондон",    timeframe:"M15", model:"FVG",           tags:["слабая зона"],          notes:"Слабая структура, лучше пропустить эту сделку.",                                  screenshots:[], rating:1, emotion:"fomo" },
  { id:"12", accountId:"acc1", date:"2025-03-08", time:"09:00", asset:"BTC/USDT",  side:"Long",  entry:89500, exit:93000, sl:88500,  tp:93500,  size:2500, pnl:+976,  pnlPct:+3.90, rr:3.5, status:"Win",  session:"Лондон",    timeframe:"H4",  model:"Order Block",   tags:["топ сделка","по плану"],notes:"Идеальная сделка по плану. Сильный OB на H4.",                                    screenshots:[], rating:5, emotion:"confident" },
  { id:"13", accountId:"acc1", date:"2025-03-13", time:"15:45", asset:"BNB/USDT",  side:"Short", entry:598,   exit:582,   sl:607,    tp:575,    size:800,  pnl:+214,  pnlPct:+2.68, rr:2.0, status:"Win",  session:"Нью-Йорк",  timeframe:"H1",  model:"Sweep + BOS",   tags:["по плану"],             notes:"",                                                                                screenshots:[], rating:4, emotion:"calm" },
  { id:"14", accountId:"acc2", date:"2025-03-19", time:"10:30", asset:"ETH/USDT",  side:"Long",  entry:2050,  exit:2090,  sl:2020,   tp:2100,   size:1300, pnl:+253,  pnlPct:+1.95, rr:1.9, status:"Win",  session:"Лондон",    timeframe:"H1",  model:"BOS + OB",      tags:["по плану"],             notes:"Пробой структуры подтверждён, заход от OB.",                                      screenshots:[], rating:4, emotion:"confident" },
  { id:"15", accountId:"acc1", date:"2025-03-26", time:"07:00", asset:"SOL/USDT",  side:"Short", entry:185,   exit:185,   sl:189,    tp:177,    size:700,  pnl:+0,    pnlPct:0.00,  rr:0.0, status:"BE",   session:"Азия",      timeframe:"H1",  model:"FVG",           tags:["перевёл в б/у"],        notes:"Закрыл по БУ, неуверен был в направлении.",                                      screenshots:[], rating:3, emotion:"hesitant" },
  { id:"16", accountId:"acc1", date:"2025-04-02", time:"14:00", asset:"BTC/USDT",  side:"Short", entry:85200, exit:82100, sl:86200,  tp:82000,  size:2000, pnl:+728,  pnlPct:+3.64, rr:3.1, status:"Win",  session:"Нью-Йорк",  timeframe:"H4",  model:"Sweep + BOS",   tags:["топ сделка","по плану"],notes:"Отличный sweep на HTF, BOS подтверждён на H1.",                                   screenshots:[], rating:5, emotion:"confident" },
  { id:"17", accountId:"acc2", date:"2025-04-08", time:"09:15", asset:"ETH/USDT",  side:"Long",  entry:1880,  exit:1850,  sl:1860,   tp:1930,   size:1000, pnl:-149,  pnlPct:-1.49, rr:0.4, status:"Loss", session:"Лондон",    timeframe:"M30", model:"Order Block",   tags:["ранний вход"],          notes:"Зашёл рано, OB не удержал. Надо было ждать реакцию.",                            screenshots:[], rating:2, emotion:"hesitant" },
  { id:"18", accountId:"acc1", date:"2025-04-12", time:"13:30", asset:"BNB/USDT",  side:"Long",  entry:580,   exit:608,   sl:570,    tp:612,    size:900,  pnl:+432,  pnlPct:+4.80, rr:3.8, status:"Win",  session:"Нью-Йорк",  timeframe:"H1",  model:"Inversion FVG", tags:["топ сделка","чистая"],  notes:"Лучшая сделка апреля. Инверсия FVG отработала идеально.",                        screenshots:[], rating:5, emotion:"confident" },
];

// ─── Helpers ─────────────────────────────────────────────────────
export function getMonths(trades: Trade[]): string[] {
  const set = new Set(trades.map((t) => t.date.slice(0, 7)));
  return Array.from(set).sort().reverse();
}

export function getAssets(trades: Trade[]): string[] {
  const set = new Set(trades.map((t) => t.asset));
  return ["Все", ...Array.from(set).sort()];
}

export function filterTrades(
  trades: Trade[],
  month: string | null,
  asset: string,
  accountId?: string
): Trade[] {
  return trades.filter((t) => {
    const matchMonth = !month || t.date.startsWith(month);
    const matchAsset = asset === "Все" || t.asset === asset;
    const matchAccount = !accountId || t.accountId === accountId;
    return matchMonth && matchAsset && matchAccount;
  });
}

export function calcStats(trades: Trade[]) {
  const wins   = trades.filter((t) => t.status === "Win").length;
  const losses = trades.filter((t) => t.status === "Loss").length;
  const be     = trades.filter((t) => t.status === "BE").length;
  const totalPnl  = trades.reduce((a, t) => a + t.pnl, 0);
  const winRate   = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const avgRR     = trades.length > 0 ? trades.reduce((a, t) => a + t.rr, 0) / trades.length : 0;
  const winTrades = trades.filter((t) => t.status === "Win");
  const lossTrades = trades.filter((t) => t.status === "Loss");
  const avgWin    = winTrades.length > 0  ? winTrades.reduce((a, t) => a + t.pnl, 0)  / winTrades.length  : 0;
  const avgLoss   = lossTrades.length > 0 ? lossTrades.reduce((a, t) => a + t.pnl, 0) / lossTrades.length : 0;
  const bestTrade  = trades.reduce<Trade | null>((b, t) => (t.pnl > (b?.pnl ?? -Infinity) ? t : b), null);
  const worstTrade = trades.reduce<Trade | null>((b, t) => (t.pnl < (b?.pnl ?? Infinity)  ? t : b), null);
  const profitFactor = lossTrades.length > 0 && Math.abs(avgLoss) > 0
    ? (winTrades.reduce((a, t) => a + t.pnl, 0)) / Math.abs(lossTrades.reduce((a, t) => a + t.pnl, 0))
    : 0;
  const avgRating = trades.length > 0 ? trades.reduce((a, t) => a + t.rating, 0) / trades.length : 0;
  return { wins, losses, be, totalPnl, winRate, avgRR, bestTrade, worstTrade, avgWin, avgLoss, total: trades.length, profitFactor, avgRating };
}

export function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const names = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}

export function calcEquity(trades: Trade[], startBalance: number): { date: string; value: number }[] {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let bal = startBalance;
  const points = [{ date: "Старт", value: bal }];
  sorted.forEach((t) => {
    bal += t.pnl;
    points.push({ date: t.date.slice(5), value: bal });
  });
  return points;
}

export function calcDrawdown(trades: Trade[], startBalance: number): number {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let peak = startBalance;
  let bal  = startBalance;
  let maxDD = 0;
  sorted.forEach((t) => {
    bal += t.pnl;
    if (bal > peak) peak = bal;
    const dd = ((peak - bal) / peak) * 100;
    if (dd > maxDD) maxDD = dd;
  });
  return maxDD;
}
