const mongoose = require('mongoose')


const reportPostSchema = new mongoose.Schema({
    post:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required:[true,'Please select the post that you are reporting']
    },

    reportedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true,'User is a required field']
    },

    reportReason:{
        type: String,
        required:[true, 'Please provide the report reason']
    },

    reportCount:{
        type: Number,
        default: 0
    }

},{timestamps:true})


reportPostSchema.pre([/^find/, 'save'], function(next){
    this.populate({
        path:'post'
    })
    next()
})

const ReportPost = mongoose.model('ReportPost', reportPostSchema)


module.exports = ReportPost