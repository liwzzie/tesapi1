require('dotenv').config(); // Untuk membaca file .env
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Konfigurasi CORS
app.use(cors({
  origin: '*', // Ganti '*' dengan domain frontend Anda jika diperlukan untuk keamanan
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Izinkan pengiriman cookie dan header otentikasi
}));

// Tangani preflight request
app.options('*', cors());

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
const secretKey = process.env.JWT_SECRET; // Kunci rahasia hanya dari .env
if (!secretKey) {
  console.error('JWT_SECRET is not set. Please configure it in the .env file.');
  process.exit(1); // Keluar jika kunci JWT tidak ada
}

// Login API
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const query = 'SELECT * FROM tbl_user WHERE email = ? AND password = ?';

  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (result.length > 0) {
      const user = result[0];

      // Buat token JWT
      const token = jwt.sign({ userid: user.userid, email: user.email }, secretKey, { expiresIn: '1h' });

      res.json({
        success: true,
        message: 'Login berhasil',
        token: token,
        username: user.username,
        userid: user.userid
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  });
});

// Middleware untuk verifikasi token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Endpoint lainnya
app.post('/register', (req, res) => {
  // Contoh implementasi register (sesuaikan dengan kebutuhan)
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'INSERT INTO tbl_user (username, email, password) VALUES (?, ?, ?)';
  db.query(query, [username, email, password], (err, result) => {
    if (err) {
      console.error('Register error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    res.status(201).json({ success: true, message: 'User registered successfully' });
  });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
