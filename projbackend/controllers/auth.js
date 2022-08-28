/* express-jwt is built on top of the jsonwebtoken package and does a bunch of 
additional cool things.
 You still use jsonwebtoken to sign and verify your JWTs, 
 but express-jwt helps you protect routes,
 checks JWTs against a secret, 
 and creates a req.user from the payload of the token if it can verify it.*/

const User = require("../models/user");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

exports.signup = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg
    });
  }

  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        err: "NOT able to save user in DB"
      });
    }
    res.json({
      name: user.name,
      email: user.email,
      id: user._id
    });
  });
};

exports.signin = (req, res) => {
  const errors = validationResult(req);
  const { email, password } = req.body;

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }
  User.findOne({ email }, (err, user) => {
    if (err||!user) {
      res.status(400).json({
        error: "user email does not exist",
      });
    }
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "credentials do not match",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET);

    res.cookie("token", token, { expire: new Date() + 9999 });

    //for sending to front end
    const { _id, name, email, role } = user;
    return res.json({ token, user: { _id, name, email, role } });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token")
  res.json({
    message: "User Signed out",
  });
};


exports.isSignedIn = expressJwt({
  secret: process.env.SECRET,
  userProperty: "auth"
})

exports.isAuthenticated = (req, res, next) => {
  // console.log(req.profile)
  // console.log(req.auth)
  // console.log(req.profile._id)
  // console.log(req.auth._id)
  // it checks if req.profile and req.auth exist then compares profile id with auth id
  let checker = req.profile && req.auth && req.profile._id == req.auth.id;
  if (!checker) {
    return res.status(403).json({
      error: "ACCESS DENIED"
    });
  }
  next();
};

exports.isAdmin= (req,res,next)=>{
  if(req.profile.role===0){
    return res.status(403).json({
      error:"Your are not ADMIN, ACCESS DENIED"
    })
  }
  next()
}