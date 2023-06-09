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
    cookie: {
      secure: process.env.DEPLOYMENT === 'production',
      sameSite: process.env.DEPLOYMENT === 'production' ? 'none' : 'lax',
      httpOnly: true,
      domain: process.env.DEPLOYMENT === 'production' ? '.subscrimo-backend.onrender.com' : 'localhost',
    }
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

app.get('/api/checkAuth', (req, res) => {

  if (req.sessionStore) {
    const session = JSON.parse(Object.values(req.sessionStore.sessions)[0]);
    const user = {
      name: session.passport.user.displayName,
      email: session.passport.user.emails[0].value,
      username: session.passport.user.emails[0].value,
      AllUserInfo: session.passport.user,
    };
    res.status(200).json({
      loggedIn: true,
      user: user,
    });
  } else {
    res.status(401).json({
      loggedIn: false,
      user: null,
    });
  }
});

app.get('/api/subscriptions', async (req, res) => {
  // Parse session
  const sessionId = Object.keys(req.sessionStore.sessions)[0];
  const session = JSON.parse(req.sessionStore.sessions[sessionId]);
  const user = session.passport.user;

  if (!user) {
    return res.status(401).send('Not authenticated');
  }

  const pageToken = req.query.pageToken || null;

  try {
    const response = await youtube.subscriptions.list({
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 50, 
      key: process.env.GOOGLE_CLIENT_SECRET, 
      access_token: user.accessToken, 
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
