"use strict";

const express = require("express");
const app = express();
const path = require("path");

// Express settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Data
let courses = [
    { id: 1, name: "Webプログラミング", teacher: "鈴木正人", term: "後期", period: "金曜5限", credits: 2, type: "必修" },
    { id: 2, name: "データベース", teacher: "佐藤一郎", term: "前期", period: "月曜2限", credits: 2, type: "選択" },
    { id: 3, name: "情報セキュリティ", teacher: "田中太郎", term: "後期", period: "水曜3限", credits: 2, type: "選択" },
];
let nextId = 4;

// Utils
const toInt = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};

// CRUD
function getAllCourses() {
    return courses;
}

function getCourseById(id) {
    return courses.find((c) => c.id === id);
}

function validate(raw) {
    const errors = [];
    if (!raw.name || !raw.name.trim()) errors.push("科目名は必須です");
    if (!raw.teacher || !raw.teacher.trim()) errors.push("担当教員は必須です");
    if (!raw.term) errors.push("開講期は必須です");
    if (!raw.period) errors.push("時限は必須です");
    const credits = toInt(raw.credits);
    if (credits === null || credits <= 0) errors.push("単位数は1以上の数値を入力してください");
    return errors;
}

function addCourse(raw) {
    const errors = validate(raw);
    if (errors.length > 0) return { ok: false, errors };

    const newItem = {
        id: nextId++,
        name: raw.name.trim(),
        teacher: raw.teacher.trim(),
        term: raw.term,
        period: raw.period,
        credits: toInt(raw.credits),
        type: raw.type || "選択"
    };
    courses.push(newItem);
    return { ok: true, item: newItem };
}

function updateCourse(id, raw) {
    const idx = courses.findIndex(c => c.id === id);
    if (idx === -1) return { ok: false, errors: ["Not Found"] };

    const errors = validate(raw);
    if (errors.length > 0) return { ok: false, errors };

    courses[idx] = {
        ...courses[idx],
        name: raw.name.trim(),
        teacher: raw.teacher.trim(),
        term: raw.term,
        period: raw.period,
        credits: toInt(raw.credits),
        type: raw.type || "選択"
    };
    return { ok: true };
}

function deleteCourse(id) {
    const idx = courses.findIndex(c => c.id === id);
    if (idx === -1) return false;
    courses.splice(idx, 1);
    return true;
}

// Routes
app.get("/", (req, res) => {
    res.render("course_list", { data: getAllCourses() });
});

app.get("/create", (req, res) => {
    res.render("course_form", { values: {}, errors: [], isEdit: false });
});

app.post("/create", (req, res) => {
    const result = addCourse(req.body);
    if (!result.ok) {
        return res.status(400).render("course_form", { values: req.body, errors: result.errors, isEdit: false });
    }
    res.redirect("/");
});

app.get("/:id", (req, res) => {
    const id = toInt(req.params.id);
    const item = getCourseById(id);
    if (!item) return res.status(404).send("Not Found");
    res.render("course_detail", { data: item });
});

app.get("/:id/edit", (req, res) => {
    const id = toInt(req.params.id);
    const item = getCourseById(id);
    if (!item) return res.status(404).send("Not Found");
    res.render("course_form", { values: item, errors: [], isEdit: true });
});

app.post("/:id/update", (req, res) => {
    const id = toInt(req.params.id);
    const result = updateCourse(id, req.body);
    if (!result.ok) {
        return res.status(400).render("course_form", { values: { ...req.body, id }, errors: result.errors, isEdit: true });
    }
    res.redirect("/" + id);
});

app.post("/:id/delete", (req, res) => {
    const id = toInt(req.params.id);
    deleteCourse(id);
    res.redirect("/");
});

const PORT = 8082;
app.listen(PORT, () => console.log(`Course Manager running on http://localhost:${PORT}`));
