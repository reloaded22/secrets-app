
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");

// https://www.npmjs.com/package/bcrypt
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Using mongoose encryption:
// https://www.npmjs.com/package/mongoose-encryption
//https://mongoosejs.com/docs/plugins.html
//userSchema.plugin(encrypt, {secret:process.env.SECRET});
// But this encrypts the entire document and I want to
// encrypt only certain fields (password in this case):
/* userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
}); */

const User = new mongoose.model("User", userSchema);

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
    console.log(`password: ${req.body.password}`);

    //const md5_password = md5(req.body.password);
    
    User.findOne(
      //{ email: req.body.username, password: req.body.password },
      { email: req.body.username },
      //{ password: req.body.password },
      (err, user) => {
        console.log(`user: ${user}\n`);
        //if (!err && user) {
        if (!err && user) {
          // Using md5:
/*             if (user.password === md5_password) {
              console.log("User successfully authenticated\n");
              res.render("secrets");
            } else {
              console.log("Password not valid\n");
              loginError =
                "Email and/or password not valid! Please try again";
              res.render("login", { loginError: loginError });
            }; */

          // Using Bcrypt:
          bcrypt.compare(req.body.password, user.password, function (err, result) {
            // returns result == true or false
            if (result) {
              console.log("User successfully authenticated\n");
              res.render("secrets");
            } else {
              console.log("Password not valid\n");
              loginError = "Email and/or password not valid! Please try again";
              res.render("login", { loginError: loginError });
            };
          });

        } else {
            if (err) {
                console.log(`err: ${err}\n`);
                res.render(err);
            } else {
                console.log("Email not valid\n");
                loginError =
                  "Email and/or password not valid! Please try again";
                res.render("login", { loginError: loginError });
            }

        }
      }
    );
});

app.route("/register")

.get((req, res) => {
  res.render("register");
})

.post((req,res)=>{

  // Using md5 (hashing) instead of mongoose encrypt
/*   const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password),
  }); */

  // https://www.npmjs.com/package/bcrypt
  // Using bcrypt:
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    // Store hash in your password DB.
      const newUser = new User({
        email: req.body.username,
        password: hash,
      });

      newUser.save((err) => {
        if (!err) {
          console.log("New user saved successfully\n");
          res.render("secrets");
        } else {
          console.log(err);
        }
      });
  });

});



app.listen("3000", ()=>{
    console.log("Server running on port 3000 🚀\n");
});