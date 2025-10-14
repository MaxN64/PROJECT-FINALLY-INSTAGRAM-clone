import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import {
  follow,
  unfollow,
  toggle,
  followers,
  following,
} from "../controllers/followController.js";

const router = Router();

router.post("/follow", auth, follow);
router.post("/unfollow", auth, unfollow);
router.post("/toggle", auth, toggle);

router.get("/followers/:userId", auth, followers);
router.get("/following/:userId", auth, following);

export default router;
