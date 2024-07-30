const ReportPost = require('../models/reportPostModel')
const User = require('../models/userModel')
const Post = require('../models/postModel')
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");



// exports.reportPost = catchAsync(async(req,res,next)=>{
//     const {postId} = req.params
//     if(!postId){
//         return next(new AppError("Please select the post that you want to report",400))
//     }

//     const post = await Post.findById(postId)
//     if(!post){
//         return next(new AppError("Post with this ID doesn't exist.",404))
//     }

//     const report = await ReportPost.create({
//         post:post._id,

//     })
// }) 