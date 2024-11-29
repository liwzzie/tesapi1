// require('dotenv').config(); // Tambahkan untuk membaca file .env
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Koneksi ke MySQL Database
const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com', // Host database
  user: 'sql12748328',              // Username database
  password: 'QfB8e6dDr4',           // Password database
  database: 'sql12748328',          // Nama database
  port: 3306                        // Port database
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    throw err;
  }
  console.log('Connected to online database');
});

// Kunci rahasia untuk JWT (gunakan variabel lingkungan untuk keamanan)
const secretKey = process.env.JWT_SECRET || 'YOUR_SECRET_KEY'; // Ganti dengan kunci rahasia yang aman

// Login API
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM tbl_user WHERE email = ? AND password = ?';

  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (result.length > 0) {
      const user = result[0];

      const token = jwt.sign({ userid: user.userid, email: user.email }, secretKey, { expiresIn: '1h' });

      res.json({
        success: true,
        message: 'Login berhasil',
        token: token,
        username: user.username,
        userid: user.userid
      });
    } else {
      res.status(401).json({ success: false, message: 'Login failed' });
    }
  });
});

// Middleware untuk verifikasi token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Endpoint lain seperti register, update-username, dan saveResults tetap sama

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
