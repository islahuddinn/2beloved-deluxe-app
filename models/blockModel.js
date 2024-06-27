const mongoose = require('mongoose')



const blockSchema = new mongoose.Schema({
    blockedUser:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:[true,'Please provide the user which you want to block']
    },

    blockedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:[true,'Blocked by is a required field.']
    },

    reason:{
        type: String
    }
},{timestamps:true})

blockSchema.pre([/find^/, 'save'], function(next){
    this.populate({
        path:'blockedUser',
        select: 'name image email'
    });

    this.populate({
        path: 'blockedBy',
        select: 'name image email'
    })

    next()
})

blockSchema.pre([/find^/, 'save'], function(next){
    this.populate({
        path:'blockedUser',
        select: 'name avatar email'
    });

    this.populate({
        path: 'blockedBy',
        select: 'name avatar email'
    })

    next()
})

const Block = mongoose.model('Block', blockSchema)

module.exports = Block