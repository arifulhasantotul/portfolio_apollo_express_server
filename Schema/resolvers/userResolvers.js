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
    loginUser: async (parent, args, context) => {
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

      const token = jwt.sign(
        {
          userId: matchedUser._id,
          userEmail: matchedUser.email,
          userRole: matchedUser.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "48h" }
      );
      return {
        userId: matchedUser._id,
        userRole: matchedUser.role,
        token: token,
        tokenExpiration: 48,
      };
    },
  },

  Mutation: {
    getOtp: async (parent, { email }, context) => {
      if (!email) {
        throw new UserInputError("❌ Email is missing!");
      }
      if (!validateEmail(email)) {
        throw new UserInputError("❌ Invalid Email!");
      }

      const matchedUser = await models.DB_OTP.findOne({ userEmail: email });

      if (matchedUser) {
        throw new UserInputError(
          `❌ otp already sent to ${email}. Please try again after 5 minutes.`
        );
      }
      const genOtp = otpGeneratorFunc();

      try {
        const newOtp = new models.DB_OTP({
          otp: genOtp,
          userEmail: email,
          medium: "email",
        });

        await newOtp.save();

        await sendOtpEmail(email, genOtp);
        return `✅ OTP sent to ${email}`;
      } catch (err) {
        console.log("❌ Failed to send otp: \n", err);
        throw new GraphQLError(`❌ Failed to register user: \n ${err.message}`);
      }
    },
    createUser: async (parent, args, context) => {
      try {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
        if (!validateEmail(args.input.email)) {
          throw new UserInputError("❌ Invalid Email!");
        }
        const hashedPassword = await bcrypt.hash(args.input.password, salt);
        if (!hashedPassword) throw new Error("❌ Failed to hash password");

        const newUser = new models.DB_People({
          name: args.input.name,
          email: args.input.email,
          password: hashedPassword,
          avatar: args.input.avatar || "",
          role: args.input.role,
          dialCode: args.input.dialCode || "",
          phone: args.input.phone || null,
        });
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
          throw new UserInputError(
            `❌ ${errField} already exists in Database!`
          );
        } else {
          throw new GraphQLError(
            `❌ Failed to register user: \n ${err.message}`
          );
        }
      }
    },
    updateUser: async (parent, args, context) => {
      if (!context.req.isAuth) {
        throw new AuthenticationError("❌ Unauthenticated!");
      }
      const updatedUserInfo = new models.DB_People({
        _id: args.id,
        name: args.input.name,
        password: args.input.password,
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
    },
    updateUserRole: async (parent, args, context) => {
      if (!context.req.isAuth) {
        throw new AuthenticationError("❌ Unauthenticated!");
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
        throw new AuthenticationError("❌ Unauthenticated!");
      }

      return await models.DB_People.findByIdAndDelete(args.id);
    },
  },
};

module.exports = userResolvers;
