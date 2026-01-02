const express = require('express');
const app = express();

app.use(express.json());

// временное хранилище событий в памяти
const events = [];

// POST — добавление события
app.post('/api/events', (req, res) => {
  console.log('Получен JSON:', req.body);

  if (Array.isArray(req.body)) {
    // если пришёл массив объектов — добавляем все
    events.push(...req.body);
  } else {
    // если пришёл один объект — добавляем его
    events.push(req.body);
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
