// stripe_setup_producto.mjs
// -------------------------------
// Crea el producto "FIR Turel Premium" y su precio recurrente de 9,99€/mes
// en Stripe (modo test o live según la clave usada). Idempotente: si ya
// existe un producto con ese nombre activo, reutiliza el primero que
// encuentre en vez de duplicarlo.
//
// Uso:
//   node --env-file=.env.local scripts/stripe_setup_producto.mjs

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const NOMBRE_PRODUCTO = "FIR Turel Premium";

async function main() {
  const existentes = await stripe.products.search({
    query: `name:"${NOMBRE_PRODUCTO}" AND active:"true"`,
  });

  let producto = existentes.data[0];
  if (producto) {
    console.log(`Producto ya existe: ${producto.id}`);
  } else {
    producto = await stripe.products.create({
      name: NOMBRE_PRODUCTO,
      description: "Preguntas FIR ilimitadas, simulacros completos y acceso sin límite diario.",
    });
    console.log(`Producto creado: ${producto.id}`);
  }

  const precios = await stripe.prices.list({ product: producto.id, active: true });
  let precio = precios.data.find(
    (p) => p.unit_amount === 999 && p.currency === "eur" && p.recurring?.interval === "month"
  );

  if (precio) {
    console.log(`Precio ya existe: ${precio.id}`);
  } else {
    precio = await stripe.prices.create({
      product: producto.id,
      unit_amount: 999,
      currency: "eur",
      recurring: { interval: "month" },
    });
    console.log(`Precio creado: ${precio.id}`);
  }

  console.log("\nSTRIPE_PRICE_ID=" + precio.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
