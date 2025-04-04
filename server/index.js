const express = require('express');
const dotenv = require('dotenv');
const app = express();
process.on('SIGINT', shutDownServer);
process.on('SIGTERM', shutDownServer);
dotenv.config();
server = app.listen(process.env.PORT);
app.get('/', (req, res)=>{
    res.send(`server up on port: ${process.env.PORT}`);
});
function shutDownServer(){
    console.log("Shutting down server"); 
    server.close()
    console.log("Server shut down!\nGoodbye!"); 
    process.exit(0);
}
module.exports = app;