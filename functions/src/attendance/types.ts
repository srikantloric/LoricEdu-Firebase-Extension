/* eslint-disable */

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LEAVE"
  | "HALF_DAY"
  | "HOLIDAY";

export interface AttendanceEvent {
  studentId: string;
  classId: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  timestamp: number;
  comment?: string;
  source: "MANUAL" | "RFID" | "AI";
}

