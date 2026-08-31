import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const cuerpo = await request.text();
  const firma = request.headers.get("stripe-signature");

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(cuerpo, firma, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Firma de webhook inválida:", err.message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sesion = event.data.object;
        const userId = sesion.metadata?.userId;
        if (userId) {
          await query(
            `UPDATE usuarios
             SET plan = 'premium', stripe_customer_id = $1, stripe_subscription_id = $2
             WHERE id = $3`,
            [sesion.customer, sesion.subscription, userId]
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const suscripcion = event.data.object;
        await query(`UPDATE usuarios SET plan = 'free' WHERE stripe_subscription_id = $1`, [
          suscripcion.id,
        ]);
        break;
      }

      case "customer.subscription.updated": {
        const suscripcion = event.data.object;
        const nuevoPlan =
          suscripcion.status === "active"
            ? "premium"
            : suscripcion.status === "canceled" || suscripcion.status === "past_due"
              ? "free"
              : null;
        if (nuevoPlan) {
          await query(`UPDATE usuarios SET plan = $1 WHERE stripe_subscription_id = $2`, [
            nuevoPlan,
            suscripcion.id,
          ]);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Error procesando webhook ${event.type}:`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
