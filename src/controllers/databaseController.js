const pool = require('../config/database');

const getEmailByUsername = async (username) => {
  try {
    const query = "SELECT email FROM \"User\" WHERE username = $1;";
    const values = [username];

    const res = await pool.query(query, values);

    return res.rows[0].email;
  } catch (error) {
    console.error(error);
  }
};

const userExists = async (email) => {
    try {
      const query = "SELECT EXISTS (SELECT 1 FROM \"User\" WHERE email = $1);";
      const values = [email];
  
      const res = await pool.query(query, values);
  
      return res.rows[0].exists;
    } catch (error) {
      console.error(error);
    }
  };

const insertUser = async (email, oauthtoken, refreshToken) => {
  try {
    const query = `
      INSERT INTO "User" (username, email, password_hash, oauthtoken, refreshToken)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE
      SET oauthtoken = EXCLUDED.oauthtoken;
    `;
    const passwordHashPlaceholder = 'not_applicable';
    const params = [email, email, passwordHashPlaceholder, oauthtoken, refreshToken];

    await pool.query(query, params);
  } catch (error) {
    console.error('Error inserting user:', error);
  }
};

module.exports = {
  getEmailByUsername,
  userExists,
  insertUser,
};
