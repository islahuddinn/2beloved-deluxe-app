const mongoose = require("mongoose");

const reportPostSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Please select the post that you are reporting"],
    },

    reportedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          //required: [true, "User is a required field"],
        },

        reason:{
            type: String,
           // required:[true,"Please provide a reason for your report"]
        }
      },
    ],

    reportCount: {
      type: Number,
      default: 0,
    },

    isReportExceeded:{
        type: Boolean,
        default: false
    },

    status:{
        type: String,
        enum:{
            values:['pending', 'reviewed'],
            message:"Please select valid status value"
        },

        default: 'pending'
    }
  },
  { timestamps: true }
);

reportPostSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "post",
  });
  this.populate({
    path: "reportedBy.user",
    select: "name image email",
  });
  next();
});

const ReportPost = mongoose.model("ReportPost", reportPostSchema);

module.exports = ReportPost;
