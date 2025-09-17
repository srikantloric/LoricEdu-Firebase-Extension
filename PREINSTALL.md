# Payment Analytics Extension

This extension automatically updates analytics when payment documents are **created or deleted** in your Firestore collection.

---

## 📝 What this extension does

- Listens to the `MY_PAYMENTS/{paymentId}` collection.
- On **document create**:
  - Increments daily, monthly, and yearly fee collection totals.
  - Updates a sub-collection `ANALYTICS/dashboardAnalytics/feeCollection`.
- On **document delete**:
  - Decrements totals accordingly, keeping analytics consistent.

---

## ⚙️ Configuration parameters

During installation, you will be asked to provide:

- **Payments Collection Path**  
  The Firestore collection where payment records are stored.  
  Default: `MY_PAYMENTS/{paymentId}`

- **Analytics Collection Path**  
  The Firestore collection where analytics will be updated.  
  Default: `ANALYTICS/dashboardAnalytics`

---

## 🔑 Required services & APIs

- **Firestore** (enabled automatically if not already).
- **Cloud Functions** (for running triggers).

---

## 📂 Firestore structure created

- `ANALYTICS/dashboardAnalytics`
- `ANALYTICS/dashboardAnalytics/feeCollection/MONTH_{month}_{year}`

---

## ✅ Before you install

1. Make sure you have [Firebase CLI](https://firebase.google.com/docs/cli) installed.
2. Ensure your Firebase project has **Firestore in Native mode** enabled.
3. Have your payments collection (`MY_PAYMENTS`) ready with documents like:

```json
{
  "amountPaid": 500,
  "timestamp": "2025-09-17T10:00:00Z"
}
