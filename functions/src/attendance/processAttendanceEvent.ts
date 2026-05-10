import { processFacultyAttendance } from "./processFacultyAttendance";
import { processStudentAttendance } from "./processStudentAttendance";
import { AttendanceEvent } from "./types";

export async function processAttendanceEvent(event: AttendanceEvent) {
    if (event.userType === "STUDENT") {
        return processStudentAttendance(event);
    }

    if (event.userType === "FACULTY") {
        return processFacultyAttendance(event);
    }

    throw new Error("Unknown userType");
}
