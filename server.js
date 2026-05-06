const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();//allow env variable use

const uri = process.env.MONGO_URI;//use .env variable
if (!uri) {
  console.error("MONGO_URI is not defined in .env file");
  process.exit(1);
}
const app = express();
app.use(express.json());
const port = process.env.PORT;

if (!port) {
  console.error("PORT is not defined in .env file");
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("Could not connect to MongoDB", err);
    process.exit(1);
  });

//------------------------------routes-------------------------------
//test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});
    

//start server node.js
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});