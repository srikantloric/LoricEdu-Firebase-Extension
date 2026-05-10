/* eslint-disable */
import { db } from "../index";
import { AttendanceEvent } from "./types";
import { updateDailyAttendance } from "./daily";
import { updateMonthlyAttendance } from "./monthly";
import { getYearMonth } from "../utils/date";
import { updateSummary } from "./updateSummary";

export async function processStudentAttendance(event: AttendanceEvent) {
  const { userId: studentId, classId, date, status } = event;


  const dailyRef = db.doc(
    `ATTENDANCE_DAILY/${date}/CLASSES/${classId}/STUDENTS/${studentId}`
  );

  const classSummaryRef = db.doc(
    `ATTENDANCE_SUMMARY_DAILY/${date}/CLASSES/${classId}`
  );

  const schoolSummaryRef = db.doc(`ATTENDANCE_SUMMARY_DAILY/${date}`);

  const monthlyRef = db.doc(
    `ATTENDANCE_MONTHLY/${studentId}/MONTHS/${getYearMonth(date)}`
  );

  await db.runTransaction(async (tx) => {
    const dailySnap = await tx.get(dailyRef);
    const monthlySnap = await tx.get(monthlyRef);
    const oldStatus = dailySnap.exists ? dailySnap.data()!.status : null;

    const isUpdate = !!oldStatus;

    // 1️⃣ DAILY
    await updateDailyAttendance(tx, dailyRef, event);

    // 2️⃣ MONTHLY
    await updateMonthlyAttendance(
      tx,
      monthlyRef,
      monthlySnap,
      date,
      status,
    );

    // 3️⃣ CLASS SUMMARY
    updateSummary(tx, classSummaryRef, "STUDENT", status, isUpdate, oldStatus);

    // 4️⃣ SCHOOL SUMMARY
    updateSummary(tx, schoolSummaryRef, "STUDENT", status, isUpdate, oldStatus);
  });
}
