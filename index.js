const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------
// ПУТИ К JSON-БАЗЕ
// -------------------------
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'events.json');

// Создаём каталог data/, если его нет
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log("Создан каталог data/");
}

// -------------------------
// ФУНКЦИИ РАБОТЫ С JSON
// -------------------------
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    console.log("Файл events.json отсутствует — создаём новый");
    const empty = { last_update: new Date().toISOString(), events: [] };
    saveDB(empty);   // ← ВАЖНО: создаём файл сразу
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// -------------------------
// ПАРОЛЬ
// -------------------------
const SERVER_PASSWORD = "123+321";

// -------------------------
// API
// -------------------------

// Авторизация
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  res.json({ status: password === SERVER_PASSWORD ? "ok" : "fail" });
});

// Добавление событий
app.post('/api/events', (req, res) => {
  const incoming = req.body;
  const db = loadDB();

  if (Array.isArray(incoming)) {
    incoming.forEach(item => {
      if (typeof item === 'string') {
        try {
          db.events.push(JSON.parse(item));
        } catch (e) {
          console.error("Ошибка парсинга строки:", e);
        }
      } else {
        db.events.push(item);
      }
    });
  } else {
    if (typeof incoming === 'string') {
      try {
        db.events.push(JSON.parse(incoming));
      } catch (e) {
        console.error("Ошибка парсинга строки:", e);
      }
    } else {
      db.events.push(incoming);
    }
  }

  db.last_update = new Date().toISOString();
  saveDB(db);

  res.json({ status: "ok" });
});

// Получение всех событий
app.get('/api/events', (req, res) => {
  const db = loadDB();
  res.json(db.events);
});

// Очистка вручную
app.post('/api/events/clear', (req, res) => {
  const db = { last_update: new Date().toISOString(), events: [] };
  saveDB(db);
  console.log("История очищена вручную");
  res.json({ status: "ok" });
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.send('API работает. Используй /api/events');
});

// -------------------------
// АВТО-ОЧИСТКА В 00:00 ПО МИНСКУ
// -------------------------
const rule = new schedule.RecurrenceRule();
rule.tz = 'Europe/Minsk';
rule.hour = 0;
rule.minute = 0;

schedule.scheduleJob(rule, () => {
  const db = { last_update: new Date().toISOString(), events: [] };
  saveDB(db);
  console.log("Авто-очистка JSON в 00:00 по Минску");
});

// -------------------------
// СТАРТ СЕРВЕРА
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API слушает порт ${PORT}`);
});
