import db from '../Config/firebaseConfig.js';
import {v4 as uuidv4} from 'uuid';

// Create News
const createNews = async (req, res) => {
  try {
    const {name, description, createdAt} = req.body;

    if (!name || !description) {
      return res.status(400).json({
        status: false,
        message: 'Name and description are required',
      });
    }

    const newsId = uuidv4();
    const createdAtValue = createdAt
      ? new Date(createdAt).toISOString()
      : new Date().toISOString();

    const newsRef = db.collection('news').doc();
    const newsData = {
      id: newsId,
      name,
      description,
      createdAt: createdAtValue,
    };

    await newsRef.set(newsData);

    return res.json({
      status: true,
      message: 'News created successfully',
      data: newsData,
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
    return res.status(500).json({
      status: false,
      message: 'Something went wrong',
    });
  }
};

// Delete News by UUID
const deleteNews = async (req, res) => {
  try {
    const {id} = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'News ID is required',
      });
    }

    const snapshot = await db.collection('news').where('id', '==', id).get();

    if (snapshot.empty) {
      return res.status(404).json({
        status: false,
        message: 'News not found',
      });
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.delete();

    return res.json({
      status: true,
      message: 'News deleted successfully',
    });
  } catch (error) {
    console.error('Delete News Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to delete news',
    });
  }
};

// Edit (Update) News by UUID
const editNews = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, description, createdAt} = req.body; // createdAt may be sent to REPLACE existing

    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'News ID is required',
      });
    }

    const snapshot = await db
      .collection('news')
      .where('id', '==', id)
      .limit(1)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({
        status: false,
        message: 'News not found',
      });
    }

    const docRef = snapshot.docs[0].ref;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;

    if (createdAt !== undefined) {
      const parsed = new Date(createdAt);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          status: false,
          message: 'Invalid createdAt value (must be ISO date string)',
        });
      }
      updatedData.createdAt = parsed.toISOString();
    }

    updatedData.updatedAt = new Date().toISOString();

    if (Object.keys(updatedData).length === 1) {
      // only updatedAt present
      return res.status(400).json({
        status: false,
        message: 'Nothing to update',
      });
    }

    await docRef.update(updatedData);

    return res.json({
      status: true,
      message: 'News updated successfully',
      data: {id, ...updatedData},
    });
  } catch (error) {
    console.error('Edit News Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to update news',
      error: error.message,
    });
  }
};

export {createNews, getAllNews, deleteNews, editNews};
