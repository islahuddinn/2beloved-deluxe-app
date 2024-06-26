const express = require('express')

const authController = require('../controllers/authController')
const blockController = require('../controllers/blockController')



const router = express.Router()

router.post('/block-user/:blockedUserId', authController.protect, blockController.blockUser)
router.get('/get-all-blocked-users', authController.protect, blockController.getAllBlockedUsers)




module.exports  = router