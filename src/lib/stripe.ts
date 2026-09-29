import Stripe from "stripe";

let stripeInstance: Stripe | undefined;

function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Configure it in Vercel project environment variables."
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    return Reflect.get(getStripe(), property, receiver);
  },
});
