const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const app = express();

app.use(cors());
app.use(express.json());

// временное хранилище событий в памяти
let events = [];

// 🔑 пароль для входа
const SERVER_PASSWORD = "123+321";

// POST — проверка пароля
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === SERVER_PASSWORD) {
    res.json({ status: "ok" });
  } else {
    res.json({ status: "fail" });
  }
});

// POST — добавление события
app.post('/api/events', (req, res) => {
  console.log('Получен JSON:', req.body);

  if (Array.isArray(req.body)) {
    req.body.forEach(item => {
      if (typeof item === 'string') {
        try {
          events.push(JSON.parse(item));
        } catch (e) {
          console.error('Ошибка парсинга строки:', e);
        }
      } else {
        events.push(item);
      }
    });
  } else {
    if (typeof req.body === 'string') {
      try {
        events.push(JSON.parse(req.body));
      } catch (e) {
        console.error('Ошибка парсинга строки:', e);
      }
    } else {
      events.push(req.body);
    }
  }

  res.json(req.body);
});

// GET — получение всех событий
app.get('/api/events', (req, res) => {
  res.json(events);
});

// POST — очистка истории вручную
app.post('/api/events/clear', (req, res) => {
  events = [];
  console.log("История очищена вручную через API");
  res.json({ status: "ok", message: "История очищена" });
});

// корневой маршрут
app.get('/', (req, res) => {
  res.send('API работает. Используй /api/events');
});

// 🔹 очистка массива каждый день в 00:00 по Минску
const rule = new schedule.RecurrenceRule();
rule.tz = 'Europe/Minsk';
rule.hour = 0;
rule.minute = 0;

schedule.scheduleJob(rule, () => {
  events = [];
  console.log("Массив событий очищен в 00:00 по Минску");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API слушает порт ${PORT}`);
});
