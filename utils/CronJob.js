const cron = require("node-cron");
const moment = require("moment");
const User = require("../models/userModel");

const checkBoostExpiry = async () => {
  
    const users = await User.find();
    const allUsersLength = users.length
    console.log("ALL USERS:", users)
    console.log("ALL USERS LENGTH:", allUsersLength)
    const boostedUsers = users.filter((user)=> user.boost.isBoostActive === 'true')
   const boostedUsersLength = boostedUsers.length
   console.log("--------------------------------------------------------------")

   console.log("BOOSTED USERS ARE:", boostedUsers)
   console.log("BOOSTED USERS LENGTH IS:", boostedUsersLength)
    
   
};
module.exports = () => {
  cron.schedule("* * * * *", async () => {
    console.log("CRON JOB STARTED!!!");
    await checkBoostExpiry();
  });
};
