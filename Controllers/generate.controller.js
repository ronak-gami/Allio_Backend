import QRCode from 'qrcode';
import cloudinary from '../Config/cloudinaryConfig.js';
import db from '../Config/firebaseConfig.js';
import {v4 as uuidv4} from 'uuid';
import {createCanvas, loadImage} from 'canvas';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateQRCode = async (req, res) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // 🔹 Step 1: Get user's firstname from Firebase
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userData = snapshot.docs[0].data();
    const {firstName} = userData;

    if (!firstName) {
      return res.status(400).json({
        success: false,
        error: 'Firstname not found for user',
      });
    }

    console.log(firstName, 'firstname from Firestore');

    // 🔹 Step 2: Generate QR code as Data URL
    const qrDataUrl = await QRCode.toDataURL(email, {
      margin: 1,
      width: 300,
      color: {dark: '#000000', light: '#ffffff'},
    });

    // Canvas size
    const width = 600;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 🔹 Step 3: Load and draw logo from assets (bigger, no yellow background)
    const logoPath = path.join(__dirname, '../assets/logo.png');
    const logoImage = await loadImage(logoPath);

    const logoWidth = 220; // increased size
    const logoHeight = 250;
    const logoX = (width - logoWidth) / 2;
    const logoY = 10;

    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

    // 🔹 Step 4: User's name under logo
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(firstName, width / 2, logoY + logoHeight + 20);

    // 🔹 Step 5: Draw QR code
    const qrImage = await loadImage(qrDataUrl);
    ctx.drawImage(
      qrImage,
      (width - 300) / 2,
      logoY + logoHeight + 40,
      300,
      300,
    );

    // Email at bottom
    ctx.font = '16px Arial';
    ctx.fillText(email, width / 2, height - 50);

    // Optional border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Convert canvas to buffer
    const finalBuffer = canvas.toBuffer();

    // 🔹 Step 6: Upload to Cloudinary
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
      uploadStream.end(finalBuffer);
    });

    const uploadResult = await uploadPromise;

    // 🔹 Step 7: Save QR in Firebase media collection
    const mediaRef = db.collection('media').doc(email);
    const mediaDoc = await mediaRef.get();

    if (mediaDoc.exists) {
      await mediaRef.update({
        QRCode: uploadResult.secure_url,
        updatedAt: new Date(),
      });
    } else {
      await mediaRef.set({
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
