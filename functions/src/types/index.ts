import { Timestamp } from "firebase-admin/firestore";

export type IPaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export interface IChallanHeaderType {
    headerTitle: string;
    amount: number;
    amountPaid: number;
    amountPaidTotal: number;
    amountDue: number;
}
export interface IChallanHeaderTypeForChallan {
    headerTitle: string;
    amount: number;
    amountPaidTotal: number;
    amountDue: number;
}
export type FeePaymentType = {
    challanId: string;
    paymentId: string;
    studentId: string;
    challanTitle: string;
    amountPaid: number;
    breakdown: IChallanHeaderType[];
    recievedOn: Timestamp;
    recievedBy: string;
    status: IPaymentStatus;
    feeConsession: number;
    timestamp: Timestamp;
}