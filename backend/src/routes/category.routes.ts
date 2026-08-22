import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";

const router = Router();

router.get("/", categoryController.getCategories);
router.get("/vendor-rules", categoryController.getVendorRules);

export default router;
