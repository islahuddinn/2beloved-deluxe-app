const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "must enter email"],
      //   lowercase: truee,
      validate: [validator.isEmail, "please provide a valid email"],
    },
    image: {
      type: String,
      default:
        "https://icon-library.com/images/default-profile-icon/default-profile-icon-6.jpg",
    },
    location: {
      // Geo JSON Object
      type: {
        type: String,
        default: "Point",
      },
      coordinates: { type: [Number], default: [0.0, 0.0] },
      address: String,
      description: String,
    },
    boostStartDate: {
      type: Date,
    },
    boostEndDate: {
      type: Date,
    },
    boostActive: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Enter valid gender",
      },
    },
    haveChildren: {
      type: String,
      enum: ["Yes", "No"],
    },
    isVaccinated: {
      type: String,
      enum: ["Yes", "No"],
    },
    description: {
      type: String,
    },
    age: {
      type: Number,
    },
    height: {
      type: String,
    },
    doYouSmoke: {
      type: String,
      enum: ["Yes", "No"],
    },
    password: {
      type: String,
      required: [true, "must enter password"],
      minlength: 8,
      select: false,
    },

    customerId: String,
    subscriptionId: String,
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    subscriptionPlan: {
      type: String,
      enum: {
        values: ["free", "monthly"],
        message: "Enter valid plan ",
      },
      default: "free",
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "user"],
        message: "Enter valid role ",
      },
      default: "user",
    },
    otp: {
      type: Number,
    },
    otpExpires: Date,
    deviceToken: String,
    verified: {
      type: Boolean,
      default: false,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    facebook: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    tiktok: {
      type: String,
      trim: true,
    },
    spotify: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function (next) {
  //only run this function if password id actually modified
  if (!this.isModified("password")) return next();
  // Hash the password with cost
  this.password = await bcrypt.hash(this.password, 12);
  // remove(stop) the confirmPassword to store in db. require means necessary to input not to save in db.
  this.confirmPassword = undefined;
  next();
});
// password Tester
userSchema.methods.correctPassword = async function (
  passwordByUser,
  passwordInDb
) {
  return await bcrypt.compare(passwordByUser, passwordInDb);
};

// ========method to protect routes verifies all about token

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// update "passwordChangedAt value in DB whenever we update password "
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //here -1000 mili seconds is to make sure that it will not creat any problem in login as some times that gets this
  next();
});

// Middleware to only get active=true users
userSchema.pre(/^find/, function (next) {
  // here "this" points to the current property`
  this.find({ active: true });
  next();
});
const User = mongoose.model("User", userSchema);
module.exports = User;
