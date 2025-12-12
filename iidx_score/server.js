const path = require("path");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();

// データベース接続
const db = new Database(path.join(__dirname, "iidx.db"));

// テーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    version TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    level INTEGER NOT NULL,
    score INTEGER NOT NULL,
    djLevel TEXT NOT NULL,
    lamp TEXT NOT NULL,
    date TEXT NOT NULL
  )
`);

// 初期データ投入
const count = db.prepare("SELECT COUNT(*) as count FROM scores").get();
if (count.count === 0) {
    const insert = db.prepare(`
    INSERT INTO scores (title, artist, version, difficulty, level, score, djLevel, lamp, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    insert.run("Blue Rain", "dj TAKA VS Ryu☆", "BISTROVER", "HYPER", 10, 1820, "AA", "HARD CLEAR", "2025-11-14");
    insert.run("V", "TAKA respect for J.S.B.", "3rd style", "ANOTHER", 12, 1890, "AA", "CLEAR", "2025-11-12");
    insert.run("Sparkle Shower", "SYUNN", "SINOBUZ", "ANOTHER", 11, 1750, "A", "CLEAR", "2025-11-10");
}

// 定数定義
const DIFFICULTIES = ["BEGINNER", "NORMAL", "HYPER", "ANOTHER", "LEGGENDARIA"];
const LAMPS = ["FAILED", "ASSIST EASY", "EASY CLEAR", "CLEAR", "HARD CLEAR", "EX-HARD CLEAR", "FULL COMBO"];
const VERSIONS = [
    "1st style", "substream", "2nd style", "3rd style", "4th style", "5th style",
    "6th style", "7th style", "8th style", "9th style", "10th style",
    "IIDX RED", "HAPPY SKY", "DistorteD", "GOLD", "DJ TROOPERS", "EMPRESS",
    "SIRIUS", "Resort Anthem", "Lincle", "tricoro", "SPADA", "PENDUAL",
    "copula", "SINOBUZ", "CANNON BALLERS", "Rootage", "HEROIC VERSE",
    "BISTROVER", "CastHour", "RESIDENT", "EPOLIS"
];
const DJ_LEVELS = ["F", "E", "D", "C", "B", "A", "AA", "AAA"];

// Express 設定
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// リクエストログ
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ユーティリティ関数
const toInt = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};

const notEmpty = (s) => typeof s === "string" && s.trim().length > 0;

const normalizeFromSet = (v, set) => {
    const low = String(v ?? "").toLowerCase();
    return set.find((x) => x.toLowerCase() === low) || null;
};

// DB操作関数
function getAllScores() {
    return db.prepare("SELECT * FROM scores").all();
}

function getScoreById(id) {
    return db.prepare("SELECT * FROM scores WHERE id = ?").get(id);
}

function addScore(raw) {
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const artist = typeof raw.artist === "string" ? raw.artist.trim() : "";
    const version = normalizeFromSet(raw.version, VERSIONS);
    const diff = normalizeFromSet(raw.difficulty, DIFFICULTIES);
    const level = toInt(raw.level);
    const score = toInt(raw.score);
    const djLevel = normalizeFromSet(raw.djLevel, DJ_LEVELS);
    const lamp = normalizeFromSet(raw.lamp, LAMPS);
    const today = new Date();
    const date = String(raw.date ?? "").trim() || today.toISOString().slice(0, 10);

    const errors = [];
    if (!notEmpty(title)) errors.push("タイトルは必須です。");
    if (!notEmpty(artist)) errors.push("作曲者は必須です。");
    if (!version) errors.push("バージョンは選択肢から選んでください。");
    if (!diff) errors.push("難易度は選択肢から選んでください。");
    if (!Number.isFinite(level) || level < 1 || level > 12) errors.push("レベルは 1〜12 の数値で入力してください。");
    if (!Number.isFinite(score) || score < 0 || score > 4000) errors.push("スコアは 0〜4000 の数値で入力してください。");
    if (!djLevel) errors.push("DJレベルは選択肢から選んでください。");
    if (!lamp) errors.push("ランプは選択肢から選んでください。");

    if (errors.length) return { ok: false, status: 400, errors };

    const insert = db.prepare(`
    INSERT INTO scores (title, artist, version, difficulty, level, score, djLevel, lamp, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const info = insert.run(title, artist, version, diff, level, score, djLevel, lamp, date);
    const item = getScoreById(info.lastInsertRowid);
    return { ok: true, item };
}

function updateScore(id, data) {
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const artist = typeof data.artist === "string" ? data.artist.trim() : "";
    const version = normalizeFromSet(data.version, VERSIONS);
    const diff = normalizeFromSet(data.difficulty, DIFFICULTIES);
    const level = toInt(data.level);
    const score = toInt(data.score);
    const djLevel = normalizeFromSet(data.djLevel, DJ_LEVELS);
    const lamp = normalizeFromSet(data.lamp, LAMPS);
    const existing = getScoreById(id);
    const date = String(data.date ?? "").trim() || existing?.date || new Date().toISOString().slice(0, 10);

    const errors = [];
    if (!notEmpty(title)) errors.push("タイトルは必須です。");
    if (!notEmpty(artist)) errors.push("作曲者は必須です。");
    if (!version) errors.push("バージョンは選択肢から選んでください。");
    if (!diff) errors.push("難易度は選択肢から選んでください。");
    if (!Number.isFinite(level) || level < 1 || level > 12) errors.push("レベルは 1〜12 の数値で入力してください。");
    if (!Number.isFinite(score) || score < 0 || score > 4000) errors.push("スコアは 0〜4000 の数値で入力してください。");
    if (!djLevel) errors.push("DJレベルは選択肢から選んでください。");
    if (!lamp) errors.push("ランプは選択肢から選んでください。");

    if (errors.length) return { ok: false, status: 400, errors };

    const update = db.prepare(`
    UPDATE scores SET title=?, artist=?, version=?, difficulty=?, level=?, score=?, djLevel=?, lamp=?, date=? WHERE id=?
  `);
    update.run(title, artist, version, diff, level, score, djLevel, lamp, date, id);
    return { ok: true };
}

function deleteScore(id) {
    const del = db.prepare("DELETE FROM scores WHERE id = ?");
    const info = del.run(id);
    return info.changes > 0;
}

// ルート
app.get("/", (req, res) => {
    const search = String(req.query.q || "").trim().toLowerCase();
    const sortBy = req.query.sort || "score";
    const order = req.query.order === "asc" ? "asc" : "desc";

    let scores = getAllScores();

    if (search) {
        scores = scores.filter((s) =>
            s.title.toLowerCase().includes(search) ||
            s.artist.toLowerCase().includes(search) ||
            s.version.toLowerCase().includes(search) ||
            s.difficulty.toLowerCase().includes(search) ||
            s.lamp.toLowerCase().includes(search)
        );
    }

    scores.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        if (typeof aVal === "string") {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return order === "asc" ? cmp : -cmp;
    });

    res.render("list", {
        data: scores,
        added: req.query.added === "1",
        updated: req.query.updated === "1",
        deleted: req.query.deleted === "1",
        query: { q: search, sort: sortBy, order },
    });
});

app.get("/new", (req, res) => {
    res.render("form", {
        values: { title: "", artist: "", version: "EPOLIS", difficulty: "HYPER", level: 10, score: "", djLevel: "A", lamp: "CLEAR", date: "" },
        errors: [],
        isEdit: false,
        DIFFICULTIES,
        LAMPS,
        VERSIONS,
        DJ_LEVELS,
    });
});

app.get("/:id/edit", (req, res) => {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).send("Bad Request");

    const item = getScoreById(id);
    if (!item) return res.status(404).send("Not Found");

    res.render("form", {
        values: item,
        errors: [],
        isEdit: true,
        DIFFICULTIES,
        LAMPS,
        VERSIONS,
        DJ_LEVELS,
    });
});

app.post("/", (req, res) => {
    const result = addScore(req.body);
    if (!result.ok) {
        return res.status(result.status).render("form", {
            values: req.body,
            errors: result.errors,
            isEdit: false,
            DIFFICULTIES,
            LAMPS,
            VERSIONS,
            DJ_LEVELS,
        });
    }
    res.redirect("/?added=1");
});

app.post("/:id/update", (req, res) => {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).send("Bad Request");

    const existing = getScoreById(id);
    if (!existing) return res.status(404).send("Not Found");

    const result = updateScore(id, req.body);
    if (!result.ok) {
        return res.status(result.status).render("form", {
            values: { ...req.body, id },
            errors: result.errors,
            isEdit: true,
            DIFFICULTIES,
            LAMPS,
            VERSIONS,
            DJ_LEVELS,
        });
    }
    res.redirect("/?updated=1");
});

app.post("/:id/delete", (req, res) => {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).send("Bad Request");

    const deleted = deleteScore(id);
    if (!deleted) return res.status(404).send("Not Found");

    res.redirect("/?deleted=1");
});

// JSON API
app.get("/api/scores", (req, res) => {
    res.json(getAllScores());
});

app.post("/api/scores", (req, res) => {
    const result = addScore(req.body);
    if (!result.ok) return res.status(result.status).json({ errors: result.errors });
    res.status(201).json(result.item);
});

app.delete("/api/scores/:id", (req, res) => {
    const id = toInt(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid ID" });

    const deleted = deleteScore(id);
    if (!deleted) return res.status(404).json({ error: "Not Found" });

    res.status(204).end();
});

const PORT = process.env.PORT || 8080; // 競合する場合は 3000 等に
// 404
app.use((req, res) => {
    res.status(404).send("Not Found");
});
// 500
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Internal Error:", err);
    res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => console.log(`IIDX Score Manager running on http://localhost:${PORT}`));