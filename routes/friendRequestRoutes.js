const express = require('express')
const friendRequestController = require('../controllers/friendRequestController')
const authController = require('../controllers/authController')



const router = express.Router()

router.get('/get-my-requests', authController.protect, friendRequestController.getMyFriendRequests)

router.post('/send-request/:requestReceiverId', authController.protect, friendRequestController.createFriendRequest)

router.post('/change-request-status/:friendRequestId', authController.protect, friendRequestController.changeRequestStatus)





module.exports = router