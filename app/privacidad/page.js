import Link from "next/link";
import Footer from "../components/Footer";

export const metadata = {
  title: "Política de Privacidad — PIR Turel",
  description:
    "Política de privacidad de PIR Turel: qué datos recogemos (email, nombre, progreso de estudio), para qué los usamos, con quién los compartimos y cómo eliminar tu cuenta.",
  alternates: { canonical: "https://pir.turel.es/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-surface px-5 py-10 pb-32 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-brand">
          ← Volver a inicio
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          Política de Privacidad
        </h1>
        <p className="mt-3 text-sm text-ink-muted">Última actualización: 31 de agosto de 2026</p>

        <div className="mt-8 flex flex-col gap-8 text-ink-muted">
          <section>
            <h2 className="text-lg font-bold text-ink">Responsable del tratamiento</h2>
            <p className="mt-2">
              PIR Turel (pir.turel.es) es una plataforma operada por José. Para cualquier
              cuestión sobre esta política o sobre tus datos personales, puedes escribir a{" "}
              <a href="mailto:jose@turel.es" className="font-semibold text-brand">
                jose@turel.es
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Qué datos recogemos</h2>
            <ul className="mt-2 flex flex-col gap-3">
              <li>
                <span className="font-semibold text-ink">Datos de cuenta:</span> nombre, email y
                contraseña (almacenada cifrada) al registrarte.
              </li>
              <li>
                <span className="font-semibold text-ink">Progreso de estudio:</span> las
                preguntas que respondes, tus aciertos y fallos, el tiempo por sesión y tus
                estadísticas por tema.
              </li>
              <li>
                <span className="font-semibold text-ink">Foto de perfil:</span> si decides subir
                un avatar, de forma opcional.
              </li>
              <li>
                <span className="font-semibold text-ink">Datos de pago:</span> si contratas el
                plan Premium, tu email se comparte con Stripe para procesar el cobro. PIR Turel
                no almacena en ningún momento los datos de tu tarjeta.
              </li>
              <li>
                <span className="font-semibold text-ink">Notificaciones push:</span> si activas
                los recordatorios, guardamos el identificador técnico de tu dispositivo o
                navegador necesario para enviártelos.
              </li>
              <li>
                <span className="font-semibold text-ink">Datos de uso:</span> visitas a la app y
                estadísticas de uso agregadas, en parte a través de Google Analytics.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Para qué usamos tus datos</h2>
            <p className="mt-2">Usamos estos datos únicamente para:</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li>Crear y gestionar tu cuenta, y permitirte iniciar sesión.</li>
              <li>
                Guardar tu progreso y mostrarte tus estadísticas, puntos débiles y racha de días.
              </li>
              <li>Procesar el pago y la gestión de tu suscripción Premium, si la contratas.</li>
              <li>Enviarte recordatorios push, solo si los activas tú mismo.</li>
              <li>Entender cómo se usa la app para poder mejorarla.</li>
              <li>Responder a tus solicitudes de contacto o soporte.</li>
            </ul>
            <p className="mt-2">
              No usamos tus datos para publicidad ni los vendemos a terceros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Con quién compartimos tus datos</h2>
            <p className="mt-2">
              No compartimos tus datos personales con terceros salvo los proveedores
              estrictamente necesarios para operar el servicio:
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li>
                <span className="font-semibold text-ink">Stripe</span> — procesa los pagos del
                plan Premium. Recibe tu email y los datos de tu tarjeta directamente; PIR Turel
                nunca ve ni guarda el número de tu tarjeta.
              </li>
              <li>
                <span className="font-semibold text-ink">Google Analytics</span> — nos ayuda a
                entender el uso agregado de la app de forma anónima.
              </li>
              <li>
                <span className="font-semibold text-ink">Nuestro proveedor de hosting</span> —
                aloja la base de datos y el servidor de la aplicación.
              </li>
            </ul>
            <p className="mt-2">
              Ninguno de estos proveedores puede usar tus datos con fines distintos a prestarnos
              su servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Cuánto tiempo conservamos tus datos</h2>
            <p className="mt-2">
              Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, tus
              datos personales, tu historial de tests y tus respuestas se borran de forma
              permanente, salvo la información que estemos obligados a conservar por ley (por
              ejemplo, facturación).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">
              Tus derechos y cómo eliminar tu cuenta
            </h2>
            <p className="mt-2">
              Tienes derecho a acceder, rectificar, eliminar y portar tus datos, así como a
              oponerte u oponerte a su tratamiento, conforme al RGPD. Puedes ejercerlos en
              cualquier momento:
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li>
                Desde la app: en{" "}
                <span className="font-semibold text-ink">Perfil → Eliminar mi cuenta</span>,
                que borra tu cuenta, historial y respuestas de forma inmediata.
              </li>
              <li>
                Sin acceso a tu cuenta:{" "}
                <Link href="/eliminar-cuenta" className="font-semibold text-brand">
                  solicita la eliminación aquí
                </Link>{" "}
                indicando el email con el que te registraste.
              </li>
              <li>
                Para cualquier otro derecho (acceso, rectificación, portabilidad), escríbenos a{" "}
                <a href="mailto:jose@turel.es" className="font-semibold text-brand">
                  jose@turel.es
                </a>
                .
              </li>
            </ul>
            <p className="mt-2">
              Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar
              ante la{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand"
              >
                Agencia Española de Protección de Datos (AEPD)
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Seguridad</h2>
            <p className="mt-2">
              Aplicamos medidas técnicas razonables para proteger tus datos, incluyendo el
              cifrado de contraseñas y conexiones seguras (HTTPS). Ningún sistema es
              completamente infalible, pero nos tomamos en serio la protección de tu
              información.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Cambios en esta política</h2>
            <p className="mt-2">
              Podemos actualizar esta política de privacidad para reflejar cambios en el
              servicio o en la normativa aplicable. Publicaremos cualquier cambio relevante en
              esta misma página junto con la fecha de última actualización.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Contacto</h2>
            <p className="mt-2">
              Para cualquier duda sobre esta política o sobre tus datos personales, escríbenos a{" "}
              <a href="mailto:jose@turel.es" className="font-semibold text-brand">
                jose@turel.es
              </a>{" "}
              o a través de nuestro{" "}
              <Link href="/contacto" className="font-semibold text-brand">
                formulario de contacto
              </Link>
              .
            </p>
          </section>
        </div>

        <Link href="/" className="mt-10 block text-center text-sm font-semibold text-ink-muted">
          ← Volver a la página principal
        </Link>
      </div>
      <Footer />
    </div>
  );
}
