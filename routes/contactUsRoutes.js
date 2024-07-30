const express = require('express')

const authController = require('../controllers/authController')
const contactUsController = require('../controllers/contactUsController')



const router = express.Router()

router.post('/create-contact-us', authController.protect, authController.restrictTo('user'),  contactUsController.createContactUs)

router.get('/get-all-contact-requests', authController.protect, authController.restrictTo('admin'), contactUsController.getAllContactRequests)

router.delete('/delete-contact-request/:id', authController.protect, authController.restrictTo('admin'), contactUsController.deleteContactRequest )




module.exports  = router