const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const { readSecretsMongo, authenticateMongoUser, registerMongoUser, addMongoSecret, updateMongoSecret, deleteMongoSecret } = require("../../src/mongo");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

// Use the express-session module ////
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
// Initialize passport ///////////////
app.use(passport.initialize());
app.use(passport.session());
//////////////////////////////////////

// ROUTES ////////////////////////////

app.get("/",(req,res)=>{
    readSecretsMongo(req, res, "home");
}); 
//////////////////////////////////////
app.get("/about", (req, res) => {
  res.render("about", {
    loggedIn: req.isAuthenticated(),
  });
}); 
//////////////////////////////////////
let loginError = "";
app.get("/login",(req, res) => {
  res.render("login", {
    loginError: loginError,
  });
});

app.post("/login", (req, res) => {
  authenticateMongoUser(req, res);
});
//////////////////////////////////////
app.get("/secrets",(req,res)=>{
  readSecretsMongo(req, res, "secrets");
}); 
//////////////////////////////////////
app.get("/register",(req, res) => {
  res.render("register");
});

app.post("/register",(req,res)=>{
  registerMongoUser(req, res);
}); 
//////////////////////////////////////
app.get("/logout",(req,res)=>{
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
app.get("/submit",(req,res)=>{
  if (req.isAuthenticated()) {
    res.render("submit", { loggedIn: req.isAuthenticated() });
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  };
});

app.post("/submit",(req,res)=>{
  addMongoSecret(req, res);
}); 
//////////////////////////////////////
app.get("/my-secrets", (req,res) => {
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
app.get("/my-profile", (req,res) => {
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
app.post("/delete", (req, res) => {
  deleteMongoSecret(req, res);
});
//////////////////////////////////////
app.post("/edit-secret", (req, res)=>{
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
app.post("/submit-update", (req, res)=> {
  updateMongoSecret(req, res);
});
//////////////////////////////////////

// Server Connection //
app.listen("3000", ()=>{
    console.log("Server running on port 3000 🚀\n");
});