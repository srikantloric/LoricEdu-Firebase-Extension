import axios from "axios";
import { Student } from "./types";
import { getClassNameByValue } from "../utils/utilityFunctions";

const SKOOLGENIE_API_URL = "https://api.skoolgenie.in/v1/notify";
const SKOOLGENIE_API_KEY =
    "skg_live_apxschool_7c9e4a2b6d8f1e3c5a9b0d4e7f2a6c8b";

export async function processNewStudent(student: Student) {
    try {
        const payload = {
            event: "ADMISSION_CONFIRMED",
            channels: ["whatsapp"],
            recipient: {
                phone: student.contact_number
            },
            data: {
                student_name: student.student_name,
                parent_name: student.father_name,
                class: getClassNameByValue(student.class!),
                admission_no: student.admission_no,
                doa: student.date_of_addmission
            }
        };

        const res = await axios.post(
            SKOOLGENIE_API_URL,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${SKOOLGENIE_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 5000
            }
        );

        console.log("Skool Genie accepted event:", res.data);
        return res.data;

    } catch (err: any) {
        console.error(
            "Failed to trigger Skool Genie notification:",
            err.response?.data || err.message
        );
        throw err;
    }
}
