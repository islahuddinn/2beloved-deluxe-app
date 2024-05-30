const FriendRequest = require('../models/friendRequestModel')
const Friend = require('../models/friendsModel')
const RefreshToken = require("../models/refreshTokenModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Notification = require("../models/notificationModel");
const  SendNotification  = require('../utils/notification')
const factory = require("./handleFactory");


exports.getMyFriendRequests = catchAsync(async(req,res,next)=>{
    const friendRequests = await FriendRequest.find({
        $and:[
            {requestReceiver: req.user._id},
            {status: 'pending'}
        ]
    })

    if(!friendRequests){
        return next(new AppError("Error fetching friend requests.Try Again!",400))
    }

    res.status(200).json({
        success: true,
        status:200,
        message:"Your Friend Requests fetched successfully",
        length: friendRequests.length,
        friendRequests

    })
})

exports.createFriendRequest = catchAsync(async(req,res,next)=>{
    const {requestReceiverId} = req.params
    if(!requestReceiverId){
        return next(new AppError("Please select the user to whom you want to send friend request.",400))
    }

    const requestReceiver = await User.findById(requestReceiverId)

    if(!requestReceiver){
        return next(new AppError("User with this ID doesn't exist",404))
    }

    if(requestReceiver._id === req.user._id.toString){
        return next(new AppError("You cannot send a friend request to yourself.",400))
    }

    const friendExists = await Friend.findOne({
        $and:[
            {user: req.user._id},
            {friend: requestReceiver._id}
        ]
    })

    if(friendExists){
        return next(new AppError(`You are already friends with ${requestReceiver.name}.`,400))
    }

    const request = await FriendRequest.create({
        requestSender: req.user._id,
        requestReceiver: requestReceiver._id,
        status: 'pending'
    })

    if(!request){
        return next(new AppError("Could not create friend request.Try Again!",400))
    }

    await Notification.create({
        sender: req.user._id,
        receiver: requestReceiver._id,
        notifyType: "friend-request",
        title: `${req.user.name} sent you a Friend Request`,
        text: ``,
        //isFollowAlert: isNotFollowing,
        data: { user: req.user._id },
      });
  
      const tokens = (await RefreshToken.find({ user: requestReceiver._id })).map(
        ({ deviceToken }) => deviceToken
      );
  
      if (requestReceiver.isNotification) {
        for (const deviceToken of tokens) {
          await SendNotification({
            token: deviceToken,
            title: `${req.user.name} sent you a Friend Request`,
            body: ``,
            data: {
              value: JSON.stringify({ user: req.user._id }),
            },
          });
        }
      }

    res.status(201).json({
        success: true,
        status:201,
        message: `Your friend request to ${requestReceiver.name} has been sent successfully`,
        request
    })
})


exports.changeRequestStatus = catchAsync(async(req,res,next)=>{
    const {friendRequestId} = req.params
    const {status} = req.body
    if(!friendRequestId){
        return next(new AppError("Please choose which friend request you want to accept or delete",400))
    }

    if(!status){
        return next(new AppError("Please select whether you want to accept or reject the friend request",400))
    }

    const friendRequest = await FriendRequest.findById(friendRequestId)
    if(!friendRequest){
        return next(new AppError("Friend Request with this ID doesn't exist.",400))
    }

    if(friendRequest.requestReceiver._id !== req.user._id){
        return next(new AppError("This request wasn't sent to you. You cannot change its status.",400))
    }

    friendRequest.status = status

    await friendRequest.save()

    if(friendRequest.status === 'accept'){
        console.log("ADDING FRIEND")
      const friendAdded =  await Friend.create([
            {user: friendRequest.requestSender._id, friend: friendRequest.requestReceiver._id},
            {user: friendRequest.requestReceiver._id, friend: friendRequest.requestSender._id}
        ])

        console.log("FRIEND ADDED IS:",friendAdded)

        if(!friendAdded){
            return next(new AppError("Could not add friend.",400))
        }

        await Notification.create({
            sender: req.user._id,
            receiver: friendRequest.requestSender._id,
            notifyType: "new-friend",
            title: `${req.user.name} accepted your Friend Request`,
            text: ``,
            //isFollowAlert: isNotFollowing,
            data: { user: req.user._id },
          });
      
          const tokens = (await RefreshToken.find({ user: friendRequest.requestSender._id })).map(
            ({ deviceToken }) => deviceToken
          );
      
          if (requestReceiver.isNotification) {
            for (const deviceToken of tokens) {
              await SendNotification({
                token: deviceToken,
                title: `${req.user.name} accepted your Friend Request`,
                body: ``,
                data: {
                  value: JSON.stringify({ user: req.user._id }),
                },
              });
            }
          }
    }
    

    res.status(200).json({
        success: true,
        status:200,
        message: `Friend Request of ${friendRequest.requestSender.name} ${status}ed successfully`,
        friendRequest
    })
})



 