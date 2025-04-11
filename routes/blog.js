const { Router } = require("express");
const cloudinary = require("../config/cloudinary");
const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.post("/", async (req, res) => {
  const { title, body } = req.body;
  const file = req.files.coverImage;

  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
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
    console.error(error);
    return res.render("addBlog", {
      error: "Error creating blog. Please try again.",
    });
  }
});

module.exports = router;
