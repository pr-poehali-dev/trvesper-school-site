import { useRef, useState, useEffect, useCallback } from "react";

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
}

export interface Zone {
  id: string;
  y1: number; // price
  y2: number; // price
  color: string;
  label: string;
  correct?: boolean;
}

export interface DrawnZone {
  id: string;
  y1: number;
  y2: number;
  startX: number;
  endX: number;
}

interface CandleChartProps {
  candles: Candle[];
  correctZones?: Zone[];
  showCorrect?: boolean;
  onZoneDrawn?: (zone: DrawnZone) => void;
  drawnZones?: DrawnZone[];
  mode?: "draw" | "view";
  height?: number;
}

const PAD_LEFT = 10;
const PAD_RIGHT = 60;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

export default function CandleChart({
  candles,
  correctZones = [],
  showCorrect = false,
  onZoneDrawn,
  drawnZones = [],
  mode = "draw",
  height = 420,
}: CandleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [drawing, setDrawing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // price range
  const minPrice = Math.min(...candles.map((c) => c.low)) * 0.999;
  const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.001;

  const toPixelY = useCallback(
    (price: number, h: number) => {
      const chartH = h - PAD_TOP - PAD_BOTTOM;
      return PAD_TOP + chartH - ((price - minPrice) / (maxPrice - minPrice)) * chartH;
    },
    [minPrice, maxPrice]
  );

  const toPrice = useCallback(
    (py: number, h: number) => {
      const chartH = h - PAD_TOP - PAD_BOTTOM;
      return minPrice + ((chartH - (py - PAD_TOP)) / chartH) * (maxPrice - minPrice);
    },
    [minPrice, maxPrice]
  );

  const candleWidth = useCallback(
    (w: number) => {
      const chartW = w - PAD_LEFT - PAD_RIGHT;
      return Math.max(4, Math.floor(chartW / candles.length) - 2);
    },
    [candles.length]
  );

  const candleX = useCallback(
    (i: number, w: number) => {
      const chartW = w - PAD_LEFT - PAD_RIGHT;
      const step = chartW / candles.length;
      return PAD_LEFT + i * step + step / 2;
    },
    [candles.length]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(0,245,255,0.06)";
    ctx.lineWidth = 1;
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD_TOP + ((h - PAD_TOP - PAD_BOTTOM) / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(w - PAD_RIGHT, y);
      ctx.stroke();

      // Price label
      const price = maxPrice - ((maxPrice - minPrice) / gridLines) * i;
      ctx.fillStyle = "rgba(0,245,255,0.4)";
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(price.toFixed(0), w - PAD_RIGHT + 6, y + 4);
    }

    // Correct zones (shown after check)
    if (showCorrect) {
      correctZones.forEach((zone) => {
        const py1 = toPixelY(zone.y1, h);
        const py2 = toPixelY(zone.y2, h);
        const top = Math.min(py1, py2);
        const bottom = Math.max(py1, py2);
        ctx.fillStyle = zone.correct
          ? "rgba(0,245,255,0.12)"
          : "rgba(255,45,155,0.12)";
        ctx.fillRect(PAD_LEFT, top, w - PAD_LEFT - PAD_RIGHT, bottom - top);
        ctx.strokeStyle = zone.correct ? "rgba(0,245,255,0.7)" : "rgba(255,45,155,0.7)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(PAD_LEFT, top, w - PAD_LEFT - PAD_RIGHT, bottom - top);
        ctx.setLineDash([]);

        ctx.fillStyle = zone.correct ? "rgba(0,245,255,0.9)" : "rgba(255,45,155,0.9)";
        ctx.font = "bold 11px 'IBM Plex Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(zone.label, PAD_LEFT + 6, top + 14);
      });
    }

    // Drawn zones by student
    drawnZones.forEach((zone) => {
      const py1 = toPixelY(zone.y1, h);
      const py2 = toPixelY(zone.y2, h);
      const top = Math.min(py1, py2);
      const bottom = Math.max(py1, py2);
      ctx.fillStyle = "rgba(170,255,0,0.08)";
      ctx.fillRect(PAD_LEFT, top, w - PAD_LEFT - PAD_RIGHT, bottom - top);
      ctx.strokeStyle = "rgba(170,255,0,0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(PAD_LEFT, top, w - PAD_LEFT - PAD_RIGHT, bottom - top);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(170,255,0,0.8)";
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("Ваша зона", PAD_LEFT + 6, top + 14);
    });

    // Active drawing zone
    if (drawing && startY !== currentY) {
      const top = Math.min(startY, currentY);
      const bottom = Math.max(startY, currentY);
      ctx.fillStyle = "rgba(170,255,0,0.06)";
      ctx.fillRect(PAD_LEFT, top, w - PAD_LEFT - PAD_RIGHT, bottom - top);
      ctx.strokeStyle = "rgba(170,255,0,0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(PAD_LEFT, top, w - PAD_LEFT - PAD_RIGHT, bottom - top);
      ctx.setLineDash([]);
    }

    // Candles
    const cw = candleWidth(w);
    candles.forEach((candle, i) => {
      const x = candleX(i, w);
      const openY = toPixelY(candle.open, h);
      const closeY = toPixelY(candle.close, h);
      const highY = toPixelY(candle.high, h);
      const lowY = toPixelY(candle.low, h);
      const isBull = candle.close >= candle.open;

      const bodyColor = isBull ? "#00b899" : "#e03060";
      const wickColor = isBull ? "#00d4aa" : "#ff4070";

      // Wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, Math.min(openY, closeY));
      ctx.moveTo(x, Math.max(openY, closeY));
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(closeY - openY), 1);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - cw / 2, bodyTop, cw, bodyH);

      // Border
      ctx.strokeStyle = isBull ? "#00f5c8" : "#ff2d6a";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - cw / 2, bodyTop, cw, bodyH);
    });

    // Time labels
    const step = Math.max(1, Math.floor(candles.length / 6));
    candles.forEach((candle, i) => {
      if (i % step === 0) {
        const x = candleX(i, w);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = "10px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(candle.time, x, h - 8);
      }
    });
  }, [
    candles, correctZones, showCorrect, drawnZones,
    drawing, startY, currentY,
    toPixelY, candleWidth, candleX, maxPrice, minPrice,
  ]);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setWidth(w);
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    draw();
  }, [width, height, draw]);

  const getY = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return e.clientY - rect.top;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    const y = getY(e);
    setDrawing(true);
    setStartY(y);
    setCurrentY(y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || mode !== "draw") return;
    setCurrentY(getY(e));
  };

  const handleMouseUp = () => {
    if (!drawing || mode !== "draw") return;
    setDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const h = canvas.height;
    const price1 = toPrice(startY, h);
    const price2 = toPrice(currentY, h);
    if (Math.abs(price1 - price2) > (maxPrice - minPrice) * 0.005) {
      onZoneDrawn?.({
        id: Date.now().toString(),
        y1: Math.max(price1, price2),
        y2: Math.min(price1, price2),
        startX: 0,
        endX: width,
      });
    }
  };

  return (
    <div ref={containerRef} className="w-full" style={{ cursor: mode === "draw" ? "crosshair" : "default" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ display: "block", width: "100%", height }}
      />
    </div>
  );
}
