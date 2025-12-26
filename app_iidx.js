"use strict";

const express = require("express");
const app = express();
const path = require("path");

// Express settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Data (In-memory)
let scores = [
    { id: 1, title: "Blue Rain", artist: "dj TAKA VS Ryu☆", version: "BISTROVER", difficulty: "HYPER", level: 10, score: 1820, djLevel: "AA", lamp: "HARD CLEAR", date: "2023-11-14" },
    { id: 2, title: "V", artist: "TAKA respect for J.S.B.", version: "3rd style", difficulty: "ANOTHER", level: 12, score: 1890, djLevel: "AA", lamp: "CLEAR", date: "2023-11-12" },
    { id: 3, title: "Sparkle Shower", artist: "SYUNN", version: "SINOBUZ", difficulty: "ANOTHER", level: 11, score: 1750, djLevel: "A", lamp: "CLEAR", date: "2023-11-10" },
];
let nextId = 4;

// Constants
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

// Utils
const toInt = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};

const normalizeFromSet = (v, set) => {
    const low = String(v ?? "").toLowerCase();
    return set.find((x) => x.toLowerCase() === low) || null;
};

// CRUD Functions
function getAllScores() {
    return scores;
}

function getScoreById(id) {
    return scores.find((s) => s.id === id);
}

function addScore(raw) {
    const errors = validate(raw);
    if (errors.length > 0) return { ok: false, errors };

    const newItem = {
        id: nextId++,
        title: raw.title.trim(),
        artist: raw.artist.trim(),
        version: normalizeFromSet(raw.version, VERSIONS),
        difficulty: normalizeFromSet(raw.difficulty, DIFFICULTIES),
        level: toInt(raw.level),
        score: toInt(raw.score),
        djLevel: normalizeFromSet(raw.djLevel, DJ_LEVELS),
        lamp: normalizeFromSet(raw.lamp, LAMPS),
        date: raw.date || new Date().toISOString().split("T")[0],
    };
    scores.push(newItem);
    return { ok: true, item: newItem };
}

function updateScore(id, raw) {
    const idx = scores.findIndex((s) => s.id === id);
    if (idx === -1) return { ok: false, errors: ["Not Found"] };

    const errors = validate(raw);
    if (errors.length > 0) return { ok: false, errors };

    scores[idx] = {
        ...scores[idx],
        title: raw.title.trim(),
        artist: raw.artist.trim(),
        version: normalizeFromSet(raw.version, VERSIONS),
        difficulty: normalizeFromSet(raw.difficulty, DIFFICULTIES),
        level: toInt(raw.level),
        score: toInt(raw.score),
        djLevel: normalizeFromSet(raw.djLevel, DJ_LEVELS),
        lamp: normalizeFromSet(raw.lamp, LAMPS),
        date: raw.date || scores[idx].date,
    };
    return { ok: true };
}

function deleteScore(id) {
    const idx = scores.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    scores.splice(idx, 1);
    return true;
}

function validate(raw) {
    const errors = [];
    if (!raw.title || typeof raw.title !== 'string' || !raw.title.trim()) errors.push("タイトルは必須です。");
    if (!raw.artist || typeof raw.artist !== 'string' || !raw.artist.trim()) errors.push("作曲者は必須です。");
    if (!normalizeFromSet(raw.version, VERSIONS)) errors.push("バージョンは選択肢から選んでください。");
    if (!normalizeFromSet(raw.difficulty, DIFFICULTIES)) errors.push("難易度は選択肢から選んでください。");
    const level = toInt(raw.level);
    if (level === null || level < 1 || level > 12) errors.push("レベルは 1〜12 の数値で入力してください。");
    const score = toInt(raw.score);
    if (score === null || score < 0 || score > 4000) errors.push("スコアは 0〜4000 の数値で入力してください。");
    if (!normalizeFromSet(raw.djLevel, DJ_LEVELS)) errors.push("DJレベルは選択肢から選んでください。");
    if (!normalizeFromSet(raw.lamp, LAMPS)) errors.push("ランプは選択肢から選んでください。");
    return errors;
}

// Routes
// Index
app.get("/", (req, res) => {
    const list = getAllScores();
    res.render("iidx_list", { data: list });
});

// New Form
app.get("/create", (req, res) => {
    res.render("iidx_form", {
        values: { version: "EPOLIS", difficulty: "HYPER", level: 10, djLevel: "A", lamp: "CLEAR" },
        errors: [],
        isEdit: false,
        DIFFICULTIES, LAMPS, VERSIONS, DJ_LEVELS
    });
});

// Create Action
app.post("/create", (req, res) => {
    const result = addScore(req.body);
    if (!result.ok) {
        return res.status(400).render("iidx_form", {
            values: req.body,
            errors: result.errors,
            isEdit: false,
            DIFFICULTIES, LAMPS, VERSIONS, DJ_LEVELS
        });
    }
    res.redirect("/");
});

// Detail
app.get("/:id", (req, res) => {
    const id = toInt(req.params.id);
    const item = getScoreById(id);
    if (!item) return res.status(404).send("Not Found");
    res.render("iidx_detail", { data: item });
});

// Edit Form
app.get("/:id/edit", (req, res) => {
    const id = toInt(req.params.id);
    const item = getScoreById(id);
    if (!item) return res.status(404).send("Not Found");
    res.render("iidx_form", {
        values: item,
        errors: [],
        isEdit: true,
        DIFFICULTIES, LAMPS, VERSIONS, DJ_LEVELS
    });
});

// Update Action
app.post("/:id/update", (req, res) => {
    const id = toInt(req.params.id);
    const result = updateScore(id, req.body);
    if (!result.ok) {
        if (result.errors.includes("Not Found")) return res.status(404).send("Not Found");
        return res.status(400).render("iidx_form", {
            values: { ...req.body, id }, // Keep ID for form action
            errors: result.errors,
            isEdit: true,
            DIFFICULTIES, LAMPS, VERSIONS, DJ_LEVELS
        });
    }
    res.redirect("/" + id);
});

// Delete Action
app.post("/:id/delete", (req, res) => {
    const id = toInt(req.params.id);
    deleteScore(id);
    res.redirect("/");
});

const PORT = 8081;
app.listen(PORT, () => console.log(`IIDX App running on http://localhost:${PORT}`));
