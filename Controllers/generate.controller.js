import QRCode from 'qrcode';
import cloudinary from '../Config/cloudinaryConfig.js';
import db from '../Config/firebaseConfig.js';
import {v4 as uuidv4} from 'uuid';

const generateQRCode = async (req, res) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const qrBuffer = await QRCode.toBuffer(email);

    // Upload QR code to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'qrcodes',
          public_id: uuidv4(),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(qrBuffer);
    });

    const uploadResult = await uploadPromise;

    // Store in Firebase
    const userDocRef = db.collection('media').doc(email);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      await userDocRef.update({
        QRCode: uploadResult.secure_url,
        updatedAt: new Date(),
      });
    } else {
      await userDocRef.set({
        email,
        QRCode: uploadResult.secure_url,
        createdAt: new Date(),
      });
    }

    return res.json({
      success: true,
      message: 'QR Code generated successfully',
      qrCodeUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate QR code',
    });
  }
};

export {generateQRCode};
