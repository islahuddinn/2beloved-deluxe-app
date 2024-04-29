const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    content: {
      type: String,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    thumbnail: String,
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    expiresAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

storySchema.virtual("views", {
  ref: "Seen",
  foreignField: "seen",
  localField: "_id",
});

storySchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "name email image",
  });
  this.populate({
    path: "views",
    select: "creator",
  });
  next();
});

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
