// external modules
const express = require("express");
require("dotenv").config();
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./Schema/typeDefs");
const connectDB = require("./config/mongooseDB");
const colors = require("colors");
const mergedResolvers = require("./Schema/resolvers");
const session = require("express-session");
const uuid = require("uuid");
const passport = require("passport");
const initPassport = require("./config/initPassport");

const clientUrl =
  process.env.NODE_ENV === "production"
    ? process.env.CLIENT_URL
    : "http://localhost:3000";

// passport initialization
initPassport();

// initialization
const app = express();
const port = process.env.PORT || 4000;

// database connection
connectDB();

// middleware
app.use(express.json());
// passport connection
app.use(
  session({
    genid: (req) => {
      return uuid.v4();
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// running async apollo server
async function runApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers: mergedResolvers,
    context: ({ req, res }) => ({ req, res }),
    // context: { models },
    introspection: true,
  });
  await server.start();
  server.applyMiddleware({ app });
}

runApolloServer();

// getting current time
const today = new Date();
const time =
  today.getHours() +
  ":" +
  today.getMinutes() +
  ":" +
  today.getSeconds() +
  "sec";

// storing current server url
const server_string =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${port}`
    : process.env.prod_server;

app.get("/", (req, res) =>
  res.status(200).send(
    `Welcome to MD ARIFUL HASAN portfolio server😍.
      Thanks for visiting this server🤝`
  )
);
// watching server on console with some styles
app.listen({ port: port }, () =>
  console.log(
    `==========================================================================================
    ${time.red.bold} 🚀 GraphQL ${process.env.NODE_ENV} sever endpoint ` +
      `${server_string}/graphql`.yellow.underline +
      `\n                📢 ${process.env.NODE_ENV} server url ${server_string}` +
      `   ➡️  port:${port}`.green
  )
);
