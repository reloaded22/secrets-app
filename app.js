
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

/////////////////////////////////////////////////////
// Place to use the express session module //////////
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
/////////////////////////////////////////////////////
// Place to initialize passport /////////////////////
app.use(passport.initialize());
app.use(passport.session());
/////////////////////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");
// https://mongoosejs.com/docs/5.x/docs/deprecations.html
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secrets: []
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
    password: req.body.password
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
  // Now we are NOT going to check if the user is logged in because 
  // this page is free for all users to see all the secrets posted
/*   if (req.isAuthenticated()) {
    console.log("User is already logged in\n");
    res.render("secrets");
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  }; */

  User.find((err,users)=>{
    if (err) {
      console.log(err);
    } else {
      if (users) {
        res.render("secrets", {users: users});
      }
    }
  })
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

app.route("/submit")

.get((req,res)=>{
  // Here we're going to check if the user is authenticated, that is,
  // if the user is already logged in
  if (req.isAuthenticated()) {
    console.log("User is already logged in\n");
    res.render("submit");
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  };
  
})

.post((req,res)=>{
  // To know which user is the current one we can use the passport module
  // which saves the user's details into the request variable
  // console.log(req.user);

  // First way: (My way ===> Updating with MongoDB)
/*   User.updateOne(
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
  ); */

  // Second way: (Updating with JavaScript array methods and saving modified document with save())
    User.findOne(
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
  );

});



app.listen("3000", ()=>{
    console.log("Server running on port 3000 🚀\n");
});

//////////////////////////////////////
// Password Documentation:
// https://www.passportjs.org/tutorials/password/