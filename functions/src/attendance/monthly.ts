/* eslint-disable */
import { Transaction } from "firebase-admin/firestore";
import { AttendanceStatus } from "./types";

type MonthlyKey = "present" | "absent" | "leave" | "half_day" | "holiday";

interface MonthlyDoc {
    present: number;
    absent: number;
    leave: number;
    half_day: number;
    holiday: number;
    total: number;
    days: Record<string, AttendanceStatus>;
}

export async function updateMonthlyAttendance(
    tx: Transaction,
    monthlyRef: FirebaseFirestore.DocumentReference,
    monthlySnap: FirebaseFirestore.DocumentSnapshot,
    date: string,
    newStatus: AttendanceStatus,
) {

    let data: MonthlyDoc = monthlySnap.exists
        ? ({ ...defaultMonthly(), ...monthlySnap.data() } as MonthlyDoc)
        : defaultMonthly();

    const currentStatus = data.days?.[date] ?? null;

    // If unchanged → skip
    if (currentStatus === newStatus) return;

    // 1️⃣ DECREMENT OLD
    if (currentStatus) {
        const oldKey = currentStatus.toLowerCase() as MonthlyKey;
        data[oldKey] = Math.max(0, (data[oldKey] || 0) - 1);
    }

    // 2️⃣ INCREMENT NEW
    const newKey = newStatus.toLowerCase() as MonthlyKey;
    data[newKey] = (data[newKey] || 0) + 1;

    // 3️⃣ UPDATE DAYS
    data.days[date] = newStatus;

    // 4️⃣ RECALCULATE TOTAL
    data.total =
        data.present +
        data.absent +
        data.leave +
        data.half_day +
        data.holiday;

    tx.set(monthlyRef, data, { merge: true });
}

function defaultMonthly(): MonthlyDoc {
    return {
        present: 0,
        absent: 0,
        leave: 0,
        half_day: 0,
        holiday: 0,
        total: 0,
        days: {},
    };
}
