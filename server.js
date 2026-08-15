const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";

const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(EVENTS_FILE)) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { files: 30, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  }
});

function readEvents() {
  try {
    return JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: "You must be logged in as an administrator." });
}

function removeUploadedFile(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const filename = path.basename(imageUrl);
  const fullPath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

app.get("/api/events", (_req, res) => {
  const events = readEvents().sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  res.json(events);
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  req.session.isAdmin = true;
  res.json({ success: true });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/admin/status", (req, res) => {
  res.json({ authenticated: Boolean(req.session && req.session.isAdmin) });
});

app.post("/api/admin/events", requireAdmin, upload.array("images", 30), (req, res) => {
  const title = String(req.body.title || "").trim();
  const date = String(req.body.date || "").trim();
  const description = String(req.body.description || "").trim();

  if (!title || !date) {
    (req.files || []).forEach(file => fs.unlinkSync(file.path));
    return res.status(400).json({ error: "Event title and date are required." });
  }

  const event = {
    id: crypto.randomUUID(),
    title,
    date,
    description,
    images: (req.files || []).map(file => `/uploads/${file.filename}`)
  };

  const events = readEvents();
  events.push(event);
  writeEvents(events);
  res.status(201).json(event);
});

app.put("/api/admin/events/:id", requireAdmin, (req, res) => {
  const events = readEvents();
  const event = events.find(item => item.id === req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found." });

  const title = String(req.body.title || "").trim();
  const date = String(req.body.date || "").trim();
  const description = String(req.body.description || "").trim();

  if (!title || !date) {
    return res.status(400).json({ error: "Event title and date are required." });
  }

  event.title = title;
  event.date = date;
  event.description = description;
  writeEvents(events);
  res.json(event);
});

app.post("/api/admin/events/:id/images", requireAdmin, upload.array("images", 30), (req, res) => {
  const events = readEvents();
  const event = events.find(item => item.id === req.params.id);

  if (!event) {
    (req.files || []).forEach(file => fs.unlinkSync(file.path));
    return res.status(404).json({ error: "Event not found." });
  }

  event.images.push(...(req.files || []).map(file => `/uploads/${file.filename}`));
  writeEvents(events);
  res.json(event);
});

app.delete("/api/admin/events/:id/images/:imageName", requireAdmin, (req, res) => {
  const events = readEvents();
  const event = events.find(item => item.id === req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found." });

  const imageUrl = `/uploads/${req.params.imageName}`;
  if (!event.images.includes(imageUrl)) {
    return res.status(404).json({ error: "Image not found." });
  }

  event.images = event.images.filter(image => image !== imageUrl);
  removeUploadedFile(imageUrl);
  writeEvents(events);
  res.json(event);
});

app.delete("/api/admin/events/:id", requireAdmin, (req, res) => {
  const events = readEvents();
  const index = events.findIndex(item => item.id === req.params.id);

  if (index === -1) return res.status(404).json({ error: "Event not found." });

  const [event] = events.splice(index, 1);
  event.images.forEach(removeUploadedFile);
  writeEvents(events);
  res.json({ success: true });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Peace Action Network site running at http://localhost:${PORT}`);
  if (ADMIN_PASSWORD === "change-this-password") {
    console.warn("WARNING: Set ADMIN_PASSWORD before putting this website online.");
  }
});