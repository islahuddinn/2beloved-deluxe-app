const Notification = require("../models/notificationModel");
const Friend = require("../models/friendsModel");
const FriendRequest = require('../models/friendRequestModel')
const RefreshToken = require("../models/refreshTokenModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { SendNotification } = require("../utils/notification");
const factory = require("./handleFactory");


exports.getMyFriends = catchAsync(async(req,res,next)=>{
  const friends = await Friend.find({
    user: req.user._id
  })
  if(!friends){
    return next(new AppError("Could not fetch your friends. Try Again!",400))
  }

  res.status(200).json({
    success:true,
    status:200,
    message:"Your friendlist fetched successfully",
    length: friends.length,
    friends
  })
})


exports.checkFriendStatus = catchAsync(async(req,res,next)=>{
  const {userId} = req.params
  if(!userId){
    return next(new AppError("Please select the user whose friend status you want to check",400))
  }

  const user = await User.findById(userId)
  if(!user){
    return next(new AppError("User with this ID doesn't exist.",404))
  }

  const isFriend = await Friend.findOne({
    $and:[
      {user: req.user._id},
      {friend: user._id}
    ]
  })
  if(isFriend){
    return res.status(200).json({
      success: true,
      status:200,
      message: `${user.name} is in your friendlist`,
      friendStatus: 'friend'
    })
  }
  // else{
  //   return res.status(200).json({
  //     success:true,
  //     status:200,
  //     message: `${user.name} is not in your friendlist`,
  //     friendStatus: false
  //   })
  // }

  const requestSent = await FriendRequest.findOne({
    $and:[
      {requestSender:req.user._id},
      {requestReceiver: user._id},
      {status: 'pending'}
    ]
  })

  if(requestSent){
    return res.status(200).json({
      success: true,
      status:200,
      message: `${user.name} has not accepted your friend request yet`,
      friendStatus: 'request-sent'
    })
  }

  const requestReceived = await FriendRequest.findOne({
    $and:[
      {requestReceiver: req.user._id},
      {requestSender: user._id},
      {status: 'pending'}
    ]
  })

  if(requestReceived){
    return res.status(200).json({
      success: true,
      status:200,
      message: `Friend request from ${user.name} is still pending`,
      friendStatus: 'pending-request'
    })
  }
  
  return res.status(200).json({
    success: true,
    status:200,
    message: `${user.name} is not in your friendlist`,
    friendStatus: 'not-friend'
  })
})


exports.unfriend = catchAsync(async(req,res,next)=>{
  const {friendId} = req.params
  if(!friendId){
    return next(new AppError("Please select friend that you want to unfriend.",400))
  }

  const friendValid = await User.findById(friendId)
  if(!friendValid){
    return next(new AppError("Friend with this ID doesn't exist.",404))
  }

  console.log("FRIEND THAT YOU WANT TO REMOVE:", friendValid)

  const friends = await Friend.find({
    $or:[
      {user: req.user._id, friend: friendId},
      {user: friendId, friend: req.user._id}
    ]
  })

  console.log("FRIENDS UNFRIENDING:", friends)

  if(friends.length > 0){
    for(const friend of friends){
      await Friend.findByIdAndDelete(friend._id)
    }
  }

  res.status(200).json({
    success:true,
    status:200,
    message:`You unfriended ${friendValid.name} successfully`,
    data :null
  })



})









// exports.follow = catchAsync(async (req, res, next) => {
//   const followId = req.params.id;
//   const userId = req.user.id;

//   if (followId === userId)
//     return next(new AppError("You cannot be friend of yourself", 400));

//   // const preFollow = await Follow.findOne({
//   //   $and: [{ creator: userId }, { following: followId }],
//   // });

//   const preFollows = await Follow.find({
//     $or: [
//       { creator: userId , following: followId },
//       {creator: followId, following:userId}
//     ],
//   });

//   console.log("FRIENDS ARE:", preFollows)

//   if (preFollows.length > 0) {
//     for(const preFollow of preFollows){
//       await Follow.findByIdAndDelete(preFollow._id);
//     }
    

//     return res.status(200).json({
//       status: 200,
//       success: true,
//       message: "Unfriends Successfully",
//     });
//   } else {
//     await Follow.create([
//       { creator: userId, following: followId },
//       {creator: followId, following: userId}
//     ]);

//     res.status(200).json({
//       status: 200,
//       success: true,
//       message: "Friends Successfully",
//     });
//     if (req.query.notification) {
//       await Notification.findByIdAndUpdate(req.query.notification, {
//         isFollowAlert: false,
//       });
//     }
//     ////Notifications
//     const preFollowCheck = await Follow.findOne({
//       $and: [{ creator: followId }, { following: userId }],
//     });
//     const isNotFollowing = preFollowCheck ? false : true;

//     const [follower, creator] = await Promise.all([
//       User.findById(userId).select("name email image"),
//       User.findById(followId).select("name email image"),
//     ]);

//     await Notification.create({
//       sender: userId,
//       receiver: creator._id,
//       notifyType: "follow",
//       title: `${follower.name} Started Following you`,
//       text: ``,
//       isFollowAlert: isNotFollowing,
//       data: { user: userId },
//     });

//     const tokens = (await RefreshToken.find({ user: creator.id })).map(
//       ({ deviceToken }) => deviceToken
//     );

//     if (creator.isNotification) {
//       for (const deviceToken of tokens) {
//         await sendNotification({
//           token: deviceToken,
//           title: `${follower.name} Started Following you`,
//           body: ``,
//           data: {
//             value: JSON.stringify({ user: userId }),
//           },
//         });
//       }
//     }
//   }
// });

// exports.follow = catchAsync(async (req, res, next) => {
//   const friendId = req.params.id;
//   const userId = req.user.id;

//   if (friendId === userId)
//     return next(new AppError("You cannot be friend of yourself", 400));

//   const isAlreadyFriend = await Follow.findOne({
//     $or: [
//       { requester: userId, recipient: friendId },
//       { requester: friendId, recipient: userId },
//     ],
//     status: "accepted",
//   });

//   if (isAlreadyFriend) {
//     await Follow.findByIdAndDelete(isAlreadyFriend._id);

//     return res.status(200).json({
//       status: 200,
//       success: true,
//       message: "Unfriended Successfully",
//     });
//   } else {
//     const friendRequest = await Follow.create({
//       requester: userId,
//       recipient: friendId,
//       status: "pending",
//     });

//     res.status(200).json({
//       status: 200,
//       success: true,
//       message: "Friend request sent Successfully",
//     });

//     // Handle notifications
//     const sender = await User.findById(userId).select("name email image");
//     const receiver = await User.findById(friendId).select("name email image");

//     await Notification.create({
//       sender: userId,
//       receiver: friendId,
//       notifyType: "friend",
//       title: `${sender.firstName} ${sender.lastName} sent you a friend request`,
//       text: ``,
//       isFollowAlert: true, // Assuming it's always true for friend requests
//       data: { user: userId },
//     });

//     const tokens = (await RefreshToken.find({ user: friendId })).map(
//       ({ deviceToken }) => deviceToken
//     );

//     if (receiver.isNotification) {
//       for (const deviceToken of tokens) {
//         await sendNotification({
//           token: deviceToken,
//           title: `${sender.firstName} ${sender.lastName} sent you a friend request`,
//           body: ``,
//           data: {
//             value: JSON.stringify({ user: userId }),
//           },
//         });
//       }
//     }
//   }
// });

// //// Managing friend requests

// exports.manageFriendRequest = catchAsync(async (req, res, next) => {
//   const requestId = req.params.id;
//   const userId = req.user.id;
//   const { action } = req.query;

//   // Find the friend request
//   const friendRequest = await Follow.findOne({
//     _id: requestId,
//     recipient: userId,
//     status: "pending",
//   });

//   // If friend request not found, return an error
//   if (!friendRequest) {
//     return next(
//       new AppError("Friend request not found or already processed", 404)
//     );
//   }

//   // Perform the requested action
//   switch (action) {
//     case "accept":
//       // Update the friend request status to accepted
//       friendRequest.status = "accepted";
//       await friendRequest.save();

//       // Create a new friend entry
//       await Friend.create({
//         requester: friendRequest.requester,
//         recipient: userId,
//         status: "accepted",
//       });

//       return res.status(200).json({
//         status: 200,
//         success: true,
//         message: "Friend request accepted successfully",
//       });
//     case "reject":
//       // Update the friend request status to rejected
//       friendRequest.status = "rejected";
//       await friendRequest.save();

//       return res.status(200).json({
//         status: 200,
//         success: true,
//         message: "Friend request rejected successfully",
//       });
//     case "unfriend":
//       // Delete the friend entry
//       await Follow.deleteOne({
//         requester: friendRequest.requester,
//         recipient: userId,
//       });

//       return res.status(200).json({
//         status: 200,
//         success: true,
//         message: "Unfriended successfully",
//       });
//     default:
//       return next(new AppError("Invalid action", 400));
//   }
// });


// exports.getallFollow = catchAsync(async(req,res,next)=>{
//   console.log("USER LOGGED IN IS:",req.user)
//   console.log("LOGGED IN USER's ID is:",req.user._id)
//   const friends = await Follow.find({
//     creator: req.user._id
//   })

//   console.log(`FRIENDS OF ${req.user.name} ARE:`, friends)

//   if(!friends){
//     return next(new AppError("Error fetching friends.",400))
//   }

//   res.status(200).json({
//     success:true,
//     status:200,
//     message:`${req.user.name}'s friends fetched successfully`,
//     length: friends.length,
//     friends
//   })
// })

// exports.updateFollow = factory.updateOne(Follow);
// //exports.getallFollow = factory.getAll(Follow);
// exports.getOneFollow = factory.getOne(Follow);
// exports.deleteFollow = factory.deleteOne(Follow);
