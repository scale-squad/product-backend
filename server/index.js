require('dotenv').config();
const path = require('path');
const express = require('express');
const router = require(path.join(__dirname, './routes.js'));

const PORT = process.env.port || 3000;

const app = express();
app.use(express.json());
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});
