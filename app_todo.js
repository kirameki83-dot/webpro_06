"use strict";

const express = require("express");
const app = express();
const path = require("path");

// Express settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Data
let todos = [
    { id: 1, title: "Webプログラミングの課題", limit: "2023-12-30", priority: "高", status: "未完了" },
    { id: 2, title: "バイトのシフト提出", limit: "2023-12-25", priority: "中", status: "完了" },
    { id: 3, title: "冬休みの予定を立てる", limit: "2024-01-05", priority: "低", status: "未完了" },
];
let nextId = 4;

// Utils
const toInt = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};

// CRUD
function getAllTodos() {
    return todos;
}

function getTodoById(id) {
    return todos.find((t) => t.id === id);
}

function validate(raw) {
    const errors = [];
    if (!raw.title || !raw.title.trim()) errors.push("タスク名は必須です");
    if (!raw.limit) errors.push("期限は必須です");
    return errors;
}

function addTodo(raw) {
    const errors = validate(raw);
    if (errors.length > 0) return { ok: false, errors };

    const newItem = {
        id: nextId++,
        title: raw.title.trim(),
        limit: raw.limit,
        priority: raw.priority || "中",
        status: raw.status || "未完了"
    };
    todos.push(newItem);
    return { ok: true, item: newItem };
}

function updateTodo(id, raw) {
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return { ok: false, errors: ["Not Found"] };

    const errors = validate(raw);
    if (errors.length > 0) return { ok: false, errors };

    todos[idx] = {
        ...todos[idx],
        title: raw.title.trim(),
        limit: raw.limit,
        priority: raw.priority || "中",
        status: raw.status || "未完了"
    };
    return { ok: true };
}

function deleteTodo(id) {
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return false;
    todos.splice(idx, 1);
    return true;
}

// Routes
app.get("/", (req, res) => {
    res.render("todo_list", { data: getAllTodos() });
});

app.get("/create", (req, res) => {
    res.render("todo_form", { values: { priority: "中", status: "未完了" }, errors: [], isEdit: false });
});

app.post("/create", (req, res) => {
    const result = addTodo(req.body);
    if (!result.ok) {
        return res.status(400).render("todo_form", { values: req.body, errors: result.errors, isEdit: false });
    }
    res.redirect("/");
});

app.get("/:id", (req, res) => {
    const id = toInt(req.params.id);
    const item = getTodoById(id);
    if (!item) return res.status(404).send("Not Found");
    res.render("todo_detail", { data: item });
});

app.get("/:id/edit", (req, res) => {
    const id = toInt(req.params.id);
    const item = getTodoById(id);
    if (!item) return res.status(404).send("Not Found");
    res.render("todo_form", { values: item, errors: [], isEdit: true });
});

app.post("/:id/update", (req, res) => {
    const id = toInt(req.params.id);
    const result = updateTodo(id, req.body);
    if (!result.ok) {
        return res.status(400).render("todo_form", { values: { ...req.body, id }, errors: result.errors, isEdit: true });
    }
    res.redirect("/" + id);
});

app.post("/:id/delete", (req, res) => {
    const id = toInt(req.params.id);
    deleteTodo(id);
    res.redirect("/");
});

const PORT = 8083;
app.listen(PORT, () => console.log(`Todo App running on http://localhost:${PORT}`));
