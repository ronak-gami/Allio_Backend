import db from "../Config/firebaseConfig.js";

// Create News
const createNews = async (req, res) => {
  const { name, description, image } = req.body;

  if (!name || !description || !image) {
    return res.status(400).json({
      status: false,
      message: !name
        ? "Name is required"
        : !description
        ? "Description is required"
        : "Image is required",
    });
  }

  console.log(req.body);

  try {
    const newsRef = db.collection("news").doc();
    const newNews = {
      id: newsRef.id,
      name,
      description,
      image,
      createdAt: new Date(),
    };

    await newsRef.set(newNews);

    return res.status(201).json({
      status: true,
      message: "News created successfully",
      data: newNews,
    });
  } catch (error) {
    console.error("Create News Error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};

// Get All News
const getAllNews = async (req, res) => {
  try {
    const snapshot = await db
      .collection("news")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return res.json({ status: true, message: "No news found", data: [] });
    }

    const newsList = snapshot.docs.map((doc) => doc.data());

    return res.json({ status: true, data: newsList });
  } catch (error) {
    console.error("Get News Error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};

export { createNews, getAllNews };
