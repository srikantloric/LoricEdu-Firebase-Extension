/* eslint-disable */
import { Transaction, DocumentReference } from "firebase-admin/firestore";
import { AttendanceEvent } from "./types";

export async function updateDailyAttendance(
  tx: Transaction,
  dailyRef: DocumentReference,
  event: AttendanceEvent
) {
  const {
    userId,
    userType,
    classId,
    departmentId,
    date,
    status,
    timestamp,
  } = event;

  const basePayload: any = {
    userId,
    userType,
    date,
    status,
    present: status === "PRESENT",
  };



  // Student-specific
  if (userType === "STUDENT") {
    basePayload.studentId = userId
    basePayload.classId = classId;
  }

  // Faculty-specific
  if (userType === "FACULTY") {
    basePayload.facultyId = userId
    basePayload.departmentId = departmentId;
  }

  console.log("Update Daily Attendance:", basePayload);
  
  if (status !== "PRESENT") {
    tx.set(
      dailyRef,
      {
        ...basePayload,
        firstIn: null,
        lastOut: null,
      },
      { merge: true }
    );
    return;
  }


  const snap = await tx.get(dailyRef);
  if (!snap.exists) {
    tx.set(dailyRef, {
      ...basePayload,
      firstIn: timestamp,
      lastOut: timestamp,
    });
  } else {
    tx.update(dailyRef, {
      lastOut: timestamp,
    });
  }
}
