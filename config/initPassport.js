const { AuthenticationError } = require("apollo-server-express");
const passport = require("passport");
const { DB_People } = require("../models");
const { validateEmail, loginStrategies } = require("../utils/general");
const LocalStrategy = require("passport-local");

const initPassport = () => {
  passport.use(
    new LocalStrategy(async (email, password, done) => {
      try {
        const matchedUser = await DB_People.findOne({ email: email });
        if (!matchedUser) return done(null, false);
        if (matchedUser.password !== password) return done(null, false);
        return done(null, matchedUser);
      } catch (err) {
        return done(err, false);
      }
    })
  );
  passport.serializeUser((user, done) => {
    console.log("✅ Serialize User: ", user);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log("✅ Deserialize User: ", id);
    try {
      const matchedId = await DB_People.findById(id);
      done(null, matchedId);
    } catch (err) {
      done(err, false);
    }
  });
};

module.exports = initPassport;
