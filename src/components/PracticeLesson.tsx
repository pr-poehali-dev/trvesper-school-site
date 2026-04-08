import { useState } from "react";
import CandleChart, { Candle, Zone, DrawnZone } from "./CandleChart";
import Icon from "@/components/ui/icon";

interface Lesson {
  id: number;
  title: string;
  description: string;
  task: string;
  hint: string;
  candles: Candle[];
  correctZones: Zone[];
  explanation: string;
}

interface PracticeLessonProps {
  lesson: Lesson;
  onComplete: (score: number) => void;
  onBack: () => void;
}

function checkZoneMatch(drawn: DrawnZone, correct: Zone, tolerance: number): boolean {
  const overlap = Math.min(drawn.y1, correct.y1) - Math.max(drawn.y2, correct.y2);
  const correctHeight = correct.y1 - correct.y2;
  return overlap > 0 && overlap / correctHeight > tolerance;
}

export default function PracticeLesson({ lesson, onComplete, onBack }: PracticeLessonProps) {
  const [drawnZones, setDrawnZones] = useState<DrawnZone[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ zone: Zone; hit: boolean }[]>([]);
  const [showHint, setShowHint] = useState(false);

  const handleZoneDrawn = (zone: DrawnZone) => {
    if (checked) return;
    setDrawnZones((prev) => [...prev, zone]);
  };

  const handleCheck = () => {
    if (drawnZones.length === 0) return;

    const TOLERANCE = 0.35;
    const zoneResults = lesson.correctZones.map((correct) => {
      const hit = drawnZones.some((drawn) => checkZoneMatch(drawn, correct, TOLERANCE));
      return { zone: correct, hit };
    });

    const hitCount = zoneResults.filter((r) => r.hit).length;
    const s = Math.round((hitCount / lesson.correctZones.length) * 100);

    setResults(zoneResults);
    setScore(s);
    setChecked(true);
  };

  const handleReset = () => {
    setDrawnZones([]);
    setChecked(false);
    setScore(0);
    setResults([]);
    setShowHint(false);
  };

  const correctZonesWithMark = lesson.correctZones.map((z, i) => ({
    ...z,
    correct: results[i]?.hit ?? false,
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)", fontFamily: "'Rubik', sans-serif" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(8,14,26,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,245,255,0.1)",
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Icon name="ArrowLeft" size={16} />
          К урокам
        </button>
        <span
          className="text-sm font-bold"
          style={{ fontFamily: "'Oswald', sans-serif", color: "var(--neon-cyan)", letterSpacing: "0.05em" }}
        >
          {lesson.title}
        </span>
        <div
          className="text-xs px-3 py-1 rounded-full"
          style={{
            background: "rgba(0,245,255,0.08)",
            color: "var(--neon-cyan)",
            border: "1px solid rgba(0,245,255,0.2)",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Урок {lesson.id}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Task block */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{
            background: "var(--dark-card)",
            border: "1px solid rgba(0,245,255,0.12)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div
                className="text-xs mb-1"
                style={{ color: "var(--neon-pink)", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {"// задание"}
              </div>
              <p className="text-base font-medium mb-1" style={{ color: "white" }}>
                {lesson.task}
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {lesson.description}
              </p>
            </div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all flex-shrink-0"
              style={{
                background: showHint ? "rgba(255,200,0,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${showHint ? "rgba(255,200,0,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: showHint ? "#ffc800" : "rgba(255,255,255,0.4)",
              }}
            >
              <Icon name="Lightbulb" size={14} />
              Подсказка
            </button>
          </div>

          {showHint && (
            <div
              className="mt-4 p-3 rounded-lg text-sm"
              style={{
                background: "rgba(255,200,0,0.06)",
                border: "1px solid rgba(255,200,0,0.2)",
                color: "rgba(255,200,0,0.9)",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              💡 {lesson.hint}
            </div>
          )}
        </div>

        {/* Instructions */}
        {!checked && (
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-2 mb-4 text-xs"
            style={{
              background: "rgba(170,255,0,0.05)",
              border: "1px solid rgba(170,255,0,0.15)",
              color: "rgba(170,255,0,0.7)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <Icon name="MousePointer" size={14} />
            Зажмите мышь и протяните по вертикали, чтобы выделить зону на графике
          </div>
        )}

        {/* Chart */}
        <div
          className="rounded-xl overflow-hidden mb-5"
          style={{ border: "1px solid rgba(0,245,255,0.12)" }}
        >
          <CandleChart
            candles={lesson.candles}
            correctZones={correctZonesWithMark}
            showCorrect={checked}
            drawnZones={drawnZones}
            onZoneDrawn={handleZoneDrawn}
            mode={checked ? "view" : "draw"}
            height={420}
          />
        </div>

        {/* Zones drawn */}
        {drawnZones.length > 0 && !checked && (
          <div className="flex flex-wrap gap-2 mb-5">
            {drawnZones.map((z, i) => (
              <div
                key={z.id}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                style={{
                  background: "rgba(170,255,0,0.08)",
                  border: "1px solid rgba(170,255,0,0.25)",
                  color: "rgba(170,255,0,0.9)",
                }}
              >
                <span>Зона {i + 1}: {z.y1.toFixed(0)} – {z.y2.toFixed(0)}</span>
                <button
                  onClick={() => setDrawnZones((prev) => prev.filter((d) => d.id !== z.id))}
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {checked && (
          <div
            className="rounded-xl p-6 mb-5"
            style={{
              background: score >= 70 ? "rgba(0,245,255,0.05)" : "rgba(255,45,155,0.05)",
              border: `1px solid ${score >= 70 ? "rgba(0,245,255,0.2)" : "rgba(255,45,155,0.2)"}`,
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{
                  background: score >= 70 ? "rgba(0,245,255,0.12)" : "rgba(255,45,155,0.12)",
                  color: score >= 70 ? "var(--neon-cyan)" : "var(--neon-pink)",
                  fontFamily: "'Oswald', sans-serif",
                  border: `2px solid ${score >= 70 ? "rgba(0,245,255,0.3)" : "rgba(255,45,155,0.3)"}`,
                }}
              >
                {score}%
              </div>
              <div>
                <div
                  className="text-lg font-bold mb-1"
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    color: score >= 70 ? "var(--neon-cyan)" : "var(--neon-pink)",
                  }}
                >
                  {score >= 80 ? "Отлично! Верно размечено" : score >= 50 ? "Неплохо, но есть ошибки" : "Нужно поработать над разметкой"}
                </div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {results.filter((r) => r.hit).length} из {lesson.correctZones.length} зон найдено правильно
                </div>
              </div>
            </div>

            {/* Zone-by-zone results */}
            <div className="space-y-2 mb-5">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{
                    background: r.hit ? "rgba(0,245,255,0.05)" : "rgba(255,45,155,0.05)",
                    border: `1px solid ${r.hit ? "rgba(0,245,255,0.15)" : "rgba(255,45,155,0.15)"}`,
                  }}
                >
                  <Icon
                    name={r.hit ? "CheckCircle" : "XCircle"}
                    size={18}
                    style={{ color: r.hit ? "var(--neon-cyan)" : "var(--neon-pink)", flexShrink: 0 }}
                  />
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: r.hit ? "var(--neon-cyan)" : "var(--neon-pink)" }}
                    >
                      {r.zone.label}
                    </span>
                    <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {r.zone.y2.toFixed(0)} – {r.zone.y1.toFixed(0)}
                    </span>
                  </div>
                  {!r.hit && (
                    <span className="text-xs ml-auto" style={{ color: "rgba(255,45,155,0.7)" }}>
                      не попал в зону
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div
              className="p-4 rounded-lg text-sm leading-relaxed"
              style={{
                background: "rgba(0,0,0,0.3)",
                color: "rgba(255,255,255,0.6)",
                borderLeft: "3px solid rgba(0,245,255,0.4)",
              }}
            >
              <span style={{ color: "var(--neon-cyan)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                // разбор
              </span>
              <p className="mt-1">{lesson.explanation}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!checked ? (
            <>
              <button
                onClick={handleCheck}
                disabled={drawnZones.length === 0}
                className="flex-1 py-4 font-bold rounded-xl text-sm transition-all duration-200"
                style={{
                  background:
                    drawnZones.length > 0
                      ? "linear-gradient(135deg, var(--neon-cyan), #0088aa)"
                      : "rgba(255,255,255,0.05)",
                  color: drawnZones.length > 0 ? "#000" : "rgba(255,255,255,0.2)",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.08em",
                  boxShadow: drawnZones.length > 0 ? "0 0 20px rgba(0,245,255,0.25)" : "none",
                  cursor: drawnZones.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                ПРОВЕРИТЬ РАЗМЕТКУ
              </button>
              {drawnZones.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-5 py-4 rounded-xl text-sm transition-all"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  <Icon name="RotateCcw" size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="px-6 py-4 rounded-xl font-bold text-sm transition-all"
                style={{
                  border: "1px solid rgba(0,245,255,0.3)",
                  color: "var(--neon-cyan)",
                  background: "rgba(0,245,255,0.05)",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.08em",
                }}
              >
                ПОПРОБОВАТЬ СНОВА
              </button>
              <button
                onClick={() => onComplete(score)}
                className="flex-1 py-4 font-bold rounded-xl text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-pink))",
                  color: "#000",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.08em",
                  boxShadow: "0 0 20px rgba(0,245,255,0.25)",
                }}
              >
                СЛЕДУЮЩИЙ УРОК →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
