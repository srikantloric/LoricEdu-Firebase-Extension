/* eslint-disable */
import { Transaction, FieldValue } from "firebase-admin/firestore";
import { AttendanceStatus } from "./types";

export function updateClassSummary(
    tx: Transaction,
    classRef: FirebaseFirestore.DocumentReference,
    status: AttendanceStatus,
    isUpdate: boolean,
    oldStatus?: AttendanceStatus | null
) {
    if (isUpdate && oldStatus === status) return;

    tx.set(
        classRef,
        {
            total: FieldValue.increment(1),
            [status.toLowerCase()]: FieldValue.increment(1),
            updatedAt: Date.now(),
        },
        { merge: true }
    );
}

export function updateSchoolSummary(
    tx: Transaction,
    schoolRef: FirebaseFirestore.DocumentReference,
    status: AttendanceStatus,
    isUpdate: boolean,
    oldStatus?: AttendanceStatus | null
) {
    if (isUpdate && oldStatus === status) return;

    tx.set(
        schoolRef,
        {
            total: FieldValue.increment(1),
            [status.toLowerCase()]: FieldValue.increment(1),
            updatedAt: Date.now(),
        },
        { merge: true }
    );
}
