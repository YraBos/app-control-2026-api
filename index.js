import express from "express";
import ftp from "basic-ftp";
import fs from "fs";

const app = express();
app.use(express.json());

// -------------------------
// ПАРОЛЬ
// -------------------------
const SERVER_PASSWORD = "123+321";

// -------------------------
// FTP CONFIG
// -------------------------
const ftpConfig = {
  host: "134.17.5.81",
  user: "ftpuser",
  password: "103181"
};
const remoteDir = "FTP/YRA/mira"; // каталог на FTP

// -------------------------
// FTP FUNCTIONS
// -------------------------
async function uploadJSON(data) {
  fs.writeFileSync("events.json", JSON.stringify(data, null, 2));
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.cd(remoteDir); // переходим в каталог
    await client.uploadFrom("events.json", "events.json"); // кладём файл
  } finally {
    client.close();
  }
}

async function downloadJSON() {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.cd(remoteDir); // переходим в каталог
    await client.downloadTo("events.json", "events.json");
  } finally {
    client.close();
  }
  return JSON.parse(fs.readFileSync("events.json", "utf8"));
}

// -------------------------
// API
// -------------------------

// Авторизация
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  res.json({ status: password === SERVER_PASSWORD ? "ok" : "fail" });
});

// Получить все события
app.get("/api/events", async (req, res) => {
  try {
    const data = await downloadJSON();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить событие
app.post("/api/events", async (req, res) => {
  try {
    const data = await downloadJSON();
    const newEvent = { id: Date.now(), ...req.body };
    if (!data.events) data.events = [];
    data.events.push(newEvent);
    await uploadJSON(data);
    res.json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить событие
app.put("/api/events/:id", async (req, res) => {
  try {
    const data = await downloadJSON();
    const id = parseInt(req.params.id);
    const idx = data.events.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    data.events[idx] = { ...data.events[idx], ...req.body };
    await uploadJSON(data);
    res.json(data.events[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить событие
app.delete("/api/events/:id", async (req, res) => {
  try {
    const data = await downloadJSON();
    const id = parseInt(req.params.id);
    data.events = data.events.filter(e => e.id !== id);
    await uploadJSON(data);
    res.json({ status: "deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// СТАРТ СЕРВЕРА
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
