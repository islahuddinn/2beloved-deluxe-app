const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: [
      {
        link: String,
        type: {
          type: String,
          enum: ["image", "video", "text"],
          message: "please enter valid type: image/video",
          default: "text",
        },
        thumbnail: String,
      },
    ],
    text: String,
    tags: [String],
    location: {
      // Geo JSON Object
      type: {
        type: String,
        default: "Point",
      },
      coordinates: { type: [Number], default: [0.0, 0.0] },
      address: String,
      description: String,
    },
    preferences: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Preference",
      },
    ],
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ location: "2dsphere" });

postSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "creator",
  });
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
