const mongoose = require('mongoose')


const friendRequestSchema = new mongoose.Schema({
    requestSender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:[true,'user who is sending the friend request not found']
    },

    requestReceiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:[true,'Please select who you are sending the request to.']
    },

    status:{
        type: String,
        enum:{
            values:['accept','reject','pending'],
            message:"Select valid status value for friend request"
        },
        default: 'pending'
    }
},{timestamps:true})


friendRequestSchema.pre([/^find/, 'save'], function(next){
    this.populate({
        path: 'requestSender',
        select: 'name image'
    })

    this.populate({
        path: 'requestReceiver',
        select: 'name image'
    })

    next()
})


const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema)


module.exports = FriendRequest