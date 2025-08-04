import express from 'express';
import {
  sendOtp,
  setNewMpin,
  validateOtp,
} from '../Controllers/user.controller.js';

const userRouter = express.Router();

userRouter.post('/send-otp', sendOtp);
userRouter.post('/validate-otp', validateOtp);
userRouter.post('/set-new-mpin', setNewMpin);

export default userRouter;
