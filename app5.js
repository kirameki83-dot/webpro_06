const path = require("path");
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

// beatmania ルーターをマウント
const beatmaniaRouter = require("./beatmania");
app.use("/iidx", beatmaniaRouter);

let station = [
  { id: 1, code: "JE01", name: "東京駅" },
  { id: 2, code: "JE07", name: "舞浜駅" },
  { id: 3, code: "JE12", name: "新習志野駅" },
  { id: 4, code: "JE13", name: "幕張豊砂駅" },
  { id: 5, code: "JE14", name: "海浜幕張駅" },
  { id: 6, code: "JE05", name: "新浦安駅" },
];

let station2 = [
  { id: 1, code: "JE01", name: "東京駅", change: "総武本線，中央線，etc", passengers: 403831, distance: 0 },
  { id: 2, code: "JE02", name: "八丁堀駅", change: "日比谷線", passengers: 31071, distance: 1.2 },
  { id: 3, code: "JE05", name: "新木場駅", change: "有楽町線，りんかい線", passengers: 67206, distance: 7.4 },
  { id: 4, code: "JE07", name: "舞浜駅", change: "舞浜リゾートライン", passengers: 76156, distance: 12.7 },
  { id: 5, code: "JE12", name: "新習志野駅", change: "", passengers: 11655, distance: 28.3 },
  { id: 6, code: "JE17", name: "千葉みなと駅", change: "千葉都市モノレール", passengers: 16602, distance: 39.0 },
  { id: 7, code: "JE18", name: "蘇我駅", change: "内房線，外房線", passengers: 31328, distance: 43.0 },
];

// Utils
const toInt = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const notEmpty = (s) => typeof s === "string" && s.trim().length > 0;

// Views
app.get("/keiyo2", (req, res) => {
  res.render("keiyo2", { data: station2 });
});

app.get("/keiyo2/:id", (req, res) => {
  const id = toInt(req.params.id);
  if (id === null) {
    return res.status(400).send("Bad Request: id は数値で指定してください。");
  }
  const detail = station2.find((s) => s.id === id);
  if (!detail) {
    return res.status(404).send("Not Found: 指定された駅が見つかりません。");
  }
  res.render("keiyo2_detail", { data: detail });
});

// JSON API
app.get("/api/keiyo2", (req, res) => {
  res.json(station2);
});

app.get("/api/keiyo2/:id", (req, res) => {
  const id = toInt(req.params.id);
  if (id === null) return res.status(400).json({ error: "id は数値で指定してください。" });
  const item = station2.find((s) => s.id === id);
  if (!item) return res.status(404).json({ error: "指定された駅が見つかりません。" });
  res.json(item);
});

// 追加（GET/POST 両対応）
function addStation(id, code, name) {
  const c = typeof code === "string" ? code.trim() : "";
  const n = typeof name === "string" ? name.trim() : "";
  if (id === null || !notEmpty(c) || !notEmpty(n)) {
    return { ok: false, status: 400, message: "id, code, name は必須です。" };
  }
  if (station.some((s) => s.id === id)) {
    return { ok: false, status: 409, message: "同じ id の駅が既に存在します。" };
  }
  if (station.some((s) => s.code === c)) {
    return { ok: false, status: 409, message: "同じ code の駅が既に存在します。" };
  }
  station.push({ id, code: c, name: n });
  return { ok: true };
}

app.get("/keiyo_add", (req, res) => {
  const result = addStation(toInt(req.query.id), req.query.code, req.query.name);
  if (!result.ok) return res.status(result.status).send(result.message);
  res.redirect("/keiyo");
});

app.post("/keiyo_add", (req, res) => {
  const result = addStation(toInt(req.body.id), req.body.code, req.body.name);
  if (!result.ok) return res.status(result.status).send(result.message);
  res.redirect("/keiyo");
});

app.get("/keiyo", (req, res) => {
  res.render("db1", { data: station });
});

app.get("/hello1", (req, res) => {
  res.render("show", { greet1: "Hello world", greet2: "Bon jour" });
});

app.get("/hello2", (req, res) => {
  res.render("show", { greet1: "Hello world", greet2: "Bon jour" });
});

app.get("/icon", (req, res) => {
  res.render("icon", { filename: "./public/Apple_logo_black.svg", alt: "Apple Logo" });
});

app.get("/omikuji1", (req, res) => {
  const num = Math.floor(Math.random() * 6 + 1);
  const map = { 1: "大吉", 2: "中吉", 3: "小吉", 4: "吉", 5: "末吉", 6: "凶" };
  const luck = map[num] || "吉";
  res.send("今日の運勢は" + luck + "です");
});

app.get("/omikuji2", (req, res) => {
  const num = Math.floor(Math.random() * 6 + 1);
  const map = { 1: "大吉", 2: "中吉", 3: "小吉", 4: "吉", 5: "末吉", 6: "凶" };
  const luck = map[num] || "吉";
  res.render("omikuji2", { result: luck });
});

const normalizeHand = (h) => {
  const key = String(h ?? "").toLowerCase();
  const map = {
    "0": "グー",
    "1": "チョキ",
    "2": "パー",
    rock: "グー",
    scissors: "チョキ",
    paper: "パー",
    "グー": "グー",
    "ちょき": "チョキ",
    "チョキ": "チョキ",
    "ぱー": "パー",
    "パー": "パー",
  };
  return map[key] || "グー";
};
const judge = (you, cpu) => {
  if (you === cpu) return "あいこ";
  if (
    (you === "グー" && cpu === "チョキ") ||
    (you === "チョキ" && cpu === "パー") ||
    (you === "パー" && cpu === "グー")
  )
    return "勝ち";
  return "負け";
};

app.get("/janken", (req, res) => {
  const yourHand = normalizeHand(req.query.hand);
  const num = Math.floor(Math.random() * 3 + 1);
  const cpu = num === 1 ? "グー" : num === 2 ? "チョキ" : "パー";

  let win = toInt(req.query.win) ?? 0;
  let total = toInt(req.query.total) ?? 0;

  const result = judge(yourHand, cpu);
  if (result === "勝ち") win += 1;
  total += 1;

  res.render("janken", {
    your: yourHand,
    cpu,
    judgement: result,
    win,
    total,
  });
});

// 404
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// 500
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

