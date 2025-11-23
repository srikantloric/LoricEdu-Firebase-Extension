/* eslint-disable */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { firestore } from "firebase-functions/v1";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { pubsub } from "firebase-functions/v1";
import axios from "axios";
import { processAttendanceEvent } from './attendance/processAttendance';
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


///Send Daily Executive Report
export const scheduledExecutiveReport = pubsub.schedule("29 18 * * *").onRun(async (context) => {
    console.log("Scheduled function 'scheduledExecutiveReport' started at", new Date().toISOString());

    const configSnap = await db.collection("CONFIG").doc("APP_CONFIG").get();
    const config = configSnap.data()?.triggers.whatsapp.executiveReport;

    if (!config?.enabled) {
        console.log("Analytics reporting is disabled. Skipping...");
        return;
    }

    // Fetch analytics data
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = Timestamp.fromDate(today);

    const endDate = new Date(today);
    endDate.setUTCHours(23, 59, 59, 999);
    const end = Timestamp.fromDate(endDate);

    const paymentsSnap = await db.collection("MY_PAYMENTS")
        .where("timestamp", ">=", start)
        .where("timestamp", "<=", end)
        .orderBy("timestamp", "desc")
        .get();

    const todaysPayments = paymentsSnap.docs.map(doc => doc.data());

    const totalAmountPaid = todaysPayments.reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);
    console.log(`Total amount paid today: ${totalAmountPaid}`);

    // Categorize total amount by receivedBy
    const amountByReceivedBy: Record<string, number> = {};
    todaysPayments.forEach(payment => {
        const receivedBy = payment.recievedBy.split("@")[0] || "Admin";
        amountByReceivedBy[receivedBy] = (amountByReceivedBy[receivedBy] || 0) + Number(payment.amountPaid || 0);
    });

    console.log("Total amount paid by receivedBy:", amountByReceivedBy);

    //Now fetch the expenses too
    const expensesSnap = await db.collection("EXPENSES")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .orderBy("createdAt", "desc")
        .get();

    const todaysExpenses = expensesSnap.docs.map(doc => doc.data());

    const totalExpenseAmount = todaysExpenses.reduce((sum, expense) => sum + Number(expense.expenseAmount || 0), 0);
    console.log(`Total expense amount today: ${totalExpenseAmount}`);


    // Format variables_values for the API
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    // Prepare collectedBy string: "Name1 (Rs.amount1), Name2 (Rs.amount2)"
    const collectedByStr = Object.entries(amountByReceivedBy)
        .map(([name, amount]) => `${name} (Rs.${amount})`)
        .join(', ');

    const variables_values = [
        dateStr,
        0,
        0,
        0,
        0,
        totalAmountPaid,
        0,
        totalAmountPaid,
        0,
        collectedByStr || "N/A",
        "Admin"
    ].join('|');
    console.log("Variables values for message:", variables_values);

    // Construct the API URL
    const numbers = config?.recipient?.join(',') || "7979080633";
    const media_url = "https://ik.imagekit.io/acak7duni/Executive%20Summary.jpg?updatedAt=175742657752";
    const message_id = "5358";
    const authorization = "5JFElxhK0QfoLzBwuvVIS1CnDqdmHWNr26y98AXeTYRkipbGUgQgXTJ7SKsbGAwOBc0nPDejW3lkrNI8";

    const apiUrl = `https://www.fast2sms.com/dev/whatsapp?authorization=${authorization}&message_id=${message_id}&numbers=${numbers}&variables_values=${encodeURIComponent(variables_values)}&media_url=${encodeURIComponent(media_url)}`;

    // Send the WhatsApp message using axios
    try {
        const response = await axios.post(apiUrl, {}, {
            headers: {
                'authorization': authorization,
                'Content-Type': 'application/json'
            }
        });
        const result = response.data;
        console.log("WhatsApp API response:", result);
    } catch (error) {
        console.error("Error sending WhatsApp report:", error);
    }

});


// Attendance Event Processor
export const onAttendanceEvent = firestore
  .document("ATTENDANCE_EVENTS/{eventId}")
  .onCreate(async (snap, context) => {
    const event = snap.data() as any;
    console.log("Processing attendance event:", event);

    try {
      await processAttendanceEvent(event);
      console.log("Attendance processed:", context.params.eventId);
    } catch (err) {
      console.error("Error processing attendance:", err);
    }
  });