/* eslint-disable */

import { db } from "../index";
import { AttendanceEvent } from "./types";
import { updateDailyAttendance } from "./daily";
import { updateClassSummary, updateSchoolSummary } from "./summary";

export async function processAttendanceEvent(event: AttendanceEvent) {
  const { studentId, classId, date, status } = event;

  const dailyRef = db.doc(
    `DAILY_ATTENDANCE/${date}/CLASSES/${classId}/STUDENTS/${studentId}`
  );

  const classSummaryRef = db.doc(
    `ATTENDANCE_SUMMARY_DAILY/${date}/CLASSES/${classId}`
  );

  const schoolSummaryRef = db.doc(`ATTENDANCE_SUMMARY_DAILY/${date}`);

  await db.runTransaction(async (tx) => {
    const dailySnap = await tx.get(dailyRef);
    const oldStatus = dailySnap.exists ? dailySnap.data()!.status : null;

    const isUpdate = !!oldStatus;

    // 1️⃣ DAILY
    await updateDailyAttendance(tx, dailyRef, event, oldStatus);


    // 3️⃣ CLASS SUMMARY
    updateClassSummary(tx, classSummaryRef, status, isUpdate, oldStatus);

    // 4️⃣ SCHOOL SUMMARY
    updateSchoolSummary(tx, schoolSummaryRef, status, isUpdate, oldStatus);
  });
}
