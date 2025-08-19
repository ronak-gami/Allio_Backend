import express from 'express';
import {
  sendOtp,
  setNewMpin,
  validateOtp,
  sendNotification,
} from '../Controllers/user.controller.js';

const userRouter = express.Router();

userRouter.post('/send-otp', sendOtp);
userRouter.post('/validate-otp', validateOtp);
userRouter.post('/set-new-mpin', setNewMpin);
userRouter.post('/send-notification', sendNotification);

export default userRouter;
