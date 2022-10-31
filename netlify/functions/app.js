const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const { readSecretsMongo, authenticateMongoUser, registerMongoUser, addMongoSecret, updateMongoSecret, deleteMongoSecret } = require("../../src/mongo");
const serverless = require("serverless-http");
const path = require("path");

const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.engine("ejs", require("ejs").__express); // To fix 'ejs' module not found
router.use(express.static(path.join(__dirname, "../../public")));
app.use("/.netlify/functions/app", router);

// Use the express-session module ////
router.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
// Initialize passport ///////////////
router.use(passport.initialize());
router.use(passport.session());
//////////////////////////////////////

// ROUTES ////////////////////////////

router.get("/",(req,res)=>{
    readSecretsMongo(req, res, "home");
}); 
//////////////////////////////////////
router.get("/about", (req, res) => {
  res.render("about", {
    loggedIn: req.isAuthenticated(),
  });
}); 
//////////////////////////////////////
let loginError = "";
router.get("/login",(req, res) => {
  res.render("login", {
    loginError: loginError,
  });
});

router.post("/login", (req, res) => {
  authenticateMongoUser(req, res);
});
//////////////////////////////////////
router.get("/secrets",(req,res)=>{
  readSecretsMongo(req, res, "secrets");
}); 
//////////////////////////////////////
router.get("/register",(req, res) => {
  res.render("register");
});

router.post("/register",(req,res)=>{
  registerMongoUser(req, res);
}); 
//////////////////////////////////////
router.get("/logout",(req,res)=>{
  req.logOut((err)=>{
    if (!err) {
      console.log("Successfully logged out\n");
      res.redirect("/");
    } else {
      console.log(err);
    };
  });
}); 
//////////////////////////////////////
router.get("/submit",(req,res)=>{
  if (req.isAuthenticated()) {
    res.render("submit", { loggedIn: req.isAuthenticated() });
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  };
});

router.post("/submit",(req,res)=>{
  addMongoSecret(req, res);
}); 
//////////////////////////////////////
router.get("/my-secrets", (req,res) => {
  if (req.isAuthenticated()) {  
    res.render("my-secrets", {
      secrets: req.user.secrets,
      loggedIn: req.isAuthenticated(),
    });
  } else {
    res.redirect("/login");
  }
});
//////////////////////////////////////
router.get("/my-profile", (req,res) => {
  if (req.isAuthenticated()) {  
    res.render("my-profile", {
      email: req.user.username,
      loggedIn: req.isAuthenticated(),
    });
  } else {
    res.redirect("/login");
  }
});
//////////////////////////////////////
router.post("/delete", (req, res) => {
  deleteMongoSecret(req, res);
});
//////////////////////////////////////
router.post("/edit-secret", (req, res)=>{
  const index = req.body.index;
  if (req.isAuthenticated()) {
    res.render("edit-secret", {
      loggedIn: req.isAuthenticated(),
      index: index,
      secret: req.user.secrets[index],
    });
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  };
});
//////////////////////////////////////
router.post("/submit-update", (req, res)=> {
  updateMongoSecret(req, res);
});
//////////////////////////////////////

// Export lambda function
module.exports.handler = serverless(app);

// Server Connection //
app.listen("3000", ()=>{
    console.log("Server running on port 3000 🚀\n");
});