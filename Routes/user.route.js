import express from "express";
import {
  sendOtp,
  setNewMpin,
  validateOtp,
} from "../Controllers/user.controller.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/validate-otp", validateOtp);
router.post("/set-new-mpin", setNewMpin);

export default router;
