# Design Note — iConCile Expense Manager

1. **Rule-Based Categorization**: Vendors are normalized using whitespace trimming and lowercase conversion (`vendor.trim().toLowerCase()`), then matched against `VendorCategoryRule` records stored in PostgreSQL via Prisma.
2. **Category Fallback**: If no database rule matches a vendor (e.g. unknown vendors), the expense gracefully falls back to the pre-seeded "Miscellaneous" category without throwing errors.
3. **Data Model Choices**: Relational architecture using 3 minimal Prisma models (`Category`, `Expense`, `VendorCategoryRule`) with foreign key constraints (`categoryId`) and indexes on `Expense.date` and `categoryId` for optimal query speed.
4. **Anomaly Logic (3× Rule)**: An expense is flagged (`isAnomaly = true`) if its amount exceeds $3\times$ the average amount of other expenses in the same category.
5. **Self-Distortion Prevention**: The expense being evaluated is strictly excluded from the average calculation to prevent self-inflation, and categories with fewer than 2 expenses default to `isAnomaly = false`.
6. **Trade-offs & Shortcuts**: Anomaly detection and category recalculations run synchronously inside service calls upon creation/deletion to guarantee deterministic state without the complexity of background queue systems (e.g., Redis/BullMQ).
