const cron = require("node-cron");
const moment = require("moment");
const User = require("../models/userModel");

const checkBoostExpiry = async () => {
  
    try {
      const users = await User.find();
      const allUsersLength = users.length
      console.log("ALL USERS:", users)
      console.log("ALL USERS LENGTH:", allUsersLength)
      const boostedUsers = users.filter((user)=> user.boost.isBoostActive === true)
     const boostedUsersLength = boostedUsers.length
     console.log("--------------------------------------------------------------")
  
     console.log("BOOSTED USERS ARE:", boostedUsers)
     console.log("BOOSTED USERS LENGTH IS:", boostedUsersLength)

     const currentDate = new Date()

     for(const user of boostedUsers){
      if(currentDate > user.boost.boostExpireDate){
        console.log("BOOST EXPIRED CHANGING STATUS")
        user.boost.isBoostActive = false
        user.boost.boostStartDate = undefined
        user.boost.boostExpireDate = undefined
        await user.save()
      }else{
        console.log("BOOST IS NOT EXPIRED YET")
      }
     }
      
    } catch (error) {
      console.log("ERRROR WHILE EXPIRING BOOST IN CRON JOB:", error)
    }
   
};
module.exports = () => {
  cron.schedule("* * * * *", async () => {
    console.log("CRON JOB STARTED!!!");
    await checkBoostExpiry();
  });
};
