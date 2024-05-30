const mongoose = require("mongoose");




const friendSchema = new mongoose.Schema(
  {
    user:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required:[true, "select the user who is adding friend"]
    },
    friend:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required:[true,'select who you are adding as a friend']
    }
  },
  {
    timestamps: true,
  }
);

friendSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "user",
    select: 'name image'
  });
  this.populate({
    path: "friend",
    select: "name image",
  });
  next();
});

const Friend = mongoose.model("Friend", friendSchema);

module.exports = Friend;





// const followSchema = new mongoose.Schema(
//   {
//     following: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     creator: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     // status: {
//     //   type: String,
//     //   enum: ["pending", "accepted", "rejected"],
//     //   default: "pending",
//     // },
//   },
//   {
//     timestamps: true,
//   }
// );

// followSchema.pre([/^find/, "save"], function (next) {
//   this.populate({
//     path: "creator",
//   });
//   this.populate({
//     path: "following",
//     select: "name email image",
//   });
//   next();
// });

// const Follow = mongoose.model("Follow", followSchema);

// module.exports = Follow;
