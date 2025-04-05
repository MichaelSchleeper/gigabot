const express = require('express');
const path = require('path');
const router = express.Router();
const io = require('socket.io')(express.server);
router.get('/', (req, res)=>{
    res.sendFile(__dirname + "/video.html");
});
setInterval(() =>{
    io.emit('iamge', 'data');
}, 1000)

module.exports = router;
