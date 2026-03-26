const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const urlsFile = path.join(__dirname, "urls.json");

/* ---------- READ / WRITE ---------- */

function readData() {
    try {
        const data = fs.readFileSync(urlsFile, "utf8");
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function writeData(data) {
    fs.writeFileSync(urlsFile, JSON.stringify(data, null, 2));
}

/* ---------- CLEANUP ---------- */

function cleanExpired() {
    const data = readData();
    let changed = false;

    for (const code in data) {
        if (data[code].expiresAt && Date.now() > data[code].expiresAt) {
            delete data[code];
            changed = true;
        }
    }

    if (changed) writeData(data);
}

setInterval(cleanExpired, 60000);

/* ---------- SHORTEN ---------- */

app.post("/shorten", (req, res) => {

    const { url, customCode, expiryDays } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL required" });
    }

    const data = readData();

    let code = customCode || Math.random().toString(36).substring(2, 8);

    if (data[code]) {
        return res.status(400).json({ error: "Code already exists" });
    }

    let expiresAt = null;

    if (expiryDays) {
        expiresAt = Date.now() + expiryDays * 86400000;
    }

    data[code] = {
        url,
        clicks: 0,
        expiresAt
    };

    writeData(data);

    res.json({
        shortUrl: `/r/${code}`   // ✅ important (relative)
    });
});

/* ---------- ADMIN ---------- */

app.get("/admin", (req, res) => {
    cleanExpired();
    res.json(readData());
});

/* ---------- DELETE ---------- */

app.delete("/delete/:code", (req, res) => {
    const data = readData();

    if (!data[req.params.code]) {
        return res.status(404).json({ error: "Not found" });
    }

    delete data[req.params.code];
    writeData(data);

    res.json({ success: true });
});

/* ---------- REDIRECT ---------- */

app.get("/r/:code", (req, res) => {

    cleanExpired();

    const data = readData();
    const entry = data[req.params.code];

    if (!entry) {
        return res.send("Link not found");
    }

    entry.clicks++;
    writeData(data);

    res.redirect(entry.url);
});

/* ---------- ROOT ---------- */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ---------- START ---------- */

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});