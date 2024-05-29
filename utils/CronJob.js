const cron = require("node-cron");
const moment = require("moment");
const User = require("../models/userModel");

const checkBoostExpiry = async () => {
  try {
    const users = await User.find({
      "boost.isBoostActive": true,
    });
    console.log("USERS WITH BOOST ACTIVE ARE:", users);
    if (users.length > 0) {
      
      for (const user of users) {
        const currentDate = new Date();
        if (currentDate > user.boost.boostExpireDate) {
          user.boost.isBoostActive = false;
          user.boost.boostStartDate = undefined;
          user.boost.boostExpireDate = undefined;

          await user.save();
        }
      }
    }else{
      console.log("NO USER FOUND WITH ACTIVE BOOST STATUS")
    }
  } catch (error) {
    console.log("ERROR WHILE CHECKING BOOST EXPIRY CRON JOB:", error);
  }
};
module.exports = () => {
  cron.schedule("* * * * *", async () => {
    console.log("CRON JOB STARTED!!!");
    await checkBoostExpiry();
  });
};
