import express from 'express';
import {
  createNews,
  deleteNews,
  editNews,
  getAllNews,
} from '../Controllers/news.controller.js';

const newsRouter = express.Router();

newsRouter.post('/', createNews);
newsRouter.get('/', getAllNews);
newsRouter.put('/:id', editNews);
newsRouter.delete('/:id', deleteNews);

export default newsRouter;
