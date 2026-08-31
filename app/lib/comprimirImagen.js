const LADO_MAXIMO = 200;
const CALIDAD_JPEG = 0.8;

// Redimensiona a un cuadro máximo de 200x200 (manteniendo proporción) y
// reexporta como JPEG antes de subir, para que el archivo pese ~15-30KB
// independientemente del tamaño original de la foto elegida.
export function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > height) {
        if (width > LADO_MAXIMO) {
          height = Math.round((height * LADO_MAXIMO) / width);
          width = LADO_MAXIMO;
        }
      } else if (height > LADO_MAXIMO) {
        width = Math.round((width * LADO_MAXIMO) / height);
        height = LADO_MAXIMO;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("No se ha podido comprimir la imagen."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        CALIDAD_JPEG
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se ha podido leer la imagen."));
    };

    img.src = url;
  });
}
