const express = require("express");
const router = express.Router();
const { signup, signout, signin,isSignedIn } = require("../controllers/auth");
const { check, validationResult } = require("express-validator");

router.post(
  "/signup",
  [
    check("name").isLength({ min: 3 }).withMessage("must be atleast 3 chars"),
    check("email").isEmail().withMessage("enter valid email"),
    check("password").isLength({ min: 3 }).withMessage("min length is 3"),
  ],
  signup
);

router.post(
  "/signin",
  [
    check("email").isEmail().withMessage("enter valid email"),
    check("password").isLength({ min: 2 }).withMessage("password is required"),
  ],
  signin
);

router.get("/signout", signout);
router.get("/testroute",isSignedIn, (req,res)=>{
  res.send("protected test working")
});

module.exports = router;
