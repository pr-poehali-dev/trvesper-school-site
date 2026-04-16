import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PracticeLesson from "@/components/PracticeLesson";
import { PRACTICE_LESSONS, LessonData } from "@/data/lessons";

const COURSES = [
  {
    id: 1,
    title: "Основы Python для трейдинга",
    level: "Начинающий",
    lessons: 12,
    duration: "6 часов",
    color: "cyan",
    icon: "Code2",
    modules: [
      { name: "Введение в Python", done: true },
      { name: "Переменные и типы данных", done: true },
      { name: "Функции и циклы", done: false },
      { name: "Работа с API бирж", done: false },
    ],
  },
  {
    id: 2,
    title: "Алготрейдинг с нуля",
    level: "Средний",
    lessons: 18,
    duration: "10 часов",
    color: "pink",
    icon: "TrendingUp",
    modules: [
      { name: "Свечные паттерны", done: false },
      { name: "Индикаторы RSI, MACD", done: false },
      { name: "Написание торгового бота", done: false },
      { name: "Бэктестинг стратегий", done: false },
    ],
  },
  {
    id: 3,
    title: "Технический анализ",
    level: "Продвинутый",
    lessons: 24,
    duration: "15 часов",
    color: "green",
    icon: "BarChart3",
    modules: [
      { name: "Уровни поддержки и сопротивления", done: false },
      { name: "Паттерны разворота", done: false },
      { name: "Волновой анализ Эллиота", done: false },
      { name: "Составление торгового плана", done: false },
    ],
  },
];

const LESSONS = [
  { id: 1, title: "Что такое свеча и как её читать", duration: "22 мин", done: true, module: "Модуль 1" },
  { id: 2, title: "Бычий и медвежий рынок", duration: "18 мин", done: true, module: "Модуль 1" },
  { id: 3, title: "Установка Python и первый скрипт", duration: "35 мин", done: false, module: "Модуль 2" },
  { id: 4, title: "Подключение к Binance API", duration: "28 мин", done: false, module: "Модуль 2" },
  { id: 5, title: "Создание простой торговой стратегии", duration: "42 мин", done: false, module: "Модуль 3" },
];

const STATS = [
  { label: "Учеников", value: "1 240+", icon: "Users" },
  { label: "Уроков", value: "120+", icon: "PlayCircle" },
  { label: "Курсов", value: "8", icon: "BookOpen" },
  { label: "Сертификатов выдано", value: "430+", icon: "Award" },
];

const SECTIONS = ["Главная", "О школе", "Уроки", "Курсы", "Контакты"];

export default function Index() {
  const [activeSection, setActiveSection] = useState("Главная");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(COURSES[0]);
  const navigate = useNavigate();
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<number, number>>({});

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setMenuOpen(false);
  };

  const handleLessonComplete = (lessonId: number, score: number) => {
    setLessonProgress((prev) => ({ ...prev, [lessonId]: score }));
    const currentIndex = PRACTICE_LESSONS.findIndex((l) => l.id === lessonId);
    const next = PRACTICE_LESSONS[currentIndex + 1];
    if (next) setActiveLesson(next);
    else setActiveLesson(null);
  };

  const totalDone = activeCourse.modules.filter((m) => m.done).length;
  const progress = Math.round((totalDone / activeCourse.modules.length) * 100);

  if (activeLesson) {
    return (
      <PracticeLesson
        lesson={activeLesson}
        onBack={() => setActiveLesson(null)}
        onComplete={(score) => handleLessonComplete(activeLesson.id, score)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)", fontFamily: "'Rubik', sans-serif" }}>
      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(8, 14, 26, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0, 245, 255, 0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-bold tracking-wider"
            style={{
              fontFamily: "'Oswald', sans-serif",
              color: "var(--neon-cyan)",
              textShadow: "0 0 10px rgba(0,245,255,0.5)",
            }}
          >
            TrVesper
          </span>
          <span
            className="text-xs hidden sm:block"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            // трейдинг & код
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="text-sm font-medium transition-all duration-200"
              style={{
                color: activeSection === s ? "var(--neon-cyan)" : "rgba(255,255,255,0.6)",
                textShadow: activeSection === s ? "0 0 8px rgba(0,245,255,0.5)" : "none",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => navigate("/journal")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-all duration-200"
            style={{
              background: "rgba(170,255,0,0.08)",
              border: "1px solid rgba(170,255,0,0.2)",
              color: "rgba(170,255,0,0.9)",
            }}
          >
            <Icon name="BookOpen" size={15} />
            Журнал
          </button>
          <button
            onClick={() => scrollTo("Курсы")}
            className="px-5 py-2 text-sm font-semibold rounded transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, var(--neon-cyan), #0099bb)",
              color: "#000",
              boxShadow: "0 0 15px rgba(0,245,255,0.3)",
            }}
          >
            Начать учиться
          </button>
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? "X" : "Menu"} size={24} style={{ color: "var(--neon-cyan)" }} />
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 pt-20 px-6 flex flex-col gap-4"
          style={{ background: "rgba(8,14,26,0.98)" }}
        >
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="text-left text-xl font-medium py-3 border-b"
              style={{
                color: "var(--neon-cyan)",
                borderColor: "rgba(0,245,255,0.1)",
                fontFamily: "'Oswald', sans-serif",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* HERO */}
      <section
        id="Главная"
        className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg"
        style={{ paddingTop: "80px" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(https://cdn.poehali.dev/projects/c6dfba1a-3e55-40bd-a9a5-3e95f7f437d4/files/e41da9d8-cddc-4999-8891-56ab948d3ef9.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.2,
          }}
        />

        <div
          className="color-blob"
          style={{ width: 500, height: 500, background: "var(--neon-pink)", top: "10%", right: "5%" }}
        />
        <div
          className="color-blob"
          style={{ width: 400, height: 400, background: "var(--neon-cyan)", bottom: "10%", left: "5%" }}
        />
        <div
          className="color-blob"
          style={{ width: 300, height: 300, background: "var(--neon-green)", top: "50%", left: "40%" }}
        />

        <div className="absolute right-8 top-1/4 hidden lg:flex flex-col gap-2 opacity-30 animate-candle-float">
          {[80, 120, 60, 100, 90].map((h, i) => (
            <div key={i} className="flex items-center gap-1">
              <div style={{ width: 2, height: h * 0.3, background: i % 2 === 0 ? "#ff4d4d" : "#00f5ff" }} />
              <div
                style={{
                  width: 12,
                  height: h * 0.5,
                  background: i % 2 === 0 ? "#cc2222" : "#007788",
                  border: `1px solid ${i % 2 === 0 ? "#ff4d4d" : "#00f5ff"}`,
                }}
              />
              <div style={{ width: 2, height: h * 0.2, background: i % 2 === 0 ? "#ff4d4d" : "#00f5ff" }} />
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div
            className="inline-block px-4 py-1 mb-6 text-xs font-medium rounded-full"
            style={{
              border: "1px solid rgba(0,245,255,0.4)",
              color: "var(--neon-cyan)",
              fontFamily: "'IBM Plex Mono', monospace",
              background: "rgba(0,245,255,0.05)",
            }}
          >
            {"// ESTABLISHED BY ANDREY LITVINOV"}
          </div>

          <h1
            className="text-6xl md:text-8xl font-bold mb-4 animate-fade-in-up"
            style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.05em" }}
          >
            <span style={{ color: "white" }}>Tr</span>
            <span
              style={{
                color: "var(--neon-cyan)",
                textShadow: "0 0 20px rgba(0,245,255,0.6), 0 0 60px rgba(0,245,255,0.2)",
              }}
            >
              Vesper
            </span>
          </h1>

          <p
            className="text-xl md:text-2xl mb-4 animate-fade-in-up delay-200"
            style={{
              fontFamily: "'Oswald', sans-serif",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Программирование и Трейдинг
          </p>

          <p
            className="text-base md:text-lg mb-10 animate-fade-in-up delay-300 max-w-2xl mx-auto"
            style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}
          >
            Научись создавать торговых ботов, читать графики и понимать рынок.
            От первого скрипта до рабочей торговой системы.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
            <button
              onClick={() => scrollTo("Курсы")}
              className="px-8 py-4 text-base font-bold rounded transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, var(--neon-cyan), #0088aa)",
                color: "#000",
                boxShadow: "0 0 30px rgba(0,245,255,0.4)",
                fontFamily: "'Oswald', sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              НАЧАТЬ ОБУЧЕНИЕ
            </button>
            <button
              onClick={() => scrollTo("О школе")}
              className="px-8 py-4 text-base font-bold rounded transition-all duration-300 hover:scale-105"
              style={{
                border: "1px solid var(--neon-pink)",
                color: "var(--neon-pink)",
                background: "rgba(255,45,155,0.05)",
                boxShadow: "0 0 15px rgba(255,45,155,0.2)",
                fontFamily: "'Oswald', sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              О ШКОЛЕ
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <Icon name="ChevronDown" size={24} style={{ color: "rgba(0,245,255,0.5)" }} />
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "rgba(0,245,255,0.03)", borderTop: "1px solid rgba(0,245,255,0.1)", borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon name={stat.icon} size={24} style={{ color: "var(--neon-cyan)" }} />
                </div>
                <div
                  className="text-3xl font-bold mb-1"
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    color: "var(--neon-cyan)",
                    textShadow: "0 0 10px rgba(0,245,255,0.4)",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="О школе" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="text-xs mb-4 font-medium"
                style={{ color: "var(--neon-pink)", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {"// about_school.py"}
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
              >
                О{" "}
                <span style={{ color: "var(--neon-cyan)", textShadow: "0 0 15px rgba(0,245,255,0.5)" }}>школе</span>
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
                TrVesper — это онлайн-школа, где трейдинг и программирование объединяются в единую систему.
                Мы учим не просто «нажимать кнопки», а понимать рынок изнутри и автоматизировать торговлю.
              </p>
              <p className="mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
                Основатель — <strong style={{ color: "white" }}>Андрей Литвинов</strong> — практикующий трейдер и разработчик
                с 8-летним опытом. Каждый урок основан на реальных рыночных ситуациях.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "Target", text: "Практические задания" },
                  { icon: "Bot", text: "Торговые боты" },
                  { icon: "Award", text: "Сертификаты" },
                  { icon: "MessageCircle", text: "Поддержка куратора" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.2)" }}
                    >
                      <Icon name={item.icon} size={16} style={{ color: "var(--neon-cyan)" }} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                className="rounded-2xl p-8 relative overflow-hidden"
                style={{
                  background: "var(--dark-card)",
                  border: "1px solid rgba(0,245,255,0.15)",
                  boxShadow: "0 0 40px rgba(0,245,255,0.05)",
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "var(--neon-pink)", filter: "blur(30px)" }} />

                <div
                  className="text-xs mb-6"
                  style={{ color: "var(--neon-green)", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {"> python trade_bot.py"}
                </div>

                {["Подключение к бирже... ✓", "Загрузка данных свечей... ✓", "Анализ паттернов... ✓", "Сигнал обнаружен: BUY BTC", "Размер позиции: 0.01 BTC", "Ордер выставлен успешно ✓"].map((line, i) => (
                  <div
                    key={i}
                    className="mb-2 text-sm"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: line.includes("✓")
                        ? "var(--neon-green)"
                        : line.includes("BUY")
                        ? "var(--neon-cyan)"
                        : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {line}
                  </div>
                ))}

                <div className="mt-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--neon-green)" }} />
                  <span style={{ color: "var(--neon-green)", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                    Бот активен
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LESSONS */}
      <section id="Уроки" className="py-24 px-6" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div
              className="text-xs mb-4 font-medium"
              style={{ color: "var(--neon-pink)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {"// lessons_progress.py"}
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
            >
              Уроки и{" "}
              <span style={{ color: "var(--neon-pink)", textShadow: "0 0 15px rgba(255,45,155,0.5)" }}>прогресс</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {COURSES.map((course) => (
              <div
                key={course.id}
                onClick={() => setActiveCourse(course)}
                className="p-6 rounded-xl cursor-pointer card-hover"
                style={{
                  background: activeCourse.id === course.id ? "rgba(0,245,255,0.08)" : "var(--dark-card)",
                  border: `1px solid ${
                    activeCourse.id === course.id ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.06)"
                  }`,
                  boxShadow: activeCourse.id === course.id ? "0 0 20px rgba(0,245,255,0.1)" : "none",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(0,245,255,0.1)" }}
                  >
                    <Icon name={course.icon} size={20} style={{ color: "var(--neon-cyan)" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--neon-green)", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {course.level}
                  </div>
                </div>
                <h3 className="font-semibold mb-3" style={{ color: "white", fontSize: 15 }}>
                  {course.title}
                </h3>
                <div className="flex gap-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>{course.lessons} уроков</span>
                  <span>{course.duration}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--dark-card)",
              border: "1px solid rgba(0,245,255,0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}>
                {activeCourse.title}
              </h3>
              <div
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(0,245,255,0.1)",
                  color: "var(--neon-cyan)",
                  border: "1px solid rgba(0,245,255,0.3)",
                }}
              >
                {progress}% выполнено
              </div>
            </div>

            <div className="h-2 rounded-full mb-8" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-2 rounded-full progress-bar transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {activeCourse.modules.map((mod, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{
                    background: mod.done ? "rgba(0,245,255,0.05)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${mod.done ? "rgba(0,245,255,0.2)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: mod.done ? "rgba(0,245,255,0.2)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${mod.done ? "var(--neon-cyan)" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    {mod.done ? (
                      <Icon name="Check" size={14} style={{ color: "var(--neon-cyan)" }} />
                    ) : (
                      <Icon name="Lock" size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                    )}
                  </div>
                  <span style={{ color: mod.done ? "white" : "rgba(255,255,255,0.4)", fontSize: 14 }}>
                    {mod.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h4
                className="text-sm font-semibold mb-4"
                style={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Последние уроки
              </h4>
              <div className="space-y-2">
                {LESSONS.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 rounded-lg card-hover cursor-pointer"
                    style={{
                      background: lesson.done ? "rgba(170,255,0,0.04)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${lesson.done ? "rgba(170,255,0,0.15)" : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: lesson.done ? "rgba(170,255,0,0.15)" : "rgba(0,245,255,0.1)",
                          border: `1px solid ${lesson.done ? "rgba(170,255,0,0.3)" : "rgba(0,245,255,0.2)"}`,
                        }}
                      >
                        <Icon
                          name={lesson.done ? "CheckCircle" : "PlayCircle"}
                          size={16}
                          style={{ color: lesson.done ? "var(--neon-green)" : "var(--neon-cyan)" }}
                        />
                      </div>
                      <div>
                        <div style={{ color: lesson.done ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)", fontSize: 14 }}>
                          {lesson.title}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {lesson.module}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{lesson.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PRACTICE BLOCK */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div
                  className="text-xs mb-1"
                  style={{ color: "var(--neon-green)", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {"// практика на графике"}
                </div>
                <h3
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
                >
                  Практические{" "}
                  <span style={{ color: "var(--neon-green)", textShadow: "0 0 10px rgba(170,255,0,0.4)" }}>
                    тренажёры
                  </span>
                </h3>
              </div>
              <div
                className="text-sm px-3 py-1 rounded-full"
                style={{
                  background: "rgba(170,255,0,0.08)",
                  border: "1px solid rgba(170,255,0,0.2)",
                  color: "rgba(170,255,0,0.8)",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {Object.keys(lessonProgress).length}/{PRACTICE_LESSONS.length} пройдено
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {PRACTICE_LESSONS.map((lesson) => {
                const score = lessonProgress[lesson.id];
                const done = score !== undefined;
                return (
                  <div
                    key={lesson.id}
                    className="rounded-xl p-5 card-hover cursor-pointer"
                    onClick={() => setActiveLesson(lesson)}
                    style={{
                      background: done ? "rgba(170,255,0,0.04)" : "var(--dark-card)",
                      border: `1px solid ${done ? "rgba(170,255,0,0.2)" : "rgba(255,255,255,0.07)"}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: done ? "rgba(170,255,0,0.12)" : "rgba(0,245,255,0.08)",
                            border: `1px solid ${done ? "rgba(170,255,0,0.3)" : "rgba(0,245,255,0.15)"}`,
                          }}
                        >
                          <Icon
                            name={done ? "CheckCircle" : "PenTool"}
                            size={18}
                            style={{ color: done ? "var(--neon-green)" : "var(--neon-cyan)" }}
                          />
                        </div>
                        <div>
                          <div
                            className="text-xs mb-0.5"
                            style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            Урок {lesson.id}
                          </div>
                          <div className="font-semibold text-sm" style={{ color: "white" }}>
                            {lesson.title}
                          </div>
                        </div>
                      </div>
                      {done && (
                        <div
                          className="text-sm font-bold px-3 py-1 rounded-full flex-shrink-0"
                          style={{
                            background: score >= 70 ? "rgba(0,245,255,0.1)" : "rgba(255,45,155,0.1)",
                            color: score >= 70 ? "var(--neon-cyan)" : "var(--neon-pink)",
                            border: `1px solid ${score >= 70 ? "rgba(0,245,255,0.2)" : "rgba(255,45,155,0.2)"}`,
                            fontFamily: "'Oswald', sans-serif",
                          }}
                        >
                          {score}%
                        </div>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {lesson.description}
                    </p>
                    <div
                      className="flex items-center gap-2 text-xs font-medium"
                      style={{
                        color: done ? "rgba(170,255,0,0.7)" : "var(--neon-cyan)",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      <Icon name={done ? "RotateCcw" : "Play"} size={12} />
                      {done ? "Пройти снова" : "Начать практику"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section id="Курсы" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div
              className="text-xs mb-4 font-medium"
              style={{ color: "var(--neon-green)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {"// all_courses.py"}
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
            >
              Все{" "}
              <span style={{ color: "var(--neon-green)", textShadow: "0 0 15px rgba(170,255,0,0.5)" }}>курсы</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
              От азов программирования до полноценных торговых роботов
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {COURSES.map((course) => {
              const colors = {
                cyan: { main: "var(--neon-cyan)", bg: "rgba(0,245,255,0.08)", border: "rgba(0,245,255,0.2)" },
                pink: { main: "var(--neon-pink)", bg: "rgba(255,45,155,0.08)", border: "rgba(255,45,155,0.2)" },
                green: { main: "var(--neon-green)", bg: "rgba(170,255,0,0.08)", border: "rgba(170,255,0,0.2)" },
              };
              const c = colors[course.color as keyof typeof colors];
              return (
                <div
                  key={course.id}
                  className="rounded-2xl p-7 card-hover"
                  style={{
                    background: "var(--dark-card)",
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}
                  >
                    <Icon name={course.icon} size={26} style={{ color: c.main }} />
                  </div>

                  <div
                    className="text-xs mb-2 font-medium"
                    style={{ color: c.main, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {course.level}
                  </div>

                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
                  >
                    {course.title}
                  </h3>

                  <div className="flex gap-4 mb-6 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span className="flex items-center gap-1">
                      <Icon name="PlayCircle" size={14} />
                      {course.lessons} уроков
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={14} />
                      {course.duration}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {course.modules.map((mod, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <Icon name="ChevronRight" size={14} style={{ color: c.main }} />
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>{mod.name}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.main,
                      fontFamily: "'Oswald', sans-serif",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ЗАПИСАТЬСЯ
                  </button>
                </div>
              );
            })}
          </div>

          {/* Certificate */}
          <div
            className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(0,245,255,0.05), rgba(255,45,155,0.05))",
              border: "1px solid rgba(0,245,255,0.15)",
            }}
          >
            <div
              className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: "var(--neon-cyan)", filter: "blur(60px)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: "var(--neon-pink)", filter: "blur(60px)" }}
            />

            <div className="relative z-10">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(0,245,255,0.1)", border: "2px solid rgba(0,245,255,0.3)" }}
              >
                <Icon name="Award" size={32} style={{ color: "var(--neon-cyan)" }} />
              </div>

              <h3
                className="text-3xl font-bold mb-3"
                style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
              >
                Сертификат{" "}
                <span style={{ color: "var(--neon-cyan)" }}>TrVesper</span>
              </h3>
              <p className="mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                По завершению каждого курса вы получаете именной цифровой сертификат,
                подтверждающий ваши навыки в трейдинге и программировании.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {["Именной документ", "PDF-формат", "Уникальный номер", "Проверка онлайн"].map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                    style={{
                      background: "rgba(0,245,255,0.08)",
                      border: "1px solid rgba(0,245,255,0.2)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <Icon name="Check" size={14} style={{ color: "var(--neon-green)" }} />
                    {feat}
                  </div>
                ))}
              </div>

              <button
                className="px-8 py-4 font-bold rounded-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-pink))",
                  color: "#000",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.1em",
                  boxShadow: "0 0 30px rgba(0,245,255,0.3)",
                }}
              >
                ПРОЙТИ КУРС И ПОЛУЧИТЬ СЕРТИФИКАТ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="Контакты" className="py-24 px-6" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <div
              className="text-xs mb-4 font-medium"
              style={{ color: "var(--neon-cyan)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {"// contact.send()"}
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
            >
              Свяжитесь{" "}
              <span style={{ color: "var(--neon-cyan)", textShadow: "0 0 15px rgba(0,245,255,0.5)" }}>с нами</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { icon: "Send", label: "Telegram", value: "@trvesper", color: "var(--neon-cyan)" },
                { icon: "Youtube", label: "YouTube", value: "TrVesper Channel", color: "var(--neon-pink)" },
                { icon: "Mail", label: "Email", value: "info@trvesper.ru", color: "var(--neon-green)" },
              ].map((contact, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-5 rounded-xl card-hover cursor-pointer"
                  style={{
                    background: "var(--dark-card)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Icon name={contact.icon} size={22} style={{ color: contact.color }} />
                  </div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{contact.label}</div>
                    <div style={{ color: "white", fontWeight: 500 }}>{contact.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-2xl p-8"
              style={{
                background: "var(--dark-card)",
                border: "1px solid rgba(0,245,255,0.1)",
              }}
            >
              <h3
                className="text-xl font-bold mb-6"
                style={{ fontFamily: "'Oswald', sans-serif", color: "white" }}
              >
                Задать вопрос
              </h3>

              <div className="space-y-4">
                <input
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(0,245,255,0.15)",
                    color: "white",
                    fontFamily: "'Rubik', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0,245,255,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(0,245,255,0.15)")}
                />
                <input
                  placeholder="Email или Telegram"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(0,245,255,0.15)",
                    color: "white",
                    fontFamily: "'Rubik', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0,245,255,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(0,245,255,0.15)")}
                />
                <textarea
                  placeholder="Ваш вопрос"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all resize-none"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(0,245,255,0.15)",
                    color: "white",
                    fontFamily: "'Rubik', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0,245,255,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(0,245,255,0.15)")}
                />
                <button
                  className="w-full py-3 font-bold rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, var(--neon-cyan), #0088aa)",
                    color: "#000",
                    fontFamily: "'Oswald', sans-serif",
                    letterSpacing: "0.1em",
                    boxShadow: "0 0 20px rgba(0,245,255,0.3)",
                  }}
                >
                  ОТПРАВИТЬ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="py-8 px-6 text-center"
        style={{
          borderTop: "1px solid rgba(0,245,255,0.08)",
          color: "rgba(255,255,255,0.3)",
          fontSize: 13,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        <span style={{ color: "var(--neon-cyan)" }}>TrVesper</span>
        {" // "}
        Программирование и Трейдинг
        {" // "}
        Established by Andrey Litvinov
        {" // "}
        © 2024
      </footer>
    </div>
  );
}