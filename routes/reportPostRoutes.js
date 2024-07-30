const express = require('express')

const authController = require('../controllers/authController')
const reportPostController = require('../controllers/reportPostController')



const router = express.Router()

router.post('/report-post/:postId', authController.protect, authController.restrictTo('user'), reportPostController.reportPost)
//router.get('/get-all-blocked-users', authController.protect, reportPostController.getAllBlockedUsers)




module.exports  = router