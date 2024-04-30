const mongoose = require("mongoose");
const { save } = require("../controllers/saveController");

const seenSchema = new mongoose.Schema(
  {
    seen: {
      type: mongoose.Schema.ObjectId,
      refPath: "seen_model_type",
    },
    seen_model_type: {
      type: String,
      enum: ["Story"],
      default: "Story",
    },
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

seenSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "creator",
  });
  next();
});

const Seen = mongoose.model("Seen", seenSchema);

module.exports = Seen;
