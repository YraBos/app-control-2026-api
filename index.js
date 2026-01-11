const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------
// ПОДКЛЮЧЕНИЕ К POSTGRESQL
// -------------------------
const pool = new Pool({
  connectionString: "postgresql://app_control:Lus3xcVsi5AL9K6oFy6cVZqVbIG3yjuX@dpg-d5ht8vkhg0os7387cugg-a.frankfurt-postgres.render.com/app_control",
  ssl: { rejectUnauthorized: false }
});

// -------------------------
// ФУНКЦИИ РАБОТЫ С БД
// -------------------------

// Загружаем JSON из таблицы
async function loadDB() {
  const result = await pool.query("SELECT data FROM events WHERE id = 1");
  return result.rows[0].data;
}

// Сохраняем JSON в таблицу
async function saveDB(db) {
  await pool.query(
    "UPDATE events SET data = $1, updated_at = NOW() WHERE id = 1",
    [db]
  );
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
app.post('/api/events', async (req, res) => {
  try {
    const incoming = req.body;
    const db = await loadDB();

    if (!Array.isArray(db.events)) db.events = [];

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
    await saveDB(db);

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Ошибка /api/events:", err);
    res.status(500).json({ error: "db error" });
  }
});

// Получение всех событий
app.get('/api/events', async (req, res) => {
  try {
    const db = await loadDB();
    res.json(db.events || []);
  } catch (err) {
    console.error("Ошибка /api/events GET:", err);
    res.status(500).json({ error: "db error" });
  }
});

// Очистка вручную
app.post('/api/events/clear', async (req, res) => {
  try {
    const db = { last_update: new Date().toISOString(), events: [] };
    await saveDB(db);
    console.log("История очищена вручную");
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Ошибка очистки:", err);
    res.status(500).json({ error: "db error" });
  }
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

schedule.scheduleJob(rule, async () => {
  try {
    const db = { last_update: new Date().toISOString(), events: [] };
    await saveDB(db);
    console.log("Авто-очистка в 00:00 по Минску");
  } catch (err) {
    console.error("Ошибка авто-очистки:", err);
  }
});

// -------------------------
// СТАРТ СЕРВЕРА
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API слушает порт ${PORT}`);
});
