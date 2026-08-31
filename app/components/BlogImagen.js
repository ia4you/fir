// Imagen de post con fallback a un placeholder de marca cuando no hay ninguna
// imagen disponible (ni portada ni imagen incrustada en el contenido).
export default function BlogImagen({ src, alt = "", className = "" }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-brand-light text-brand ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5.5c2-1 5-1 8 0v14c-3-1-6-1-8 0v-14Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 5.5c-2-1-5-1-8 0v14c3-1 6-1 8 0v-14Z"
          />
        </svg>
      </div>
    );
  }
  // Las imágenes de blog vienen de una ruta dinámica propia (ver
  // app/api/blog/uploads/[archivo]/route.js), no de /public: usamos <img>
  // normal en vez de next/image para evitar la capa de optimización de Next,
  // innecesaria aquí (el endpoint ya sirve con caché inmutable) y evitar
  // sorpresas con el tamaño variable de las imágenes subidas por el admin.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}
