const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const jwt = require('jsonwebtoken'); 
const configurePassport = require('./src/config/passport');

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

// Configure Passport.js
configurePassport(app);

// Routes
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
  })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    // Générer le token JWT
    const payload = { 
      id: req.user.id, 
      email: req.user.emails[0].value
    };
    const secret = process.env.JWT_SECRET; 
    const options = { expiresIn: '1h' }; 
    const token = jwt.sign(payload, secret, options); 

    // Envoyer le token JWT au client
    res.cookie('jwt', token, { httpOnly: true }); 
    res.redirect('/'); 
  }
);

app.use('/', (req, res) => {
  res.send('Hello Max');
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
