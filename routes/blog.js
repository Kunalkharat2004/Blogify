const { Router } = require("express");
const cloudinary = require("../config/cloudinary");
const Blog = require("../models/blog");
const Comment = require("../models/comment");
const multer = require("multer");
const path = require("path");

const router = Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    if (!blog) {
      return res.status(404).render("error", { message: "Blog not found" });
    }

    const comments = await Comment.find({ blogId: req.params.id }).populate(
      "createdBy"
    );
    return res.render("blog", {
      user: req.user,
      blog,
      comments,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return res.status(500).render("error", { message: "Error loading blog" });
  }
});

router.post("/comment/:blogId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).redirect("/user/signin");
    }

    await Comment.create({
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).render("error", { message: "Error adding comment" });
  }
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).redirect("/user/signin");
    }

    const { title, body } = req.body;

    if (!req.file) {
      return res.render("addBlog", {
        error: "Please upload a cover image",
        user: req.user,
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blogify",
    });

    const blog = await Blog.create({
      title,
      body,
      coverImageURL: result.secure_url,
      createdBy: req.user._id,
    });

    return res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.render("addBlog", {
      error: "Error creating blog. Please try again.",
      user: req.user,
    });
  }
});

module.exports = router;
