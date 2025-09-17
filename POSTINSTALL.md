# Payment Analytics Extension

✅ Thank you for installing the **Payment Analytics Extension**!  
This extension helps you automatically maintain **real-time analytics** for your payments.

---

## What this extension does
- **On Payment Creation (`onCreate`)**  
  Updates the `ANALYTICS/dashboardAnalytics` document with:
  - Today’s total
  - This month’s total
  - This year’s total
  - Updates monthly collection in `ANALYTICS/dashboardAnalytics/feeCollection/{MONTH_YYYY}`

- **On Payment Deletion (`onDelete`)**  
  Decrements the same values when a payment document is deleted.

---

## Firestore Collections Used
- **Payments Source Collection**  
  - Path: `MY_PAYMENTS/{paymentId}`  
  - Your app should write all payment records here, with fields like:
    ```json
    {
      "amountPaid": 1000,
      "timestamp": "2025-09-17T12:00:00Z"
    }
    ```

- **Analytics Collection**  
  - Path: `ANALYTICS/dashboardAnalytics`  
  - Sub-collection: `feeCollection/{MONTH_YYYY}`  

---

## Verifying the Extension
1. Open Firestore in the Firebase console.
2. Add a document in `MY_PAYMENTS`.
   - Example:  
     ```json
     {
       "amountPaid": 500,
       "timestamp": "2025-09-17T12:00:00Z"
     }
     ```
3. Check `ANALYTICS/dashboardAnalytics` → The totals should increase.
4. Delete the same payment → The totals should decrease.

---

## Notes
- **Data Type**: `amountPaid` must be stored as a **number** in Firestore.
- **Timestamp**: The `timestamp` field must be a valid date for monthly/yearly grouping.
- **Multi-tenant**: If you run multiple Firebase projects (e.g., per school), install this extension in each project.

---

## Logs
All success/error logs are stored in **Cloud Functions logs**.  
To view logs:  
```bash
firebase functions:log
