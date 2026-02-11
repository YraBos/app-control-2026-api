import express from "express";
import ftp from "basic-ftp";
import fs from "fs";

const app = express();
app.use(express.json());

const ftpConfig = {
  host: "134.17.5.81",
  user: "ftpuser",
  password: "103181"
};

const remotePath = "/FTP/YRA/mira/events.json";

// Загрузка JSON на FTP
async function uploadJSON(data) {
  fs.writeFileSync("events.json", JSON.stringify(data, null, 2));
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.uploadFrom("events.json", remotePath);
  } finally {
    client.close();
  }
}

// Чтение JSON с FTP
async function downloadJSON() {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.downloadTo("events.json", remotePath);
  } finally {
    client.close();
  }
  return JSON.parse(fs.readFileSync("events.json", "utf8"));
}

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

