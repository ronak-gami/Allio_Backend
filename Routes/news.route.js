import express from "express";
import { createNews, getAllNews } from "../Controllers/news.controller.js";

const newsRouter = express.Router();

newsRouter.post("/news", createNews); // Create news
newsRouter.get("/news", getAllNews); // Get all news

export default newsRouter;
