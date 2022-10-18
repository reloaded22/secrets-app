
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
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
let loginError = "";
app.get("/login",(req, res) => {
  res.render("login", {
    loginError: loginError,
  });
});

app.post("/login", (req, res) => {
  passport.authenticate("local",
      (err, user, options) => {
        if (user) {
          console.log(req.isAuthenticated());
          req.login(user, (error)=>{
            if (error) {
              res.send(error);
            } else {
              console.log("Successfully authenticated");
              console.log(req.isAuthenticated());
              res.redirect("/secrets");
            };
          });
        } else {
          console.log(options.message);
          res.render("login", { loginError: options.message });
        };
  })(req, res);
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

  if (req.isAuthenticated()) {
    console.log("User is already logged in\n");
    res.render("submit", { loggedIn: req.isAuthenticated() });
  } else {
    console.log("User needs to login to see the requested page\n");
    res.redirect("/login");
  };
  
});

app.post("/submit",(req,res)=>{

  // First way:
  User.updateOne(
    { _id: req.user._id },
    { $push: { secrets: req.body.secret } },
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Secret saved successfully\n");
        res.redirect("/my-secrets");
      }
    }
  );

  // Second way:
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

app.post("/delete", (req, res) => {
  
  if (req.isAuthenticated()) {
    const index = req.body.index;
    const oldSecret = req.user.secrets[index];
    console.log(`Secret to be deleted: ${oldSecret}\n`);

    // First way:
    User.updateOne(
      { _id: req.user._id }, 
      { $pull: {secrets: oldSecret }}, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Secret deleted successfully\n");
        res.redirect("/my-secrets");
      }
    });

    // Second way:
/*     User.findOne(
      {_id: req.user._id},
      (err,user)=>{
        if (err) {
          console.log(err);
        } else {
          console.log(`user: ${user}\n`);
          if (user) {
            console.log(`Secret to be deleted: ${user.secrets[index]}\n`);
            user.secrets.splice(index, 1);
            user.save(()=>{
              console.log("Secret deleted successfully\n");
              res.redirect("/my-secrets");
            });
          }
        }
      }
    ); */
  } else {
    res.redirect("/login");
  }
});

/////////////////////////////////////////////////////////////////////

app.post("/edit-secret", (req, res)=>{
  if (req.isAuthenticated()) {
    console.log("User is logged in\n");
    const index = req.body.index;
    console.log(req.user.secrets[index]);
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

app.post("/submit-update", (req, res)=> {
  const { index, secret } = req.body;
  const oldSecret = req.user.secrets[index];

  // First way:
    User.updateOne(
    { _id: req.user._id, secrets: oldSecret },
    { $set: { "secrets.$": secret } },
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Secret updated successfully\n");
        res.redirect("/my-secrets");
      }
    }
  );

  // Second way:
/*   User.findOne({ _id: req.user._id }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      console.log("No hubo error buscando al user\n");
      console.log(`user: ${user}\n`);
      if (user) {
        console.log(`user.secrets: ${user.secrets}\n`);
        user.secrets.splice(index, 1, secret);
        // When using this method we must SAVE the found user after updating it, otherwise the database doesn't update:
        user.save(() => {
          console.log("Secret updated successfully\n");
          res.redirect("/my-secrets");
        });
      }
    }
  }); */
});

/////////////////////////////////////////////////////////////////////

app.listen("3000", ()=>{
    console.log("Server running on port 3000 🚀\n");
});

/////////////////////////////////////////////////////////////////////
// NOTES:
// Password Documentation:
// https://www.passportjs.org/tutorials/password/
// The passport module saves the user's details into the request variable
// req.user => This gives you the details of the user currently authenticated