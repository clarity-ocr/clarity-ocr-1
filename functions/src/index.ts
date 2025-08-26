import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// ===================================================================================
// --- CONFIGURATION & INITIALIZATION ---
// ===================================================================================

const stripe = new Stripe(functions.config().stripe.secret, {
  // ✅ FIXED: Using the exact, strange version string your installed types require.
  // This is the most critical fix for the Stripe-related error.
  apiVersion: "2025-07-30.basil",
});
const adminEmail = functions.config().app.admin_email;


// ===================================================================================
// --- USER-FACING CALLABLE FUNCTIONS ---
// ===================================================================================

export const createCheckoutSession = functions.https.onCall(
  // ✅ FIXED: Using the single 'request' object signature that your library version expects.
  async (request) => {
    const data = request.data as { priceId: string; coupon?: string };
    const auth = request.auth;

    if (!auth?.uid) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    if (!request.rawRequest?.headers.origin) {
        throw new functions.https.HttpsError("internal", "Could not determine app origin.");
    }

    const successUrl = `${request.rawRequest.headers.origin}/history`;
    const cancelUrl = `${request.rawRequest.headers.origin}/pricing`;

    const checkoutOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: data.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: auth.uid },
      allow_promotion_codes: true,
    };

    if (data.coupon) {
      try {
        checkoutOptions.discounts = [{ coupon: data.coupon }];
      } catch (error) {
        console.warn("Invalid coupon code:", data.coupon);
        throw new functions.https.HttpsError("invalid-argument", "The coupon code is not valid.");
      }
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);
    return { sessionId: session.id, url: session.url };
  }
);

export const startTrial = functions.https.onCall(
    // ✅ FIXED: Using the single 'request' object signature.
    async (request) => {
      const data = request.data as { plan: 'pro' | 'business' };
      const auth = request.auth;
      
      if (!auth?.uid) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
      }
      
      const user = await admin.auth().getUser(auth.uid);
      if (user.customClaims?.stripeRole && user.customClaims.stripeRole !== 'free') {
          throw new functions.https.HttpsError("already-exists", "You already have an active plan or trial.");
      }
  
      const trialEndsAt = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);
  
      await admin.auth().setCustomUserClaims(auth.uid, {
          stripeRole: data.plan,
          trialEndsAt: trialEndsAt,
      });
  
      await db.collection("users").doc(auth.uid).set({
          stripeRole: data.plan,
          trialEndsAt: admin.firestore.Timestamp.fromMillis(trialEndsAt * 1000),
      }, { merge: true });
  
      return { success: true, message: `Trial for ${data.plan} plan started!` };
    }
  );

export const createBillingPortalSession = functions.https.onCall(
  // ✅ FIXED: Using the single 'request' object signature.
  async (request) => {
    const auth = request.auth;
    if (!auth?.uid) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    if (!request.rawRequest?.headers.origin) {
        throw new functions.https.HttpsError("internal", "Could not determine app origin.");
    }
    
    const userDoc = await db.collection("users").doc(auth.uid).get();
    const customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
        throw new functions.https.HttpsError("not-found", "Stripe customer information not found.");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${request.rawRequest.headers.origin}/pricing`,
    });
    return { url: portalSession.url };
  }
);


// ===================================================================================
// --- ADMIN-ONLY CALLABLE FUNCTIONS ---
// ===================================================================================

export const createCoupon = functions.https.onCall(
  // ✅ FIXED: Using the single 'request' object signature.
  async (request) => {
    const data = request.data as { couponId: string, percentOff: number, duration: 'once' | 'repeating' | 'forever', durationInMonths?: number };
    const auth = request.auth;

    if (auth?.token.admin !== true) {
      throw new functions.https.HttpsError("permission-denied", "Admin only.");
    }
    const { couponId, percentOff, duration, durationInMonths } = data;
    const coupon = await stripe.coupons.create({
      id: couponId,
      percent_off: percentOff,
      duration: duration,
      duration_in_months: duration === "repeating" ? durationInMonths : undefined,
    });
    return { success: true, couponId: coupon.id };
});

export const grantAdminRole = functions.https.onCall(
  // ✅ FIXED: Using the single 'request' object signature.
  async (request) => {
    const data = request.data as { email: string };
    const auth = request.auth;

    if (auth?.token.email !== adminEmail) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized.");
    }
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    return { message: `Success! ${data.email} is now an admin.` };
});

// ===================================================================================
// --- STRIPE WEBHOOK HANDLER --- (This is an onRequest handler, so it remains unchanged)
// ===================================================================================
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    const endpointSecret = functions.config().stripe.webhook_secret;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    } catch (err) {
        console.error("Webhook signature verification failed.", err);
        res.status(400).send(`Webhook Error: ${(err as Error).message}`);
        return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const customerId = session.customer as string;

    if (!userId) {
        res.status(400).send("Webhook Error: Missing userId in metadata.");
        return;
    }

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        const proPriceIds = ["YOUR_PRO_MONTHLY_ID", "YOUR_PRO_YEARLY_ID"];
        const businessPriceIds = ["YOUR_BUSINESS_MONTHLY_ID", "YOUR_BUSINESS_YEARLY_ID"];

        let stripeRole = "free";
        if (proPriceIds.includes(priceId)) stripeRole = "pro";
        if (businessPriceIds.includes(priceId)) stripeRole = "business";

        await admin.auth().setCustomUserClaims(userId, { stripeRole });
        await db.collection("users").doc(userId).set({
            stripeRole,
            stripeCustomerId: customerId,
            subscriptionId: subscription.id,
        }, { merge: true });
    }

    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status === 'canceled' || subscription.status === 'unpaid' || subscription.cancel_at_period_end) {
            await admin.auth().setCustomUserClaims(userId, { stripeRole: "free" });
            await db.collection("users").doc(userId).set({ stripeRole: "free" }, { merge: true });
        }
    }
    res.status(200).send({ received: true });
});