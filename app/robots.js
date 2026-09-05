export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/inicio",
        "/configuracion",
        "/test",
        "/resultados",
        "/estadisticas",
        "/perfil",
        "/admin",
        "/api",
      ],
    },
    sitemap: "https://fir.turel.es/sitemap.xml",
  };
}
