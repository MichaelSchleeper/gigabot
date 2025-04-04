const express = require('express');
const dotenv = require('dotenv');
const app = express();
dotenv.config();
app.get('/', (req, res)=>{
    res.send(`server up on port: ${process.env.PORT}`);
})
app.listen(process.env.PORT);
module.exports = app;