const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token || token === "") {
    req.isAuth = false;
    next();
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decodedToken", decodedToken);
    req.isAuth = true;
    req.userId = decodedToken.userId;
    req.userEmail = decodedToken.userEmail;
    req.userRole = decodedToken.userRole;
    next();
  } catch (err) {
    req.isAuth = false;
    return next();
  }
};
