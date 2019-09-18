const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 5000;

const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'production') {
    app.use(express.static('client/build'));
}

app.get('/ping', (req, res) => {
    return res.status(200).send(true);
});

app.get('*', function (req, res) {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

require('./sockets')(io);

server.listen(port);
console.log(`Server listening on port: ${port}`);