const Block = require('../models/blockModel')
const User = require('../models/userModel')
const AppError = require("../utils/appError");
const Friend  = require('../models/friendsModel')
const catchAsync = require("../utils/catchAsync");




exports.blockUser = catchAsync(async(req,res,next)=>{
    const {blockedUserId} = req.params
    const { reason } = req.body
    if(!blockedUserId){
        return next(new AppError("please select the user who you want to block",400))
    }
    const blockedUser = await User.findById(blockedUserId)
    if(!blockedUser){
        return next(new AppError("USer with this ID doesn;t exist",404))
    }
    const preBlock = await Block.findOne({
        $and:[
            {blockedBy: req.user._id},
            {blockedUser: blockedUser._id}
        ]
    })

    if(preBlock){
        await Block.findByIdAndDelete(preBlock._id)
        return res.status(200).json({
            success: true,
            status: 200,
            message: `${blockedUser.name} has been unblocked`,
        })
    }

    const block = await Block.create({
        blockedUser: blockedUser._id,
        blockedBy: req.user._id,
        reason
    })

    if(!block){
        return next(new AppError("Error while blocking user. Try Again!",400))
    }

   const friends = await Friend.find({
        $or:[
            {user: req.user._id, friend: blockedUser._id},
            {user:blockedUser._id, friend: req.user._id }
        ]
    })

    if(friends.length > 0){
        for (const friend of friends){
            await Friend.findByIdAndDelete(friend._id)
        }
    }

    res.status(200).json({
        success: true,
        status:200,
        message: `${blockedUser.name} has been blocked successfully`,   
    })
})



exports.getAllBlockedUsers = catchAsync(async(req,res,next)=>{
    const blockedUsers = await Block.find({
        blockedBy: req.user._id
    })

    if(!blockedUsers){
        return next(new AppError("Error fetching blocked users.",400))
    }

    res.status(200).json({
        success: true,
        status:200,
        message:"Blocked users fetched successfully",
        blockedUsers
    })
})