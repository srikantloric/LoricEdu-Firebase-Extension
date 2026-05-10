import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type Student = {
    is_active: boolean;
    aadhar_number: string;
    address: string;
    admission_no: string;
    alternate_number: string;
    blood_group: string;
    caste: string;
    city: string;
    class: number | null;
    class_roll: number;
    contact_number: string;
    date_of_addmission: string;
    dob: string;
    email: string;
    father_name: string;
    father_occupation: string;
    father_qualification: string;
    gender: string;
    id: string;
    mother_name: string;
    mother_occupation: string;
    motherqualifiation: string;
    postal_code: string;
    profil_url: string;
    religion: string;
    section: string;
    state: string;
    student_id: string;
    student_name: string;
    monthly_fee: number | null;
    computer_fee: number | null;
    admission_fee?: number | null;
    created_at?: Timestamp | FieldValue | null;
    transportation_fee: number | null;
    generatedChallans: string[];
    fee_discount?: number | null;
    updated_at?: FieldValue | null;
    student_pass?: string,
    status?: "Pending" | "Promoted",
    lastPromotedAt?: FieldValue | Timestamp,
    rfidCode?: string
    transport_location?: string | null;
    transport_vehicle?: string | null;
    paidInstallments?: string[];
}