"use strict";

const express = require("express");
const app = express();
const path = require("path");

// Express settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Data (In-memory)
let courses = [
    { id: 1, name: "言語と文化２ 中国語_情工", teacher: "王 瑞来", term: "後期", period: "月曜 3限", credits: 2, type: "必修" },
    { id: 2, name: "英語理解２ｃクラス", teacher: "小山 努", term: "後期", period: "月曜 6限", credits: 1, type: "選択" },
    { id: 3, name: "データ通信情工", teacher: "水本 旭洋", term: "後期", period: "火曜 1限", credits: 2, type: "必修" },
    { id: 4, name: "データサイエンス情工", teacher: "三木 大輔", term: "後期", period: "火曜 6限", credits: 2, type: "必修" },
    { id: 5, name: "キャリアデザイン１ 情工", teacher: "長谷川 武", term: "後期", period: "水曜 1限", credits: 1, type: "必修" },
    { id: 6, name: "アジャイルワーク１ 情工", teacher: "三木 大輔", term: "後期", period: "水曜 6限", credits: 2, type: "必修" },
    { id: 7, name: "微分積分情工 b・cクラス", teacher: "山下 温", term: "後期", period: "木曜 2限", credits: 2, type: "選択" },
    { id: 8, name: "英語表現２ｃクラス", teacher: "霜田 敦子", term: "後期", period: "木曜 5限", credits: 1, type: "選択" },
    { id: 9, name: "倫理学", teacher: "富山 豊", term: "後期", period: "木曜 7限", credits: 1, type: "必修" },
    { id: 10, name: "Webプログラミング情工", teacher: "須田 宇宙", term: "後期", period: "金曜 3限", credits: 2, type: "必修" }

];
let nextId = 11;

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
