/* eslint-disable */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { firestore } from "firebase-functions/v1";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';


// Initialize Firebase Admin only once
if (!getApps().length) {
    initializeApp();
}

export const db = getFirestore();

// Ensure db is defined before using
if (!db) {
    throw new Error("Firestore database not initialized!");
}


function getMonthAndYear(timestamp: Timestamp) {
    // Convert the Firestore Timestamp to a JavaScript Date object
    const date = timestamp.toDate();

    // Get the month and year from the date
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;           // JavaScript months are 0-based, so we add 1

    return { month, year };
}

export const onPaymentAdd = firestore
    .document("MY_PAYMENTS/{paymentId}")
    .onCreate(async (snapshot, context) => {

        const enableAnalytics = process.env.ENABLE_ANALYTICS === "true";

        if (!enableAnalytics) {
            console.log("Analytics aggregation disabled. Skipping...");
            return;
        }

        const paymentData = snapshot.data() as any;

        if (!paymentData) {
            console.error("No data found in the payment document.");
            return;
        }

        try {
            // Process payment data for analytics
            const analyticsData = {
                lastUpdated: FieldValue.serverTimestamp(),
                totalFeeCollection: {
                    today: FieldValue.increment(Number(paymentData.amountPaid)),
                    thisMonth: FieldValue.increment(Number(paymentData.amountPaid)),
                    thisYear: FieldValue.increment(Number(paymentData.amountPaid)),
                },
            };

            // Prepare document Id for sub-collection
            const { month, year } = getMonthAndYear(paymentData.timestamp);
            const monthlyFeeCollectionDocId = `MONTH_${month}_${year}`;

            const analyticsDataMonthly = {
                lastUpdated: FieldValue.serverTimestamp(),
                totalCollection: FieldValue.increment(Number(paymentData.amountPaid)),
            };

            // Save processed data to ANALYTICS collection
            await db
                .collection("ANALYTICS")
                .doc("dashboardAnalytics")
                .set(analyticsData, { merge: true });

            await db
                .collection("ANALYTICS")
                .doc("dashboardAnalytics")
                .collection("feeCollection")
                .doc(monthlyFeeCollectionDocId)
                .set(analyticsDataMonthly, { merge: true });

            const successMessage = `Analytics data saved for payment: ${context.params.paymentId}`;
            console.log(successMessage);
            await logStatus("success", successMessage);
        } catch (error) {
            const errorMessage = `Error (Payment Id ${context.params.paymentId}): ${error}`;
            console.error(errorMessage);
            await logStatus("error", errorMessage);
        }
    });

// Function to handle deletion
export const onPaymentDelete = firestore
    .document("MY_PAYMENTS/{paymentId}")
    .onDelete(async (snapshot, context) => {
        const paymentData = snapshot.data() as any;

        if (!paymentData) {
            console.error("No data found in the deleted payment document.");
            return;
        }

        try {
            // Prepare analytics decrement
            const analyticsData = {
                lastUpdated: FieldValue.serverTimestamp(),
                totalFeeCollection: {
                    today: FieldValue.increment(-Number(paymentData.amountPaid)), // subtract
                    thisMonth: FieldValue.increment(-Number(paymentData.amountPaid)),
                    thisYear: FieldValue.increment(-Number(paymentData.amountPaid)),
                },
            };

            // Monthly sub-collection
            const { month, year } = getMonthAndYear(paymentData.timestamp);
            const monthlyFeeCollectionDocId = `MONTH_${month}_${year}`;

            const analyticsDataMonthly = {
                lastUpdated: FieldValue.serverTimestamp(),
                totalCollection: FieldValue.increment(-Number(paymentData.amountPaid)),
            };

            // Update main analytics
            await db
                .collection("ANALYTICS")
                .doc("dashboardAnalytics")
                .set(analyticsData, { merge: true });

            // Update monthly analytics
            await db
                .collection("ANALYTICS")
                .doc("dashboardAnalytics")
                .collection("feeCollection")
                .doc(monthlyFeeCollectionDocId)
                .set(analyticsDataMonthly, { merge: true });

            const successMessage = `Analytics decremented for deleted payment: ${context.params.paymentId}`;
            console.log(successMessage);
            await logStatus("success", successMessage);
        } catch (error) {
            const errorMessage = `Error (Payment Id ${context.params.paymentId}): ${error}`;
            console.error(errorMessage);
            await logStatus("error", errorMessage);
        }
    });

export async function logStatus(status: 'success' | 'error', message?: string) {
    try {
        if (status === 'success') {
            await db.collection('LOGS').doc('firebaseFunction').set(
                { health: 'Healthy', successCount: FieldValue.increment(1) },
                { merge: true }
            );
        } else if (status === 'error' && message) {
            await db.collection('LOGS').doc('firebaseFunction').set(
                {
                    health: 'Error',
                    failureCount: FieldValue.increment(1),
                    errors: FieldValue.arrayUnion({ timestamp: new Date(), message }),
                },
                { merge: true }
            );
        }
    } catch (error) {
        console.error('Error logging status:', error);
    }
}
