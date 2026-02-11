import express from "express";
import cors from "cors";
import ftp from "basic-ftp";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

const SERVER_PASSWORD = "123+321";

const ftpConfig = { host: "134.17.5.81", user: "ftpuser", password: "103181" };
const remoteDir = "FTP/YRA/mira";

async function uploadJSON(data) {
  fs.writeFileSync("events.json", JSON.stringify(data, null, 2));
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.cd(remoteDir);
    await client.uploadFrom("events.json", "events.json");
  } finally {
    client.close();
  }
}

async function downloadJSON() {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.cd(remoteDir);
    await client.downloadTo("events.json", "events.json");
    return JSON.parse(fs.readFileSync("events.json", "utf8"));
  } catch {
    return { events: [] };
  } finally {
    client.close();
  }
}

app.post("/api/login", (req, res) => {
  const { password } = req.body;
  res.json({ status: password === SERVER_PASSWORD ? "ok" : "fail" });
});

app.get("/api/events", async (req, res) => res.json(await downloadJSON()));

app.post("/api/events", async (req, res) => {
  const data = await downloadJSON();
  const newEvent = { id: Date.now(), ...req.body };
  data.events.push(newEvent);
  await uploadJSON(data);
  res.json(newEvent);
});

app.put("/api/events/:id", async (req, res) => {
  const data = await downloadJSON();
  const id = parseInt(req.params.id);
  const idx = data.events.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  data.events[idx] = { ...data.events[idx], ...req.body };
  await uploadJSON(data);
  res.json(data.events[idx]);
});

app.delete("/api/events/:id", async (req, res) => {
  const data = await downloadJSON();
  const id = parseInt(req.params.id);
  data.events = data.events.filter(e => e.id !== id);
  await uploadJSON(data);
  res.json({ status: "deleted" });
});

app.post("/api/events/clear", async (req, res) => {
  const data = { events: [] };
  await uploadJSON(data);
  res.json({ status: "cleared" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
