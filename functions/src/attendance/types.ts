/* eslint-disable */
import { Timestamp } from "firebase-admin/firestore";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LEAVE"
  | "HALF_DAY"
  | "HOLIDAY";

export interface AttendanceEvent {
  userId: string;
  userType:"STUDENT"|"FACULTY"
  classId?: string;
  departmentId?:string
  date: string;       // YYYY-MM-DD
  status: AttendanceStatus;
  timestamp: Timestamp;
  source: "MANUAL" | "RFID" | "AI";
}
