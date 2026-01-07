const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule'); // 🔹 планировщик
const app = express();

app.use(cors());
app.use(express.json());

// временное хранилище событий в памяти
let events = [];

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

  res.json(req.body); // возвращаем то, что приняли
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

// корневой маршрут (чтобы проверить, что сервер жив)
app.get('/', (req, res) => {
  res.send('API работает. Используй /api/events');
});

// 🔹 очистка массива каждый день в 00:00 по Минску через RecurrenceRule
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
