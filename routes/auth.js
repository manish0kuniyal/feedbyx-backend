import express from "express";
import {
  googleLogin,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController/googleauthController.js";

import { signupUser,loginUser } from "../controllers/authController/localauthController.js";

const router = express.Router();
router.options("/google/token", (req, res) => {
  res.sendStatus(204);
});

router.post("/google/token", googleLogin);


router.post("/signup",signupUser)
router.post("/login",loginUser)

router.get("/me", getCurrentUser);
router.post("/logout", logoutUser);

export default router;
