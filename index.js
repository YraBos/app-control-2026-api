const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/events', (req, res) => {
  console.log('Получен JSON:', req.body);
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API слушает порт ${PORT}`);
});
