import { Router } from "express";
import multer from "multer";
import * as expenseController from "../controllers/expense.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted"));
    }
  },
});

// CSV upload must be before :id route to avoid conflict
router.post("/upload", upload.single("file"), expenseController.uploadCsv);

// Category preview
router.get("/preview-category", expenseController.previewCategory);

// CRUD
router.post("/", expenseController.createExpense);
router.get("/", expenseController.getExpenses);
router.get("/:id", expenseController.getExpenseById);
router.delete("/:id", expenseController.deleteExpense);

export default router;
