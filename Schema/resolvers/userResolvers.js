const { GraphQLError } = require("graphql");
const models = require("../../models");
const bcrypt = require("bcrypt");
const {
  UserInputError,
  AuthenticationError,
} = require("apollo-server-express");
const { validateEmail, otpGeneratorFunc } = require("../../utils/general");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../../utils/nodemailer");

const userResolvers = {
  Query: {
    listUser: async (parent, args, context) => {
      return await models.DB_People.find({});
    },
    getUser: async (parent, args, context) => {
      return await models.DB_People.findById(args.id);
    },
    verifyOTP: async (parent, args, context) => {
      const { otp, email } = args;
      if (!otp || !email) {
        throw new UserInputError("❌ OTP or Email is missing!");
      }
      const matchedOtp = await models.DB_OTP.findOne({
        otp: otp,
        userEmail: email,
      });

      if (!matchedOtp) {
        return false;
      } else {
        return true;
      }
    },
    loginUser: async (parent, args, { req, res }) => {
      const { email, password } = args;
      if (!email || !password) {
        throw new UserInputError("❌ Email or Password is missing!");
      }

      const matchedUser = await models.DB_People.findOne({ email: email });
      if (!matchedUser) {
        throw new Error("❌ User not found!");
      }
      const isMatched = await bcrypt.compare(password, matchedUser.password);
      if (!isMatched) {
        throw new Error("❌ Password is incorrect!");
      }

      // generate token for cookies
      const token = jwt.sign(
        {
          userId: matchedUser._id,
          userEmail: matchedUser.email,
          userRole: matchedUser.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
      );

      return {
        userId: matchedUser._id,
        userRole: matchedUser.role,
        token: token,
        tokenExpiration: process.env.JWT_EXPIRY,
      };
    },
    currentUser: async (parent, args, { req, res }) => {
      if (!req.isAuth || !req.userId) {
        return;
      }
      try {
        const user = await models.DB_People.findById(req.userId);
        if (!user) {
          throw new Error("User not found! Please login first!");
        }
        return {
          ...user._doc,
          id: user._id,
          password: "secured_password",
        };
      } catch (err) {
        throw new Error(err.message);
      }
    },
  },

  Mutation: {
    getOtp: async (parent, { email }, context) => {
      if (!email) {
        throw new UserInputError("Email is missing!");
      }
      // regex email validation
      if (!validateEmail(email)) {
        throw new UserInputError("Invalid Email!");
      }
      try {
        // check if email already exists
        const matchedUser = await models.DB_OTP.findOne({ userEmail: email });

        if (matchedUser) {
          throw new UserInputError(
            `OTP already sent to ${email}. Please try again after 5 minutes.`
          );
        }
        // generating OTP
        const genOtp = otpGeneratorFunc();

        const newOtp = new models.DB_OTP({
          otp: genOtp,
          userEmail: email,
          medium: "email",
        });

        await newOtp.save();

        await sendOtpEmail(
          email,
          "Please use this following OTP to complete register!",
          genOtp
        );
        return `OTP sent to ${email}`;
      } catch (err) {
        console.log("Failed to send otp: \n", err);
        throw new GraphQLError(`${err.message}`);
      }
    },
    createUser: async (parent, args, context) => {
      try {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
        // regex email validation
        if (!validateEmail(args.input.email)) {
          throw new UserInputError("Invalid Email!");
        }
        // check if email already exists
        const matchedUser = await models.DB_People.findOne({
          email: args.input.email,
        });
        if (matchedUser) return new UserInputError("Email already exists!");
        // hashing password
        const hashedPassword = await bcrypt.hash(args.input.password, salt);
        if (!hashedPassword) throw new Error("Failed to hash password");
        // creating new user
        const newUser = new models.DB_People({
          name: args.input.name,
          email: args.input.email,
          password: hashedPassword,
          avatar: args.input.avatar || "",
          role: args.input.role,
          dialCode: args.input.dialCode || "",
          phone: args.input.phone || null,
        });
        // saving new user to database
        const result = await newUser.save();

        return {
          ...result._doc,
          id: result._id,
          password: "secured_password",
        };
      } catch (err) {
        console.log("❌ Failed to register user: \n", err);
        console.log(err.keyValue);
        if (err.code === 11000) {
          let errField = Object.keys(err.keyValue)[0];
          throw new UserInputError(`${errField} already exists in Database!`);
        } else {
          throw new GraphQLError(`${err.message}`);
        }
      }
    },
    updateUser: async (parent, args, context) => {
      if (!context.req.isAuth) {
        throw new AuthenticationError("Unauthenticated!");
      }
      try {
        const updatedUserInfo = new models.DB_People({
          _id: args.id,
          name: args.input.name,
          avatar: args.input.avatar,
          dialCode: args.input.dialCode,
          phone: args.input.phone,
        });

        return await models.DB_People.findOneAndUpdate(
          { _id: args.id },
          updatedUserInfo,
          {
            new: true,
          }
        );
      } catch (err) {
        throw new GraphQLError(`${err.message}`);
      }
    },
    updateUserRole: async (parent, args, context) => {
      if (!context.req.isAuth) {
        throw new AuthenticationError("Unauthenticated!");
      }
      const updatedUserRole = new models.DB_People({
        _id: args.id,
        role: args.input.role,
      });

      return await models.DB_People.findOneAndUpdate(
        { _id: args.id },
        updatedUserRole,
        {
          new: true,
        }
      );
    },
    deleteUser: async (parent, args, context) => {
      console.log("is Auth", context.req.isAuth);
      console.log("userID", context.req.userId);
      console.log("userRole", context.req.userRole);
      if (!context.req.isAuth) {
        throw new AuthenticationError("Unauthenticated!");
      }

      return await models.DB_People.findByIdAndDelete(args.id);
    },
  },
};

module.exports = userResolvers;
