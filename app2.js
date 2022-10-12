
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// There's no need to require passport local

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

/////////////////////////////////////////////////////
// Place to use the express session module //////////
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));
/////////////////////////////////////////////////////
// Place to initialize passport /////////////////////
app.use(passport.initialize());
app.use(passport.session());
/////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");
//mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Place to use the passport local mongoose module //
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/////////////////////////////////////////////////////

let loginError = "";

app.route("/")

.get((req,res)=>{
    res.render("home");
});

app.route("/login")

.get((req, res) => {
  loginError = "";
  res.render("login", { loginError: loginError });
})

.post((req,res)=>{
  console.log(`email: ${req.body.username}`);
  console.log(`password: ${req.body.password}\n`);

  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  // https://forum.freecodecamp.org/t/what-does-passport-authenticate-return/355533/2

  /* passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true,
}); */

/* app.get('/', (req, res, next) => {
   passport.authenticate('local', {}, (err, user, info) => { ... })(req, res, next);
}) */

  // Now we're going to use passport to login and authenticate the user
  // From the passport module:
  req.login(user, (err) => {
    if (!err) {
      // Literally the arguments are the req and res values from post((req,res)):
      passport.authenticate("local", {failureRedirect:"/login"})(req, res, () => {
        //The callback is only triggered if the authentication is successful
        console.log("User successfully authenticated\n");
        res.redirect("/secrets");
      });
    } else {
      console.log(err);
    }
  });
});

app.route("/secrets")

.get((req,res)=>{
  // Here we're going to check if the user is authenticated, that is,
  // if the user is already logged in
  if (req.isAuthenticated()) {
    console.log("User is already logged in\n");
    res.render("secrets");
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  }
});

app.route("/register")

.get((req, res) => {
  res.render("register");
})

.post((req,res)=>{

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

app.route("/logout")

.get((req,res)=>{
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



app.listen("3000", ()=>{
    console.log("Server running on port 3000 🚀\n");
});

//////////////////////////////////////
// Password Documentation:
// https://www.passportjs.org/tutorials/password/