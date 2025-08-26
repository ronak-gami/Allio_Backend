import express from 'express';
import {createNews, getAllNews} from '../Controllers/news.controller.js';

const newsRouter = express.Router();

newsRouter.post('/', createNews);
newsRouter.get('/', getAllNews);

export default newsRouter;
