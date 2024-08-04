import express from "express";
import mysql from "mysql";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import multer from "multer";
import fs from "fs";

const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "test"
});

app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.json("hello this is the backend");
});

app.get("/books", (req, res) => {
  const q = "SELECT * FROM books";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

app.post("/books", upload.single('cover'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File upload failed" });
  }

  const q = "INSERT INTO books (`title`, `desc`, `price`, `cover`) VALUES (?)";
  const values = [
    req.body.title,
    req.body.desc,
    req.body.price,
    '/uploads/' + req.file.filename,
  ];

  db.query(q, [values], (err, data) => {
    if (err) {
      console.error(err); // Log the error for debugging
      return res.status(500).json(err);
    }
    return res.json("Book has been created successfully");
  });
});

app.delete("/books/:id", (req,res)=> {
  const bookId = req.params.id;
  const q = "DELETE FROM books WHERE id = ?";

  db.query(q, [bookId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json("Book has been deleted successfully");
  });
});

app.put("/books/:id", upload.single('cover'), (req, res) => {
  const bookId = req.params.id;
  const q = "UPDATE books SET `title` = ?, `desc` = ?, `price` = ?, `cover` = ? WHERE id = ?";
  const values = [
    req.body.title,
    req.body.desc,
    req.body.price,
    req.file ? '/uploads/' + req.file.filename : req.body.cover,
  ];

  db.query(q, [...values, bookId], (err, data) => {
    if (err) {
      console.error(err); // Log the error for debugging
      return res.status(500).json(err);
    }
    return res.json("Book has been updated successfully");
  });
});

app.listen(8800, () => {
  console.log("Connected to backend!");
});
