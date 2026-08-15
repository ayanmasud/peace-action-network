const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(
        EVENTS_FILE,
        JSON.stringify(
            {
                upcoming: [],
                past: []
            },
            null,
            2
        )
    );
}

function readEvents() {
    try {
        return JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
    } catch {
        return {
            upcoming: [],
            past: []
        };
    }
}

function writeEvents(events) {
    fs.writeFileSync(
        EVENTS_FILE,
        JSON.stringify(events, null, 2)
    );
}

function deleteLocalFile(publicPath) {
    if (!publicPath) return;

    if (!publicPath.startsWith("/uploads/")) {
        return;
    }

    const filename = path.basename(publicPath);
    const filePath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error("Could not delete file:", error);
        }
    }
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }

    if (req.path === "/admin.html") {
        return res.redirect("/admin-login.html");
    }

    return res.status(401).json({
        error: "Unauthorized"
    });
}

function parseActivities(value) {
    if (!value) {
        return [];
    }

    return String(value)
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
}

/* --------------------------------------------------
   MIDDLEWARE
-------------------------------------------------- */

app.set("trust proxy", 1);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "CHANGE_THIS_SESSION_SECRET",

        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);

/* --------------------------------------------------
   IMAGE UPLOAD CONFIGURATION
-------------------------------------------------- */

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, UPLOAD_DIR);
    },

    filename: (_req, file, callback) => {
        const extension =
            path.extname(file.originalname).toLowerCase();

        const baseName =
            path
                .basename(file.originalname, extension)
                .replace(/[^a-z0-9-_]/gi, "-")
                .replace(/-+/g, "-")
                .slice(0, 60) || "image";

        const filename =
            `${Date.now()}-${baseName}${extension}`;

        callback(null, filename);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 15 * 1024 * 1024
    },

    fileFilter: (_req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(
                new Error(
                    "Only JPG, PNG, WebP, and GIF images are allowed."
                )
            );
        }
    }
});

/* --------------------------------------------------
   PUBLIC EVENTS API
-------------------------------------------------- */

app.get("/api/events", (_req, res) => {
    res.json(readEvents());
});

/* --------------------------------------------------
   ADMIN AUTHENTICATION
-------------------------------------------------- */

app.get("/api/admin/status", (req, res) => {
    res.json({
        authenticated: !!(
            req.session &&
            req.session.isAdmin
        )
    });
});

app.post("/api/admin/login", (req, res) => {
    const password = String(
        req.body.password || ""
    );

    const correctPassword =
        process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
        return res.status(500).json({
            error:
                "ADMIN_PASSWORD has not been configured on Render."
        });
    }

    if (password !== correctPassword) {
        return res.status(401).json({
            error: "Incorrect password."
        });
    }

    req.session.isAdmin = true;

    res.json({
        success: true
    });
});

app.post(
    "/api/admin/logout",
    requireAdmin,
    (req, res) => {
        req.session.destroy(() => {
            res.json({
                success: true
            });
        });
    }
);

/* --------------------------------------------------
   UPCOMING EVENTS
-------------------------------------------------- */

app.post(
    "/api/admin/upcoming",
    requireAdmin,
    upload.single("flyer"),
    (req, res) => {
        const events = readEvents();

        const event = {
            id:
                "upcoming-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            title: String(
                req.body.title || ""
            ).trim(),

            date: String(
                req.body.date || ""
            ).trim(),

            time: String(
                req.body.time || ""
            ).trim(),

            location: String(
                req.body.location || ""
            ).trim(),

            description: String(
                req.body.description || ""
            ).trim(),

            activities: parseActivities(
                req.body.activities
            ),

            joinUrl: String(
                req.body.joinUrl || ""
            ).trim(),

            flyer: req.file
                ? `/uploads/${req.file.filename}`
                : null
        };

        if (!event.title) {
            if (req.file) {
                deleteLocalFile(
                    `/uploads/${req.file.filename}`
                );
            }

            return res.status(400).json({
                error: "Event title is required."
            });
        }

        events.upcoming.push(event);

        writeEvents(events);

        res.json({
            success: true,
            event
        });
    }
);

app.put(
    "/api/admin/upcoming/:id",
    requireAdmin,
    upload.single("flyer"),
    (req, res) => {
        const events = readEvents();

        const event =
            events.upcoming.find(
                item =>
                    item.id === req.params.id
            );

        if (!event) {
            return res.status(404).json({
                error:
                    "Upcoming event not found."
            });
        }

        if (req.body.title !== undefined) {
            event.title =
                String(req.body.title).trim();
        }

        if (req.body.date !== undefined) {
            event.date =
                String(req.body.date).trim();
        }

        if (req.body.time !== undefined) {
            event.time =
                String(req.body.time).trim();
        }

        if (
            req.body.location !== undefined
        ) {
            event.location =
                String(req.body.location).trim();
        }

        if (
            req.body.description !== undefined
        ) {
            event.description =
                String(
                    req.body.description
                ).trim();
        }

        if (
            req.body.activities !== undefined
        ) {
            event.activities =
                parseActivities(
                    req.body.activities
                );
        }

        if (
            req.body.joinUrl !== undefined
        ) {
            event.joinUrl =
                String(
                    req.body.joinUrl
                ).trim();
        }

        /* Replace flyer */

        if (req.file) {
            deleteLocalFile(event.flyer);

            event.flyer =
                `/uploads/${req.file.filename}`;
        }

        /* Remove flyer */

        if (
            req.body.removeFlyer === "true"
        ) {
            deleteLocalFile(event.flyer);

            event.flyer = null;
        }

        if (!event.title) {
            return res.status(400).json({
                error:
                    "Event title is required."
            });
        }

        writeEvents(events);

        res.json({
            success: true,
            event
        });
    }
);

app.delete(
    "/api/admin/upcoming/:id",
    requireAdmin,
    (req, res) => {
        const events = readEvents();

        const index =
            events.upcoming.findIndex(
                event =>
                    event.id ===
                    req.params.id
            );

        if (index === -1) {
            return res.status(404).json({
                error:
                    "Upcoming event not found."
            });
        }

        const [event] =
            events.upcoming.splice(
                index,
                1
            );

        deleteLocalFile(event.flyer);

        writeEvents(events);

        res.json({
            success: true
        });
    }
);

/* --------------------------------------------------
   PAST EVENTS
-------------------------------------------------- */

app.post(
    "/api/admin/past",
    requireAdmin,
    upload.array("photos", 30),
    (req, res) => {
        const events = readEvents();

        const event = {
            id:
                "past-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            title: String(
                req.body.title || ""
            ).trim(),

            date: String(
                req.body.date || ""
            ).trim(),

            description: String(
                req.body.description || ""
            ).trim(),

            photos: (req.files || []).map(
                file =>
                    `/uploads/${file.filename}`
            )
        };

        if (!event.title) {
            (req.files || []).forEach(
                file =>
                    deleteLocalFile(
                        `/uploads/${file.filename}`
                    )
            );

            return res.status(400).json({
                error:
                    "Event title is required."
            });
        }

        events.past.push(event);

        writeEvents(events);

        res.json({
            success: true,
            event
        });
    }
);

app.put(
    "/api/admin/past/:id",
    requireAdmin,
    upload.array("photos", 30),
    (req, res) => {
        const events = readEvents();

        const event =
            events.past.find(
                item =>
                    item.id === req.params.id
            );

        if (!event) {
            return res.status(404).json({
                error:
                    "Past event not found."
            });
        }

        if (req.body.title !== undefined) {
            event.title =
                String(req.body.title).trim();
        }

        if (req.body.date !== undefined) {
            event.date =
                String(req.body.date).trim();
        }

        if (
            req.body.description !== undefined
        ) {
            event.description =
                String(
                    req.body.description
                ).trim();
        }

        const newPhotos =
            (req.files || []).map(
                file =>
                    `/uploads/${file.filename}`
            );

        event.photos = [
            ...(event.photos || []),
            ...newPhotos
        ];

        writeEvents(events);

        res.json({
            success: true,
            event
        });
    }
);

app.delete(
    "/api/admin/past/:id",
    requireAdmin,
    (req, res) => {
        const events = readEvents();

        const index =
            events.past.findIndex(
                event =>
                    event.id ===
                    req.params.id
            );

        if (index === -1) {
            return res.status(404).json({
                error:
                    "Past event not found."
            });
        }

        const [event] =
            events.past.splice(
                index,
                1
            );

        (event.photos || []).forEach(
            deleteLocalFile
        );

        writeEvents(events);

        res.json({
            success: true
        });
    }
);

app.delete(
    "/api/admin/past/:id/photos",
    requireAdmin,
    (req, res) => {
        const photo =
            String(req.body.photo || "");

        const events = readEvents();

        const event =
            events.past.find(
                item =>
                    item.id === req.params.id
            );

        if (!event) {
            return res.status(404).json({
                error:
                    "Past event not found."
            });
        }

        event.photos =
            (event.photos || []).filter(
                item => item !== photo
            );

        deleteLocalFile(photo);

        writeEvents(events);

        res.json({
            success: true
        });
    }
);

/* --------------------------------------------------
   STATIC FILES
-------------------------------------------------- */

app.use(
    express.static(PUBLIC_DIR)
);

/*
   IMPORTANT:
   Do NOT use app.get("*", ...) with Express 5.
*/

app.get("/admin.html", requireAdmin, (_req, res) => {
    res.sendFile(
        path.join(
            PUBLIC_DIR,
            "admin.html"
        )
    );
});

/* --------------------------------------------------
   FALLBACK
-------------------------------------------------- */

app.use((req, res) => {
    if (
        req.method === "GET" &&
        !req.path.startsWith("/api/")
    ) {
        return res.sendFile(
            path.join(
                PUBLIC_DIR,
                "index.html"
            )
        );
    }

    res.status(404).json({
        error: "Not found"
    });
});

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Peace Action Network server running on port ${PORT}`
        );
    }
);