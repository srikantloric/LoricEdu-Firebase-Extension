import { db } from "../index";
import { AttendanceEvent } from "./types";
import { updateDailyAttendance } from "./daily";
import { updateMonthlyAttendance } from "./monthly";
import { getYearMonth } from "../utils/date";
import { updateSummary } from "./updateSummary";

export async function processFacultyAttendance(event: AttendanceEvent) {
    const { userId: facultyId, departmentId, date, status } = event;

    const dailyRef = db.doc(
        `ATTENDANCE_DAILY/${date}/FACULTY/${facultyId}`
    );

    const deptSummaryRef = db.doc(
        `ATTENDANCE_DEPT_SUMMARY/${date}/DEPARTMENTS/${departmentId}`
    );

    const schoolFacultySummaryRef = db.doc(
        `ATTENDANCE_SUMMARY_DAILY/${date}`
    );

    const monthlyRef = db.doc(
        `ATTENDANCE_MONTHLY/${facultyId}/MONTHS/${getYearMonth(date)}`
    );

    await db.runTransaction(async (tx) => {
        const dailySnap = await tx.get(dailyRef);
        const monthlySnap = await tx.get(monthlyRef);

        const oldStatus = dailySnap.exists ? dailySnap.data()!.status : null;
        const isUpdate = !!oldStatus;

        // DAILY
        await updateDailyAttendance(tx, dailyRef, event);

        // MONTHLY
        await updateMonthlyAttendance(
            tx,
            monthlyRef,
            monthlySnap,
            date,
            status
        );

        // DEPARTMENT SUMMARY
        updateSummary(tx, deptSummaryRef, "FACULTY", status, isUpdate, oldStatus);

        // SCHOOL (FACULTY ONLY)
        updateSummary(
            tx,
            schoolFacultySummaryRef,
            "FACULTY",
            status,
            isUpdate,
            oldStatus
        );
    });
}
