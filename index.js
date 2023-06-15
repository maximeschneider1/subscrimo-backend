const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const jwt = require('jsonwebtoken'); 
const configurePassport = require('./src/config/passport');
const User = require('./src/models/user');
const { google } = require('googleapis');
const youtube = google.youtube('v3');


// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Middleware


// CORS configuration
let corsOptions;
if (process.env.DEPLOYMENT === 'development') {
  corsOptions = { origin: 'http://localhost:3000', credentials: true };
} else {
  corsOptions = { origin: 'https://subscrimo-frontend.onrender.com', credentials: true };
}

app.use(cors(corsOptions));


app.use(express.json());
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

configurePassport(app);

// Routes
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
  })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    successRedirect: process.env.FRONT_REDIRECT_URL
  }),
);

// Check if user is authenticated
app.get('/api/checkAuth', (req, res) => {

  if (req.user) {
    const user = {
      name: req.user.displayName,
      email: req.user.emails[0].value,
      username: req.user.emails[0].value,
      AllUserInfo: req.user
    };
    res.status(200).json({ loggedIn: true, user: user });
  } else {
    res.status(200).json({ loggedIn: false, user: null });
  }
});


app.get('/api/subscriptions', async (req, res) => {
  if (!req.user) {
    return res.status(401).send('Not authenticated');
  }

  const pageToken = req.query.pageToken || null;

  try {
    const response = await youtube.subscriptions.list({
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 50, 
      key: process.env.GOOGLE_CLIENT_SECRET, 
      access_token: req.user.accessToken, 
      pageToken 
    });

    res.json({ 
      items: response.data.items, 
      nextPageToken: response.data.nextPageToken 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving subscriptions');
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
