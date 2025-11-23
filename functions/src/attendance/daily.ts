/* eslint-disable */
import { Transaction, DocumentReference } from "firebase-admin/firestore";
import { AttendanceEvent, AttendanceStatus } from "./types";

export async function updateDailyAttendance(
  tx: Transaction,
  dailyRef: DocumentReference,
  event: AttendanceEvent,
  oldStatus?: AttendanceStatus | null
) {
  const { studentId, classId, date, status, timestamp } = event;

  if (status !== "PRESENT") {
    tx.set(
      dailyRef,
      {
        studentId,
        classId,
        date,
        status,
        present: false,
        firstIn: null,
        lastOut: null,
      },
      { merge: true }
    );
    return;
  }

  // PRESENT
  const prev = await tx.get(dailyRef);

  if (!prev.exists) {
    tx.set(dailyRef, {
      studentId,
      classId,
      date,
      status: "PRESENT",
      present: true,
      firstIn: timestamp,
      lastOut: timestamp,
    });
  } else {
    tx.update(dailyRef, {
      lastOut: Math.max(prev.data()!.lastOut || 0, timestamp),
    });
  }
}
