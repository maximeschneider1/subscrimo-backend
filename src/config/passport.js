const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userExists, insertUser } = require('../controllers/databaseController');

module.exports = function configurePassport(app) {
  let callbackUrl = process.env.REDIRECT_URI;

  if (process.env.DEPLOYMENT === 'development') {
    callbackUrl = process.env.DEV_GOOGLE_CALLBACK_URL;
  }

  // Configure Passport.js Google OAuth2 strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        // Save user profile and tokens to the database
    
        // Check if the user exists in the database
        const exists = await userExists(profile.emails[0].value);
    
        if (exists) {
          console.log("User already exists:", profile.emails[0].value);
        } else {
          // Insert or update the user in the database
          console.log("inserting user", profile.emails[0].value);
          await insertUser(profile.emails[0].value, accessToken, refreshToken);
        }
        
        done(null, profile);
      }
    )
  );
  
  // Passport.js session serialization
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  
  // Initialize Passport.js middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
