require('dotenv').config();
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const responseLogger = require('./middleware/responseLogger.js')
const express = require('express');
// const rateLimit = require('express-rate-limit'); //maybe a bit later;
const router = require(path.join(__dirname, './routes.js'));

const PORT = process.env.port || 3000;

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// });

const app = express();
app.use(express.json());
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});


// app.use(limiter); //maybe come back to this


