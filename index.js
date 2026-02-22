import express from "express";
import cors from "cors";
import ftp from "basic-ftp";
import fs from "fs";
import schedule from "node-schedule";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

const SERVER_PASSWORD = "123+321";

const ftpConfig = { host: "134.17.5.81", user: "ftpuser", password: "103181" };
const remoteDir = "FTP/YRA/mira";

// загрузка JSON на FTP
async function uploadJSON(data) {
  if (!data.events) data.events = [];
  fs.writeFileSync("events.json", JSON.stringify(data, null, 2));

  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.cd(remoteDir);
    await client.uploadFrom("events.json", "events.json");
    console.log("Uploaded events:", data.events.length);
  } finally {
    client.close();
  }
}

// загрузка JSON с FTP
async function downloadJSON() {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.cd(remoteDir);
    await client.downloadTo("events.json", "events.json");

    const parsed = JSON.parse(fs.readFileSync("events.json", "utf8"));

    let events = [];
    if (Array.isArray(parsed.events)) events = parsed.events;
    else if (typeof parsed.events === "object") events = Object.values(parsed.events);

    console.log("Downloaded events:", events.length);
    return { events };
  } catch (err) {
    console.error("Download error:", err.message);
    return { events: [] };
  } finally {
    client.close();
  }
}

// авторизация
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  res.json({ status: password === SERVER_PASSWORD ? "ok" : "fail" });
});

// получить события
app.get("/api/events", async (req, res) => {
  const data = await downloadJSON();
  res.json(data.events || []);
});

// добавить событие
app.post("/api/events", async (req, res) => {
  try {
    const data = await downloadJSON();
    let incoming = req.body;

    // нормализация входящих данных
    if (!Array.isArray(incoming) && typeof incoming === "object") {
      incoming = Object.values(incoming).filter(v => typeof v === "object");
    }

    // добавление событий
    if (Array.isArray(incoming)) {
      incoming.forEach(ev => data.events.push({ id: Date.now(), ...ev }));
    } else {
      data.events.push({ id: Date.now(), ...incoming });
    }

    await uploadJSON({ events: data.events });
    res.json({ status: "ok", count: data.events.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// обновить событие
app.put("/api/events/:id", async (req, res) => {
  try {
    const data = await downloadJSON();
    const id = parseInt(req.params.id);
    const idx = data.events.findIndex(e => e.id === id);

    if (idx === -1) return res.status(404).json({ error: "Not found" });

    data.events[idx] = { ...data.events[idx], ...req.body };
    await uploadJSON({ events: data.events });

    res.json(data.events[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// удалить событие
app.delete("/api/events/:id", async (req, res) => {
  try {
    const data = await downloadJSON();
    const id = parseInt(req.params.id);

    data.events = data.events.filter(e => e.id !== id);
    await uploadJSON({ events: data.events });

    res.json({ status: "deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// очистить историю вручную
app.post("/api/events/clear", async (req, res) => {
  try {
    await uploadJSON({ events: [] });
    res.json({ status: "cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// автоматический сброс в течение часа
let lastReset = null;

const rule = new schedule.RecurrenceRule();
rule.tz = "Europe/Minsk";                 // часовой пояс
rule.hour = 0;                            // час: 00
rule.minute = new schedule.Range(0, 59);  // каждая минута в течение часа

schedule.scheduleJob(rule, async () => {
  const today = new Date().toISOString().slice(0, 10);

  if (lastReset !== today) {              // защита от повторного сброса
    console.log("Daily reset:", today);
    await uploadJSON({ events: [] });
    lastReset = today;
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
