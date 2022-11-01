require("dotenv").config();
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// MongoDB Atlas Connection //
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const db_name = "secrets-db";
mongoose.connect(
  `mongodb+srv://${username}:${password}@cluster0.i2x7mhy.mongodb.net/${db_name}?retryWrites=true&w=majority`
);
// Create the schema for the model
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secrets: [],
});
// Inject the passport-local-mongoose module to the schema //
userSchema.plugin(passportLocalMongoose);
// Create the model //
const User = new mongoose.model("User", userSchema);
// Use the passport module //
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// FUNCTIONS //
/////////////////////////////////////////////////////////////////////

const readSecretsMongo = (req, res, view) => {
  User.find((err, users) => {
    if (err) {
      console.log(err);
    } else {
      if (users) {
        res.render(view, {
          users: users,
          loggedIn: req.isAuthenticated(),
        });
      };
    };
  });
};

const authenticateMongoUser = (req, res) => {
    passport.authenticate("local", (err, user, options) => {
        if (user) {
            req.login(user, (error) => {
                if (error) {
                    res.send(error);
                } else {
                    console.log("Successfully authenticated");
                    res.redirect("/.netlify/functions/app/secrets");
                }
            });
        } else {
            console.log(options.message);
            res.render("login", { loginError: options.message });
        };
    })(req, res);
};

const registerMongoUser = (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (!err) {
        console.log("New user saved successfully\n");
        passport.authenticate("local")(req, res, () => {
          res.redirect("/.netlify/functions/app/secrets");
        });
      } else {
        console.log(err);
        res.redirect("/.netlify/functions/app/register");
      };
    }
  );
};

/////////////////////////////////////////////////////////////////////

const addMongoSecret = (req, res) => {
    User.updateOne(
        { _id: req.user._id },
        { $push: { secrets: req.body.secret } },
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Secret saved successfully\n");
                res.redirect("/.netlify/functions/app/my-secrets");
            };
        }
    ); 
};

const deleteMongoSecret = (req, res) => {
  if (req.isAuthenticated()) {
    const index = req.body.index;
    const oldSecret = req.user.secrets[index];
    console.log(`Secret to be deleted: ${oldSecret}\n`);
    User.updateOne(
      { _id: req.user._id },
      { $pull: { secrets: oldSecret } },
      (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Secret deleted successfully\n");
          res.redirect("/.netlify/functions/app/my-secrets");
        };
      }
    );
  } else {
    res.redirect("/.netlify/functions/app/login");
  };
};


const updateMongoSecret = (req, res) => {
    const { index, secret } = req.body;
    const oldSecret = req.user.secrets[index];
        User.updateOne(
        { _id: req.user._id, secrets: oldSecret },
        { $set: { "secrets.$": secret } },
        (err) => {
            if (err) {
            console.log(err);
            } else {
            console.log("Secret updated successfully\n");
            res.redirect("/.netlify/functions/app/my-secrets");
            };
        }
    );
};

module.exports = {
  readSecretsMongo,
  authenticateMongoUser,
  registerMongoUser,
  addMongoSecret,
  updateMongoSecret,
  deleteMongoSecret,
};