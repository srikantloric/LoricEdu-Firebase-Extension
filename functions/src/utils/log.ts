/* eslint-disable */
import { db } from "../index";
import { FieldValue } from "firebase-admin/firestore";

export async function logStatus(status: "success" | "error", message?: string) {
  try {
    if (status === "success") {
      await db.collection("LOGS").doc("firebaseFunction").set(
        {
          health: "Healthy",
          successCount: FieldValue.increment(1),
        },
        { merge: true }
      );
    } else {
      await db.collection("LOGS").doc("firebaseFunction").set(
        {
          health: "Error",
          failureCount: FieldValue.increment(1),
          errors: FieldValue.arrayUnion({
            timestamp: new Date(),
            message,
          }),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("LOGGING ERROR:", err);
  }
}
