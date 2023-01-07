// external imports
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// schema
const otpSchema = Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      ref: "People",
    },
    medium: {
      type: String,
      required: true,
    },
    expireAt: {
      type: Date,
      default: Date.now,
      index: { expires: "5m" },
    },
  },
  {
    timestamps: true,
  }
);

// model
const Otp = model("OTP", otpSchema);

module.exports = Otp;
