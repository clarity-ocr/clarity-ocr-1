import {setGlobalOptions} from "firebase-functions";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ maxInstances: 10 });

// --- CONFIGURATION ---
// ✅ CHANGED: Read the admin email from process.env, the modern and reliable way.
const adminEmail = process.env.APP_ADMIN_EMAIL;

// ===================================================================================
// --- ADMIN-ONLY FUNCTIONS ---
// ===================================================================================

export const grantAdminRole = functions.https.onCall(async (request) => {
    const data = request.data as { email: string };
    const auth = request.auth;

    if (!adminEmail) {
        throw new functions.https.HttpsError("internal", "The admin email is not configured on the backend. Deployment is misconfigured.");
    }
    if (!auth?.token.email) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in to perform this action.");
    }
    if (auth.token.email !== adminEmail) {
      throw new functions.https.HttpsError("permission-denied", "This action is restricted to the application owner.");
    }
    if (data.email !== adminEmail) {
        throw new functions.https.HttpsError("invalid-argument", "The admin role can only be granted to the application owner.");
    }

    try {
        const user = await admin.auth().getUserByEmail(data.email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        return { message: `Success! The admin role has been set for ${data.email}.` };
    } catch (error: unknown) {
        logger.error("Error in grantAdminRole:", error);
        if (typeof error === 'object' && error !== null && 'code' in error && (error as {code: unknown}).code === 'auth/user-not-found') {
            throw new functions.https.HttpsError("not-found", `User with email ${data.email} was not found.`);
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
    }
});

export const createCoupon = functions.https.onCall(async (request) => {
    const data = request.data as {
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        expiresAt?: string;
        maxUses?: number;
    };
    const auth = request.auth;

    if (auth?.token.admin !== true) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to create coupons.");
    }

    if (!data.code || typeof data.code !== 'string' || data.code.length < 3) {
        throw new functions.https.HttpsError("invalid-argument", "Coupon code must be a string of at least 3 characters.");
    }
    if (data.discountType !== 'percentage' && data.discountType !== 'fixed') {
        throw new functions.https.HttpsError("invalid-argument", "Discount type must be 'percentage' or 'fixed'.");
    }
    if (typeof data.discountValue !== 'number' || data.discountValue <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Discount value must be a positive number.");
    }
    if (data.discountType === 'percentage' && data.discountValue > 100) {
        throw new functions.https.HttpsError("invalid-argument", "Percentage discount cannot exceed 100.");
    }

    const couponRef = db.collection("coupons").doc(data.code.toUpperCase());
    const couponDoc = await couponRef.get();
    if (couponDoc.exists) {
        throw new functions.https.HttpsError("already-exists", `Coupon code '${data.code.toUpperCase()}' already exists.`);
    }

    const newCouponData = {
        discountType: data.discountType,
        discountValue: data.discountValue,
        expiresAt: data.expiresAt ? admin.firestore.Timestamp.fromDate(new Date(data.expiresAt)) : null,
        maxUses: data.maxUses || 0,
        uses: 0,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await couponRef.set(newCouponData);
    logger.info(`Admin ${auth.uid} created coupon: ${data.code.toUpperCase()}`);
    return { success: true, message: `Coupon '${data.code.toUpperCase()}' created successfully.` };
});

// ===================================================================================
// --- AUTHENTICATED USER FUNCTIONS ---
// ===================================================================================

export const validateCoupon = functions.https.onCall(async (request) => {
    const data = request.data as { code: string };
    const auth = request.auth;

    if (!auth?.uid) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to validate a coupon.");
    }
    if (!data.code) {
        throw new functions.https.HttpsError("invalid-argument", "Coupon code is required.");
    }

    const couponRef = db.collection("coupons").doc(data.code.toUpperCase());
    const couponDoc = await couponRef.get();

    if (!couponDoc.exists) {
        throw new functions.https.HttpsError("not-found", "This coupon code is not valid.");
    }

    const coupon = couponDoc.data()!;
    if (coupon.status !== 'active') {
        throw new functions.https.HttpsError("failed-precondition", "This coupon is no longer active.");
    }
    if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
        await couponRef.update({ status: 'expired' });
        throw new functions.https.HttpsError("failed-precondition", "This coupon has expired.");
    }
    if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) {
        throw new functions.https.HttpsError("resource-exhausted", "This coupon has reached its maximum number of uses.");
    }

    const redemptionRef = couponRef.collection("redemptions").doc(auth.uid);
    const redemptionDoc = await redemptionRef.get();
    if (redemptionDoc.exists) {
        throw new functions.https.HttpsError("already-exists", "You have already used this coupon code.");
    }

    return {
        valid: true,
        code: couponDoc.id,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
    };
});

export const redeemCoupon = functions.https.onCall(async (request) => {
    const data = request.data as { code: string };
    const auth = request.auth;

    if (!auth?.uid) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to redeem a coupon.");
    }
    if (!data.code) {
        throw new functions.https.HttpsError("invalid-argument", "Coupon code is required.");
    }

    const couponRef = db.collection("coupons").doc(data.code.toUpperCase());
    const redemptionRef = couponRef.collection("redemptions").doc(auth.uid);

    try {
        await db.runTransaction(async (transaction) => {
            const couponDoc = await transaction.get(couponRef);

            if (!couponDoc.exists) throw new Error("NOT_FOUND");
            const coupon = couponDoc.data()!;
            if (coupon.status !== 'active') throw new Error("INACTIVE");
            if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) throw new Error("EXPIRED");
            if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) throw new Error("MAX_USES");
            
            const redemptionDoc = await transaction.get(redemptionRef);
            if (redemptionDoc.exists) throw new Error("ALREADY_USED");

            transaction.update(couponRef, { uses: admin.firestore.FieldValue.increment(1) });
            transaction.set(redemptionRef, { redeemedAt: admin.firestore.FieldValue.serverTimestamp() });
        });

        logger.info(`User ${auth.uid} successfully redeemed coupon: ${data.code.toUpperCase()}`);
        return { success: true, message: "Coupon redeemed successfully." };
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`Failed redemption for user ${auth.uid} coupon ${data.code.toUpperCase()}:`, error.message);
            if (error.message === "NOT_FOUND") throw new functions.https.HttpsError("not-found", "This coupon code is not valid.");
            if (error.message === "INACTIVE") throw new functions.https.HttpsError("failed-precondition", "This coupon is no longer active.");
            if (error.message === "EXPIRED") throw new functions.https.HttpsError("failed-precondition", "This coupon has expired.");
            if (error.message === "MAX_USES") throw new functions.https.HttpsError("resource-exhausted", "This coupon has reached its maximum number of uses.");
            if (error.message === "ALREADY_USED") throw new functions.https.HttpsError("already-exists", "You have already used this coupon code.");
        } else {
            logger.error(`An unknown error occurred during redemption for user ${auth.uid} coupon ${data.code.toUpperCase()}:`, error);
        }
        
        throw new functions.https.HttpsError("internal", "Could not redeem coupon. Please try again.");
    }
});