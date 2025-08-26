import express from 'express';
import {createNews, getAllNews} from '../Controllers/news.controller.js';

const newsRouter = express.Router();

newsRouter.post('/create', createNews);
newsRouter.get('/get-all', getAllNews);

export default newsRouter;
