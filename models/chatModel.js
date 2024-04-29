var mongoose = require("mongoose");
const { String } = require("mongoose/lib/schema/index");
var Schema = mongoose.Schema;

var ChatSchema = new Schema(
  {
    chatType: {
      type: String,
      enum: ["single", "group"],
      default: "single",
    },
    groupName: String,
    groupPhoto: {
      type: String,
      default:
        "https://icon-library.com/images/group-chat-icon/group-chat-icon-13.jpg",
    },
    users: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    lastMsgSender: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    LastMessage: { type: String, required: true },
    messageTime: String,
    seen: { type: Boolean, default: false },
    seenBy: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    groupOwner: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      required: true,
      enum: ["text", "audio", "photo", "video", "alert", "post"],
    },
  },
  { timestamps: true }
);

ChatSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "users",
    select: "name email image",
  });
  this.populate({
    path: "groupOwner",
    select: "name email image",
  });
  this.populate({
    path: "seenBy",
    select: "name email image",
  });
  next();
});

module.exports = mongoose.model("Chat", ChatSchema);
