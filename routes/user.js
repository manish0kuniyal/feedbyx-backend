import express from "express";
import User from "../models/user.js";
import { saveUser,getCurrentPlan } from "../controllers/authController/googleauthController.js";

const router = express.Router();
router.post("/save",saveUser)

router.get("/plan", getCurrentPlan);
export default router;
