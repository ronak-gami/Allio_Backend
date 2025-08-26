import cloudinary from '../Config/cloudinaryConfig.js';
import db from '../Config/firebaseConfig.js';
import multer from 'multer';
import {v4 as uuidv4} from 'uuid';
import {Readable} from 'stream'; // Add this import

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single('image');

// Create News
const createNews = async (req, res) => {
  try {
    // Use multer to handle file upload
    upload(req, res, async err => {
      if (err) {
        return res.status(400).json({
          status: false,
          message: err.message || 'File upload error',
        });
      }

      const {name, description} = req.body;

      // Validate required fields
      if (!name || !description) {
        return res.status(400).json({
          status: false,
          message: 'Name and description are required',
        });
      }

      // Check if image is provided
      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: 'Image is required',
        });
      }

      // Upload image to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'news',
            public_id: uuidv4(),
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        // Use ES modules syntax for creating readable stream
        const bufferStream = Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });

      const uploadResult = await uploadPromise;

      // Create news document in Firebase
      const newsRef = db.collection('news').doc();
      await newsRef.set({
        name,
        description,
        imageUrl: uploadResult.secure_url,
        createdAt: new Date(),
      });

      return res.json({
        status: true,
        message: 'News created successfully',
        data: {
          id: newsRef.id,
          name,
          description,
          imageUrl: uploadResult.secure_url,
        },
      });
    });
  } catch (error) {
    console.error('Create News Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to create news',
      error: error.message,
    });
  }
};

// Get All News
const getAllNews = async (req, res) => {
  try {
    const snapshot = await db
      .collection('news')
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return res.json({status: true, message: 'No news found', data: []});
    }

    const newsList = snapshot.docs.map(doc => doc.data());

    return res.json({status: true, data: newsList});
  } catch (error) {
    console.error('Get News Error:', error);
    return res
      .status(500)
      .json({status: false, message: 'Something went wrong'});
  }
};

export {createNews, getAllNews};
