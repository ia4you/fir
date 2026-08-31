import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import DisclaimerBanner from "./components/DisclaimerBanner";
import VisitaTracker from "./components/VisitaTracker";
import Providers from "./providers";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://pir.turel.es"),
  title: "PIR Turel",
  description: "Practica el examen PIR con preguntas reales de convocatorias anteriores.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PIR Turel",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

// Se ejecuta antes de hidratar React para fijar la clase "dark" sin parpadeo
// (flash of wrong theme). Clave duplicada de CLAVE_TEMA en app/lib/preferencias.js.
const SCRIPT_TEMA = `
(function () {
  try {
    var t = localStorage.getItem("mir_tema");
    var oscuro = t === "oscuro" || (t !== "claro" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", oscuro);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-surface text-ink`}>
        <Providers>
          {children}
          <ServiceWorkerRegister />
          <DisclaimerBanner />
          <VisitaTracker />
        </Providers>
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
