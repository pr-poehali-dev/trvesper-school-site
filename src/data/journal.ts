export type Side = "Long" | "Short";
export type Status = "Win" | "Loss" | "BE";

export interface Trade {
  id: string;
  date: string;       // ISO "2025-01-15"
  asset: string;      // "BTC/USDT"
  side: Side;
  entry: number;
  exit: number;
  size: number;       // в USDT
  pnl: number;        // в USDT
  pnlPct: number;     // в %
  rr: number;         // Risk:Reward фактический
  status: Status;
  strategy: string;
  notes: string;
}

export const DEMO_TRADES: Trade[] = [
  { id:"1",  date:"2025-01-07", asset:"BTC/USDT",  side:"Long",  entry:94200, exit:96800, size:1500, pnl:+412,  pnlPct:+2.76, rr:2.1, status:"Win",  strategy:"FVG + OB",     notes:"Чёткий имбаланс на H1, заход от OB" },
  { id:"2",  date:"2025-01-12", asset:"ETH/USDT",  side:"Short", entry:3380,  exit:3290,  size:1000, pnl:+226,  pnlPct:+2.26, rr:1.8, status:"Win",  strategy:"Sweep + BOS",  notes:"Ликвидность снята, BOS вниз" },
  { id:"3",  date:"2025-01-18", asset:"BTC/USDT",  side:"Long",  entry:95100, exit:94600, size:1200, pnl:-118,  pnlPct:-0.98, rr:0.5, status:"Loss", strategy:"FVG",          notes:"Ложный пробой, вынесло стоп" },
  { id:"4",  date:"2025-01-22", asset:"SOL/USDT",  side:"Long",  entry:188,   exit:197,   size:800,  pnl:+192,  pnlPct:+2.40, rr:2.4, status:"Win",  strategy:"OB",           notes:"Откат к OB на M15, чисто" },
  { id:"5",  date:"2025-01-29", asset:"ETH/USDT",  side:"Short", entry:3250,  exit:3255,  size:900,  pnl:-9,    pnlPct:-0.10, rr:0.0, status:"BE",   strategy:"Sweep",        notes:"Закрыл в ноль, непонятная структура" },
  { id:"6",  date:"2025-02-04", asset:"BTC/USDT",  side:"Long",  entry:97800, exit:101200,size:2000, pnl:+694,  pnlPct:+3.47, rr:3.2, status:"Win",  strategy:"FVG + Sweep",  notes:"Sweep HTF, FVG LTF, отличная сделка" },
  { id:"7",  date:"2025-02-09", asset:"SOL/USDT",  side:"Short", entry:210,   exit:198,   size:700,  pnl:+280,  pnlPct:+4.00, rr:2.8, status:"Win",  strategy:"BOS + OB",     notes:"BOS на H4, заход от OB H1" },
  { id:"8",  date:"2025-02-14", asset:"BNB/USDT",  side:"Long",  entry:615,   exit:601,   size:600,  pnl:-136,  pnlPct:-2.27, rr:0.4, status:"Loss", strategy:"FVG",          notes:"Новости против позиции" },
  { id:"9",  date:"2025-02-19", asset:"BTC/USDT",  side:"Short", entry:98200, exit:95600, size:1800, pnl:+476,  pnlPct:+2.64, rr:2.2, status:"Win",  strategy:"Sweep + FVG",  notes:"Двойной sweep, отличная ликвидность" },
  { id:"10", date:"2025-02-25", asset:"ETH/USDT",  side:"Long",  entry:2780,  exit:2820,  size:1100, pnl:+158,  pnlPct:+1.44, rr:1.6, status:"Win",  strategy:"OB",           notes:"" },
  { id:"11", date:"2025-03-03", asset:"SOL/USDT",  side:"Long",  entry:175,   exit:168,   size:900,  pnl:-189,  pnlPct:-2.10, rr:0.3, status:"Loss", strategy:"FVG",          notes:"Слабая структура, лучше пропустить" },
  { id:"12", date:"2025-03-08", asset:"BTC/USDT",  side:"Long",  entry:89500, exit:93000, size:2500, pnl:+976,  pnlPct:+3.90, rr:3.5, status:"Win",  strategy:"OB + FVG",     notes:"Идеальная сделка по плану" },
  { id:"13", date:"2025-03-13", asset:"BNB/USDT",  side:"Short", entry:598,   exit:582,   size:800,  pnl:+214,  pnlPct:+2.68, rr:2.0, status:"Win",  strategy:"Sweep",        notes:"" },
  { id:"14", date:"2025-03-19", asset:"ETH/USDT",  side:"Long",  entry:2050,  exit:2090,  size:1300, pnl:+253,  pnlPct:+1.95, rr:1.9, status:"Win",  strategy:"BOS + OB",     notes:"Пробой структуры подтверждён" },
  { id:"15", date:"2025-03-26", asset:"SOL/USDT",  side:"Short", entry:185,   exit:185,   size:700,  pnl:+0,    pnlPct:0.00,  rr:0.0, status:"BE",   strategy:"FVG",          notes:"Закрыл по БУ, неуверен был" },
  { id:"16", date:"2025-04-02", asset:"BTC/USDT",  side:"Short", entry:85200, exit:82100, size:2000, pnl:+728,  pnlPct:+3.64, rr:3.1, status:"Win",  strategy:"Sweep + BOS",  notes:"Отличный sweep на HTF" },
  { id:"17", date:"2025-04-08", asset:"ETH/USDT",  side:"Long",  entry:1880,  exit:1850,  size:1000, pnl:-149,  pnlPct:-1.49, rr:0.4, status:"Loss", strategy:"OB",           notes:"Зашёл рано, OB не удержал" },
  { id:"18", date:"2025-04-12", asset:"BNB/USDT",  side:"Long",  entry:580,   exit:608,   size:900,  pnl:+432,  pnlPct:+4.80, rr:3.8, status:"Win",  strategy:"FVG + OB",     notes:"Лучшая сделка апреля" },
];

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
  asset: string
): Trade[] {
  return trades.filter((t) => {
    const matchMonth = !month || t.date.startsWith(month);
    const matchAsset = asset === "Все" || t.asset === asset;
    return matchMonth && matchAsset;
  });
}

export function calcStats(trades: Trade[]) {
  const wins = trades.filter((t) => t.status === "Win").length;
  const losses = trades.filter((t) => t.status === "Loss").length;
  const be = trades.filter((t) => t.status === "BE").length;
  const totalPnl = trades.reduce((a, t) => a + t.pnl, 0);
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const avgRR = trades.length > 0 ? trades.reduce((a, t) => a + t.rr, 0) / trades.length : 0;
  const bestTrade = trades.reduce((best, t) => (t.pnl > (best?.pnl ?? -Infinity) ? t : best), null as Trade | null);
  const worstTrade = trades.reduce((worst, t) => (t.pnl < (worst?.pnl ?? Infinity) ? t : worst), null as Trade | null);
  const avgWin = wins > 0 ? trades.filter((t) => t.status === "Win").reduce((a, t) => a + t.pnl, 0) / wins : 0;
  const avgLoss = losses > 0 ? trades.filter((t) => t.status === "Loss").reduce((a, t) => a + t.pnl, 0) / losses : 0;
  return { wins, losses, be, totalPnl, winRate, avgRR, bestTrade, worstTrade, avgWin, avgLoss, total: trades.length };
}

export function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const names = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  return `${names[parseInt(mo) - 1]} ${y}`;
}
