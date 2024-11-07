require('dotenv').config();
const path = require('path');
const express = require('express');
const router = require(path.join(__dirname, './routes.js'));

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use('/loaderio-89bdd503722ff2b68d887292de4bfcf1', (req, res) => {
  res.send('loaderio-89bdd503722ff2b68d887292de4bfcf1');
})
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});
