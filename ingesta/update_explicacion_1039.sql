-- UPDATE preguntas.explicacion/explicacion_calidad para id 1039 (omeprazol)
-- Excluida del lote de 19 anterior a la espera de verificación manual del punto de
-- protonación marcado en la imagen (posición D = nitrógeno imínico del benzimidazol,
-- confirmado visualmente) -- ahora incorporada con el mismo patrón vision_ok.

BEGIN;

DO $$
DECLARE
  estado_antes record;
BEGIN
  SELECT explicacion IS NULL AS sin_explicacion, explicacion_calidad INTO estado_antes
    FROM public.preguntas WHERE id = 1039;
  IF NOT estado_antes.sin_explicacion OR estado_antes.explicacion_calidad IS DISTINCT FROM 'sin_imagen' THEN
    RAISE EXCEPTION 'Estado inesperado en id 1039 antes del UPDATE (explicacion no nula o calidad != sin_imagen) -- abortando.';
  END IF;
END $$;

UPDATE public.preguntas
SET explicacion = 'La imagen presenta la estructura química del omeprazol, un profármaco derivado de la benzimidazol, señalando cuatro posiciones atómicas específicas. La activación de este fármaco se inicia en el entorno ácido del canalículo secretor de la célula parietal mediante la protonación del nitrógeno imínico del anillo de benzimidazol (posición D), que es la opción correcta, evento que desencadena una reorganización molecular para generar un intermedio sulfenamida reactivo que inhibe irreversiblemente la H+/K+-ATPasa. Las opciones A, B y C son incorrectas porque la protonación del nitrógeno piridínico (A) o del nitrógeno amina del anillo (B) no constituye el paso limitante de la activación, y el oxígeno del grupo metoxi (C) carece de la basicidad necesaria para iniciar este proceso en las condiciones fisiológicas descritas.',
    explicacion_calidad = 'vision_ok'
WHERE id = 1039;

DO $$
DECLARE
  estado_despues record;
BEGIN
  SELECT explicacion IS NOT NULL AS con_explicacion, explicacion_calidad INTO estado_despues
    FROM public.preguntas WHERE id = 1039;
  IF NOT estado_despues.con_explicacion OR estado_despues.explicacion_calidad IS DISTINCT FROM 'vision_ok' THEN
    RAISE EXCEPTION 'id 1039 no quedó con explicacion + vision_ok tras el UPDATE -- abortando.';
  END IF;
  RAISE NOTICE 'OK: id 1039 actualizada con vision_ok.';
END $$;

COMMIT;
