import cloudinary from '../Config/cloudinaryConfig.js';
import db from '../Config/firebaseConfig.js';
import {v4 as uuidv4} from 'uuid';

const uploadFile = async (req, res) => {
  try {
    const {email, fileType} = req.body;
    const file = req.file;

    if (!file || !fileType || !email) {
      return res.status(400).json({
        success: false,
        error: 'email, file and fileType are required',
      });
    }

    // ✅ Validate file size
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

    if (fileType === 'image' && file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Image size exceeds 5MB limit.`,
      });
    }

    if (fileType === 'video' && file.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Video size exceeds 50MB limit.`,
      });
    }

    const resourceType = fileType === 'video' ? 'video' : 'image';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'uploads',
        public_id: uuidv4(),
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({success: false, error: error.message});
        }

        try {
          const userDocRef = db.collection('media').doc(email);
          const userDoc = await userDocRef.get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            const updatedData = {
              ...userData,
              images:
                fileType === 'image'
                  ? [...(userData.images || []), result.secure_url]
                  : userData.images || [],
              videos:
                fileType === 'video'
                  ? [...(userData.videos || []), result.secure_url]
                  : userData.videos || [],
            };
            await userDocRef.set(updatedData);
          } else {
            await userDocRef.set({
              email,
              images: fileType === 'image' ? [result.secure_url] : [],
              videos: fileType === 'video' ? [result.secure_url] : [],
            });
          }

          res.json({
            success: true,
            message: 'File uploaded successfully',
            url: result.secure_url,
          });
        } catch (dbError) {
          console.error(dbError);
          return res
            .status(500)
            .json({success: false, error: 'Error saving data to Firestore'});
        }
      },
    );

    uploadStream.end(file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({success: false, error: 'Something went wrong'});
  }
};

const getUserMedia = async (req, res) => {
  try {
    const {email, fileType} = req.body;

    if (!email || !fileType) {
      return res
        .status(400)
        .json({success: false, error: 'email and fileType are required'});
    }

    const userDocRef = db.collection('media').doc(email);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({success: false, error: 'No data found for this email'});
    }

    const userData = userDoc.data();
    let files = [];

    if (fileType === 'image') {
      files = userData.images || [];
    } else if (fileType === 'video') {
      files = userData.videos || [];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid fileType. Use image or video',
      });
    }

    return res.json({
      success: true,
      email,
      fileType,
      files,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({success: false, error: 'Something went wrong'});
  }
};

export {uploadFile, getUserMedia};
