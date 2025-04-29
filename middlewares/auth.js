const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

async function verifyUser(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  jwt.verify(token, "shivam", async (err, decoded) => {
    if (err) return res.redirect("/login");
    req.user = await userModel.findOne({ email: decoded.email });
    if (!req.user) return res.redirect("/login");
    next();
  });
}

module.exports = verifyUser;
