import { FieldValue, Transaction } from "firebase-admin/firestore";
import { AttendanceStatus } from "./types";

export function updateSummary(
  tx: Transaction,
  schoolRef: FirebaseFirestore.DocumentReference,
  userType: "STUDENT" | "FACULTY",
  status: AttendanceStatus,
  isUpdate: boolean,
  oldStatus?: AttendanceStatus | null
) {
  const prefix = userType === "STUDENT" ? "students" : "faculty";

  if (!isUpdate) {
    tx.set(
      schoolRef,
      {
        [`${prefix}.total`]: FieldValue.increment(1),
        [`${prefix}.${status.toLowerCase()}`]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  if (oldStatus && oldStatus !== status) {
    tx.set(
      schoolRef,
      {
        [`${prefix}.${oldStatus.toLowerCase()}`]: FieldValue.increment(-1),
        [`${prefix}.${status.toLowerCase()}`]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}
