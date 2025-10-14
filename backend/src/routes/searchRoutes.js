import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import { searchUsers } from "../controllers/searchController.js";

const router = Router();
router.get("/users", auth, searchUsers);
export default router;
