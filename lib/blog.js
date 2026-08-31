// Imagen a mostrar para un post: la portada si existe, si no null (para
// mostrar el placeholder de BlogImagen). El contenido ya no es Markdown,
// así que no hay imágenes incrustadas de las que extraer una por defecto.
export function imagenDePost(post) {
  return post.imagen_portada || null;
}
