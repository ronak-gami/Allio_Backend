import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

import db from '../Config/firebaseConfig.js';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Gmail SMTP for Nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send OTP for MPIN Reset
const sendOtp = async (req, res) => {
  const {email} = req.body;

  // Debug logs to verify environment variables are loaded
  if (!email)
    return res.status(400).json({status: false, message: 'Email is required'});

  try {
    // Check user
    const snapshot = await db
      .collection('users')
      .where('email', '==', email)
      .get();
    if (snapshot.empty)
      return res.status(404).json({status: false, message: 'Email not found'});

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Render EJS template
    const templatePath = path.join(__dirname, '../templates/otp-email.ejs');
    const htmlContent = await ejs.renderFile(templatePath, {otp});

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'MPIN Reset OTP',
      html: htmlContent,
    });

    // Store OTP in Firestore with timestamp
    await db.collection('users').doc(userId).update({
      MPINForgotOTP: otp,
      otpCreatedAt: new Date(), // Add timestamp for expiry check
    });

    res.json({status: true, message: 'OTP sent successfully'});
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({status: false, message: 'Something went wrong'});
  }
};

// Validate OTP for MPIN Reset
const validateOtp = async (req, res) => {
  const {email, otp} = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      status: false,
      message: !email ? 'Email is required' : 'OTP is required',
    });
  }

  try {
    // Fetch user by email
    const snapshot = await db
      .collection('users')
      .where('email', '==', email)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({status: false, message: 'Email not found'});
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Check if OTP exists
    if (!userData.MPINForgotOTP) {
      return res.status(400).json({
        status: false,
        message: 'No OTP found. Please request again.',
      });
    }

    // Check OTP expiry (10 mins)
    const otpCreatedAt = userData.otpCreatedAt?.toDate
      ? userData.otpCreatedAt.toDate()
      : userData.otpCreatedAt;
    const now = new Date();
    const diffInMinutes = (now - otpCreatedAt) / 1000 / 60;

    if (diffInMinutes > 10) {
      return res.status(400).json({
        status: false,
        message: 'OTP expired. Please request a new one.',
      });
    }

    // Validate OTP
    if (userData.MPINForgotOTP.toString() !== otp.toString()) {
      return res.status(400).json({status: false, message: 'Invalid OTP'});
    }

    // ✅ Success
    return res.json({status: true, message: 'OTP verified successfully'});
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({status: false, message: 'Something went wrong'});
  }
};

// Helper function for Base64 encoding
const encryptMPIN = value => {
  return Buffer.from(value).toString('base64');
};

// Update MPIN without OTP (after OTP is already validated)
const setNewMpin = async (req, res) => {
  const {email, newMpin} = req.body;

  // Validate inputs
  if (!email || !newMpin) {
    return res.status(400).json({
      status: false,
      message: !email ? 'Email is required' : 'New MPIN is required',
    });
  }

  try {
    // Check user exists
    const snapshot = await db
      .collection('users')
      .where('email', '==', email)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({status: false, message: 'Email not found'});
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    // Encode MPIN in Base64
    const encodedMPIN = encryptMPIN(newMpin);

    // Update Firestore
    await db.collection('users').doc(userId).update({
      mpin: encodedMPIN,
    });

    return res.json({status: true, message: 'MPIN updated successfully'});
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({status: false, message: 'Something went wrong'});
  }
};

const sendNotification = async (req, res) => {
  const {emails, title, body} = req.body; // DO NOT CHANGE (as requested)

  try {
    // Basic validation (does not alter destructure)
    if (!Array.isArray(emails) || emails.length === 0 || !title || !body) {
      return res.status(400).json({
        status: false,
        message: 'Invalid payload: emails (array), title, body required',
      });
    }

    const successfulNotifications = [];
    const failedNotifications = [];

    for (const rawEmail of emails) {
      const email = (rawEmail || '').trim().toLowerCase();
      if (!email) {
        failedNotifications.push({email: rawEmail, reason: 'Empty email'});
        continue;
      }

      try {
        const snapshot = await db
          .collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();

        if (snapshot.empty) {
          failedNotifications.push({email, reason: 'User not found'});
          continue;
        }

        const userData = snapshot.docs[0].data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
          successfulNotifications.push({
            email,
            message: "User isn't logged in (no fcmToken)",
          });
          continue;
        }

        const message = {
          token: fcmToken,
          data: {
            title: String(title),
            body: String(body),
            // (Add more custom keys here later if needed)
          },
          android: {
            priority: 'high',
            ttl: 3600 * 1000, // 1h ms
          },
          apns: {
            headers: {'apns-priority': '10'},
            payload: {
              aps: {
                'content-available': 1,
              },
            },
          },
        };

        const responseId = await admin.messaging().send(message);
        successfulNotifications.push({email, messageId: responseId});
      } catch (err) {
        console.error('FCM send error for', email, err);
        failedNotifications.push({email, reason: 'Send failed'});
      }
    }

    return res.status(200).json({
      status: true,
      message: 'Notification processing complete',
      summary: {
        total: emails.length,
        successful: successfulNotifications.length,
        failed: failedNotifications.length,
      },
      successfulNotifications,
      failedNotifications: failedNotifications.length
        ? failedNotifications
        : undefined,
    });
  } catch (error) {
    console.error('Send Notification Fatal Error:', error);
    return res.status(500).json({
      status: true,
      message: 'Notification process completed with fatal error',
      summary: {
        total: Array.isArray(emails) ? emails.length : 0,
        successful: 0,
        failed: Array.isArray(emails) ? emails.length : 0,
      },
      successfulNotifications: [],
    });
  }
};

export {sendOtp, validateOtp, setNewMpin, sendNotification};
