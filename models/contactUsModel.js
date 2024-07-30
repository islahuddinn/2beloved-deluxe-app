const mongoose = require('mongoose')



const contactUsSchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name:{
        type: String,
        required:[true,"Please provide your name"]
    },

    email:{
        type: String,
        required:[true,"Please provide your email"]
    },

    reason:{
        type: String,
        required:[true,"Please provide reason for your query"]

    },

    description:{
        type: String,
        required:[true,"Please provide description for your reason"]
    }

},{timestamps:true})


contactUsSchema.pre([/^find/, 'save'], function(next){
    this.populate({
        path: 'user',
        select: 'name image email'
    })

    next()
})

const ContactUs = mogoose.model('ContactUs', contactUsSchema)


module.exports = ContactUs