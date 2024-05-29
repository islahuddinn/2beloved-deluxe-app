const cron = require("node-cron");
const moment = require("moment");
const User = require('../models/userModel');


const checkBoostExpiry = async () => {
  try {
    const currentDate = new Date();
    
    const users = await User.find({
      "boost.isBoostActive": true,
      "boost.boostExpireDate": { $exists: true, $lte: currentDate }
    });

    if (users.length > 0) {
      
      const bulkOps = users.map(user => ({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              "boost.isBoostActive": false,
              "boost.boostStartDate": undefined,
              "boost.boostExpireDate": undefined
            }
          }
        }
      }));

      await User.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.log("ERROR WHILE CHECKING BOOST EXPIRY CRON JOB:", error);
  }
};
module.exports = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("CRON JOB STARTED!!!");
    await checkBoostExpiry();
    
  });
};