const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userExists, insertUser } = require('../controllers/databaseController');
const pool = require('../config/database')



module.exports = function configurePassport(app) {
  let callbackUrl = process.env.REDIRECT_URI;

  if (process.env.DEPLOYMENT === 'development') {
    callbackUrl = process.env.DEV_GOOGLE_CALLBACK_URL;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        // TODO /// Save user profile and tokens to the database
    
        // Check if the user exists in the database
        const exists = await userExists(profile.emails[0].value);
    
        if (exists) {
          console.log("User already exists:", profile.emails[0].value);
        } else {
          // Insert or update the user in the database
          console.log("inserting user", profile.emails[0].value);
          await insertUser(profile.emails[0].value, accessToken, refreshToken);
        }
        
        profile.accessToken = accessToken; // store accessToken in user object
        done(null, profile);
      }
    )
  );
  
  passport.serializeUser((user, done) => {
    done(null, user); // save accessToken to the session
  });
    
  passport.deserializeUser((user, done) => {
    done(null, user); 
  });
  
  // Initialize Passport.js middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
