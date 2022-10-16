
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
// https://stackoverflow.com/questions/67118227/whats-the-purpose-of-requiring-ejs
// const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

/////////////////////////////////////////////////////////////////////
// Use the express-session module ///////////////////////////////////
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
/////////////////////////////////////////////////////////////////////
// Initialize passport //////////////////////////////////////////////
app.use(passport.initialize());
app.use(passport.session());
/////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");
// https://mongoosejs.com/docs/5.x/docs/deprecations.html
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secrets: []
});
// Use the passport-local-mongoose module ///////////////////////////
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
// Use the passport module //////////////////////////////////////////
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/////////////////////////////////////////////////////////////////////

// Global Variables /////////////////////////////////////////////////
let loginError = "";
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/",(req,res)=>{
    User.find((err, users) => {
      if (err) {
        console.log(err);
      } else {
        if (users) {
          res.render("home", {
            users: users,
            loggedIn: req.isAuthenticated(),
          });
        }
      }
    });
}); 
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/login",(req, res) => {
  loginError = "";
  res.render("login", {
    loginError: loginError,
  });
});

app.post("/login",(req,res)=>{
  // It reads automatically the req.body and creates the user to authenticate
  passport.authenticate("local", {failureRedirect:"/login"})(req, res, () => {
    //The callback is only triggered if the authentication is successful
    console.log("User successfully authenticated\n");
    res.redirect("/secrets");
  });
});
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/secrets",(req,res)=>{

  User.find((err,users)=>{
    if (err) {
      console.log(err);
    } else {
      if (users) {
        res.render("secrets", {users: users, loggedIn: req.isAuthenticated()});
      }
    }
  })
}); 
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/register",(req, res) => {
  res.render("register");
});

app.post("/register",(req,res)=>{

  User.register({username: req.body.username}, req.body.password, (err,user)=>{
    if (!err) {
      console.log("New user saved successfully\n");
      passport.authenticate("local")(req,res,()=>{
        //The callback is only triggered if the authentication was successful
        res.redirect("/secrets");
      })
    } else {
      console.log(err);
      res.redirect("/register");
    };
  })

}); 
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/logout",(req,res)=>{
  // Here we're going to de-authenticate our user and end his session
  //From the passport documentation:
  req.logOut((err)=>{
    if (!err) {
      console.log("Successfully logged out\n");
      res.redirect("/");
    } else {
      console.log(err);
    };
  });
  
}); 
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/submit",(req,res)=>{
  // Here we're going to check if the user is authenticated, that is,
  // if the user is already logged in
  if (req.isAuthenticated()) {
    console.log("User is already logged in\n");
    res.render("submit", { loggedIn: req.isAuthenticated() });
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  };
  
})

app.post("/submit",(req,res)=>{
  // To know which user is the current one we can use the passport module
  // which saves the user's details into the request variable
  // console.log(req.user);

  // First way: (My way ===> Updating with MongoDB)
  User.updateOne(
    { _id: req.user._id },
    { $push: { secrets: req.body.secret } },
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Secret saved successfully\n");
        res.redirect("/submit");
      }
    }
  );

  // Second way: (Updating with JavaScript array methods and saving modified document with save())
/*     User.findOne(
    {_id: req.user._id},
    (err,user)=>{
      if (err) {
        console.log(err);
      } else {
        console.log("No hubo error buscando al user\n");
        console.log(`user: ${user}\n`);
        if (user) {
          console.log(`user.secrets: ${user.secrets}\n`);
          console.log(`typeof user.secrets: ${typeof user.secrets}\n`);
          user.secrets.push(req.body.secret);
          // When using this method we must SAVE the found user after updating it, otherwise the database doesn't update:
          user.save(()=>{res.redirect("/submit")});
        }
      }
    }
  ); */

}); 
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/my-secrets", (req,res) => {
  if (req.isAuthenticated()) {  
    console.log(req.user.secrets);
    res.render("my-secrets", {
      secrets: req.user.secrets,
      loggedIn: req.isAuthenticated(),
    });
  } else {
    res.redirect("/login");
  }
});
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
app.get("/my-profile", (req,res) => {
  if (req.isAuthenticated()) {  
    console.log(req.user);
    res.render("my-profile", {
      email: req.user.username,
      loggedIn: req.isAuthenticated(),
    });
  } else {
    res.redirect("/login");
  }
});
/////////////////////////////////////////////////////////////////////

app.listen("3000", ()=>{
    console.log("Server running on port 3000 🚀\n");
});

/////////////////////////////////////////////////////////////////////
// Password Documentation:
// https://www.passportjs.org/tutorials/password/