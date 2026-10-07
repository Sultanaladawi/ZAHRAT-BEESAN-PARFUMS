const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    store: 'زهرة بيسان للعطور | Zahrat Beesan Parfums',
    version: '0.1.0-alpha',
    theme: 'Ivory & Royal Gold'
  });
});

app.listen(PORT, () => {
  console.log(`✨ Zahrat Beesan Parfums running at: http://localhost:${PORT}`);
});
