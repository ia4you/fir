/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Rebrand 2026-09: verde esmeralda + teal como acento (antes
        // violeta/morado + teal). surface/track/ink/panel/brand.light
        // están atados a variables CSS (ver globals.css) para poder tener
        // modo oscuro; brand.DEFAULT/dark/accent quedan fijos a propósito,
        // son iguales en ambos modos.
        brand: {
          DEFAULT: "#047857", // botones primarios, acentos, nav activo (emerald-700, 5.5:1 con texto blanco, AA)
          light: "var(--brand-light)", // tarjeta "días seguidos", opción seleccionada
          dark: "#065f46", // hover/estados pulsados (emerald-800, 7.7:1 con texto blanco, AAA)
          accent: "#14b8a6", // iconos/decorativo grande sin texto encima (teal-500)
        },
        surface: "var(--surface)", // fondo de página
        card: "var(--card)", // tarjetas y superficies elevadas (antes bg-white)
        track: "var(--track)", // pista gris de barras de progreso
        ink: {
          DEFAULT: "var(--ink)", // texto principal
          muted: "var(--ink-muted)", // texto secundario ("Hola,", labels)
        },
        success: {
          DEFAULT: "#22c55e", // barras de progreso altas, aciertos (green-500)
          bg: "#dcfce7",
          border: "#86efac",
          text: "#166534",
        },
        danger: {
          DEFAULT: "#CB4644", // barras de progreso bajas, incorrecto
          bg: "#FFE6E3",
          border: "#DE8A89",
          text: "#972527",
        },
        warning: {
          DEFAULT: "#f59e0b", // barras de progreso medias (amber-500)
          bg: "#fef3c7", // badge "explicación orientativa"
          border: "#fcd34d",
          text: "#92400e",
        },
        badge: {
          bg: "#f1f5f9", // etiqueta de tema en la pregunta (slate-100, neutro)
          text: "#334155", // slate-700
        },
        panel: "var(--panel)", // caja de explicación en la corrección
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
