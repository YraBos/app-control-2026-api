const express = require('express');
const app = express();

app.use(express.json());

// временное хранилище событий в памяти
const events = [];

// POST — добавление события
app.post('/api/events', (req, res) => {
  console.log('Получен JSON:', req.body);

  if (Array.isArray(req.body)) {
    req.body.forEach(item => {
      if (typeof item === 'string') {
        // элемент массива — строка, парсим в объект
        events.push(JSON.parse(item));
      } else {
        events.push(item);
      }
    });
  } else {
    if (typeof req.body === 'string') {
      events.push(JSON.parse(req.body));
    } else {
      events.push(req.body);
    }
  }

  // возвращаем то, что приняли
  res.json(req.body);
});

// GET — получение всех событий
app.get('/api/events', (req, res) => {
  res.json(events);
});

// корневой маршрут (чтобы проверить, что сервер жив)
app.get('/', (req, res) => {
  res.send('API работает. Используй /api/events');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API слушает порт ${PORT}`);
});
