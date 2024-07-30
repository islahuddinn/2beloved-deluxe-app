const ContactUs = require('../models/contactUsModel')
const User = require('../models/userModel')
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require('./handleFactory')



exports.createContactUs = catchAsync(async(req,res,next)=>{
    const { reason, description} = req.body

    const newContactUs = await ContactUs.create({
        name: req.user.name,
        email: req.user.email,
        reason,
        description,
        user: req.user._id
    })

    if(!newContactUs){
        return next(new AppError("Error while creating your contact request. Try AgaiN!",400))
    }


    res.status(201).json({
        success: true,
        status:201,
        message:"Your query has been submitted successfully",
        newContactUs
    })
})




exports.getAllContactRequests = factory.getAll(ContactUs)
exports.getOneContactRequest = factory.getAll(ContactUs)
exports.deleteContactRequest = factory.getAll(ContactUs)

