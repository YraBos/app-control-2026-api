const express = require('express');
const app = express();

app.use(express.json());

// временное хранилище событий в памяти
const events = [];

// POST — добавление события
app.post('/api/events', (req, res) => {
  console.log('Получен JSON:', req.body);
  events.push(req.body); // сохраняем событие в массив
  res.json({ status: 'ok' });
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
