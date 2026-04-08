import { Candle, Zone } from "@/components/CandleChart";

function genCandles(seed: number, count: number, basePrice: number, volatility: number): Candle[] {
  const times = ["09:00","09:15","09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:15",
    "11:30","11:45","12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45",
    "14:00","14:15","14:30","14:45","15:00","15:15","15:30","15:45","16:00","16:15",
    "16:30","16:45","17:00","17:15","17:30","17:45","18:00","18:15","18:30","18:45"];

  let price = basePrice;
  let rng = seed;
  const next = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return ((rng >>> 0) / 0xffffffff) * 2 - 1;
  };

  return Array.from({ length: count }, (_, i) => {
    const move = next() * volatility;
    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + Math.abs(next()) * volatility * 0.5;
    const low = Math.min(open, close) - Math.abs(next()) * volatility * 0.5;
    price = close;
    return { open, high, low, close, time: times[i % times.length] };
  });
}

export interface LessonData {
  id: number;
  title: string;
  description: string;
  task: string;
  hint: string;
  explanation: string;
  candles: Candle[];
  correctZones: Zone[];
  completed?: boolean;
  score?: number;
}

// --- УРОК 1: Имбаланс (FVG) ---
const candles1 = genCandles(42, 32, 42000, 150);
// Создаём явный FVG: свеча вниз → большая бычья → свеча вверх, оставляя Gap
candles1[10] = { open: 41800, high: 41830, low: 41720, close: 41730, time: "11:30" };
candles1[11] = { open: 41730, high: 42300, low: 41720, close: 42260, time: "11:45" }; // импульс вверх
candles1[12] = { open: 42260, high: 42380, low: 42220, close: 42350, time: "12:00" };
// FVG = low[12] - high[10] = 42220 - 41830 = зона 41830–42220

const candles1b = genCandles(99, 32, 61000, 200);
candles1b[16] = { open: 60900, high: 60950, low: 60820, close: 60830, time: "14:00" };
candles1b[17] = { open: 60830, high: 61650, low: 60810, close: 61600, time: "14:15" };
candles1b[18] = { open: 61600, high: 61700, low: 61520, close: 61680, time: "14:30" };
// FVG = 60950 – 61520

const LESSON_1: LessonData = {
  id: 1,
  title: "Имбаланс (FVG)",
  description: "Fair Value Gap — зона, оставшаяся незаполненной после импульсного движения. Тень левой свечи не перекрывает тень правой.",
  task: "Найди и выдели зону имбаланса (FVG) на графике. Это зазор между тенями 1-й и 3-й свечи после импульса.",
  hint: "Найди три последовательные свечи, где средняя — большая бычья. Имбаланс — между максимумом первой свечи и минимумом третьей.",
  explanation: "FVG на этом графике образован тремя свечами: первая (high ~41830), импульсная бычья и третья (low ~42220). Зазор между 41830 и 42220 — это имбаланс. Цена часто возвращается туда, чтобы 'заполнить' пробел перед продолжением тренда.",
  candles: candles1,
  correctZones: [
    { id: "fvg1", y1: 42220, y2: 41830, color: "cyan", label: "FVG (имбаланс)", correct: false },
  ],
};

// --- УРОК 2: Уровни поддержки и сопротивления ---
const candles2 = genCandles(77, 36, 35000, 120);
// Добавляем 2 касания снизу (поддержка) ~35200
candles2[5]  = { open: 35250, high: 35280, low: 35180, close: 35240, time: "09:45" };
candles2[6]  = { open: 35240, high: 35400, low: 35195, close: 35380, time: "10:00" };
candles2[14] = { open: 35220, high: 35260, low: 35185, close: 35250, time: "11:30" };
candles2[15] = { open: 35250, high: 35500, low: 35200, close: 35470, time: "11:45" };
// 2 касания сверху (сопротивление) ~35800
candles2[20] = { open: 35780, high: 35830, low: 35720, close: 35740, time: "12:45" };
candles2[21] = { open: 35740, high: 35800, low: 35580, close: 35610, time: "13:00" };
candles2[27] = { open: 35760, high: 35820, low: 35700, close: 35720, time: "14:15" };
candles2[28] = { open: 35720, high: 35810, low: 35620, close: 35650, time: "14:30" };

const LESSON_2: LessonData = {
  id: 2,
  title: "Поддержка и сопротивление",
  description: "Уровни, от которых цена несколько раз разворачивалась. Чем больше касаний — тем сильнее уровень.",
  task: "Найди и выдели зону поддержки (снизу) и зону сопротивления (сверху). Отметь обе зоны на графике.",
  hint: "Ищи места, где цена разворачивалась 2 и более раз. Поддержка — снизу (~35180–35260), сопротивление — сверху (~35760–35830).",
  explanation: "Поддержка: цена дважды отталкивалась от зоны 35180–35260, формируя точки покупки. Сопротивление: цена трижды разворачивалась вниз от зоны 35760–35830. Эти уровни работают, пока не будут пробиты с объёмом.",
  candles: candles2,
  correctZones: [
    { id: "sup1", y1: 35265, y2: 35175, color: "cyan", label: "Поддержка", correct: false },
    { id: "res1", y1: 35835, y2: 35755, color: "pink", label: "Сопротивление", correct: false },
  ],
};

// --- УРОК 3: Order Block (OB) ---
const candles3 = genCandles(13, 34, 28000, 100);
// Order Block — последняя медвежья свеча перед импульсом вверх
candles3[12] = { open: 28200, high: 28230, low: 28050, close: 28070, time: "11:00" }; // последняя медвежья - OB
candles3[13] = { open: 28070, high: 28500, low: 28060, close: 28460, time: "11:15" }; // импульс
candles3[14] = { open: 28460, high: 28600, low: 28420, close: 28570, time: "11:30" };
candles3[15] = { open: 28570, high: 28650, low: 28530, close: 28620, time: "11:45" };
// OB зона = тело медвежьей свечи [12]: 28070–28200

const LESSON_3: LessonData = {
  id: 3,
  title: "Order Block (OB)",
  description: "Order Block — последняя противоположная свеча перед сильным импульсом. Область, где крупный игрок набирал позицию.",
  task: "Найди Order Block — последнюю медвежью свечу перед импульсным ростом. Выдели её тело как зону.",
  hint: "Найди место, где после серии нейтральных свечей начался сильный рост. Order Block — это тело последней красной свечи прямо перед импульсом (около 28050–28230).",
  explanation: "Order Block находится на свече перед импульсом (28050–28230). Это зона, где маркетмейкер накапливал длинные позиции. После накопления — мощный выброс вверх. При откате цена часто возвращается в OB для ретеста перед продолжением роста.",
  candles: candles3,
  correctZones: [
    { id: "ob1", y1: 28230, y2: 28050, color: "pink", label: "Order Block", correct: false },
  ],
};

// --- УРОК 4: Liquidity Sweep ---
const candles4 = genCandles(55, 36, 50000, 180);
// Ложный пробой максимума — sweep
candles4[10] = { open: 50200, high: 50800, low: 50180, close: 50750, time: "10:45" }; // swing high
candles4[20] = { open: 50700, high: 51050, low: 50680, close: 50720, time: "12:45" }; // sweep выше
candles4[21] = { open: 50720, high: 50730, low: 50300, close: 50350, time: "13:00" }; // разворот вниз
candles4[22] = { open: 50350, high: 50400, low: 49800, close: 49850, time: "13:15" };

const LESSON_4: LessonData = {
  id: 4,
  title: "Ликвидность (Sweep)",
  description: "Sweep — ложный пробой уровня для сбора стоп-лоссов перед разворотом. Цена 'пробивает' уровень и тут же разворачивается.",
  task: "Найди зону ликвидности — уровень, который цена пробила, а затем резко развернулась. Выдели эту зону.",
  hint: "Найди предыдущий максимум (~50750–50800). Цена ненадолго пробила его (~51050) и сразу развернулась. Выдели диапазон от старого хая до точки разворота.",
  explanation: "Sweep произошёл в зоне 50750–51050. Цена пробила предыдущий максимум (~50800), собрала стоп-лоссы покупателей и ликвидность выше уровня, после чего резко развернулась вниз. Это классический признак ложного пробоя с целью набора короткой позиции.",
  candles: candles4,
  correctZones: [
    { id: "liq1", y1: 51060, y2: 50740, color: "cyan", label: "Sweep ликвидности", correct: false },
  ],
};

export const PRACTICE_LESSONS: LessonData[] = [
  LESSON_1,
  LESSON_2,
  LESSON_3,
  LESSON_4,
];
