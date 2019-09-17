const express = require('express');
const io = require('socket.io')();
const uuid = require('uuid/v4');

const NODE_ENV = process.env.NODE_ENV;

const app = express();

if (NODE_ENV === 'production') {
    app.use(express.static('client/build'));
}

let currentSeconds = 0;
let currentUser = '';
let messages = [];
let playedVideos = [];
let playlist = [];
let users = [];

io.on('connection', (client) => {

    client.on('userLoggedIn', (username) => {
        currentUser = username;
        
        users.push(currentUser)
        
        client.emit('loadData', {
            currentSeconds,
            messages,
            playedVideos,
            playlist,
            users
        });
        
        io.emit('userJoined', users);
    });

    client.on('clientAddedMessage', (message) => {
        message.id = uuid();
        messages.push(message);
        io.emit('serverAddedMessage', messages);
    });

    client.on('clientAddedVideo', (video) => {
        playlist.push(video);
        io.emit('serverAddedVideo', video);
    });

    client.on('clientDeletedVideo', (video) => {
        playlist = playlist.filter((v) => {
            return v.id !== video.id;
        });

        io.emit('serverDeletedVideo', video);
    });

    client.on('disconnect', () => {
        users = users.filter((u) => {
            return u !== currentUser;
        });

        currentUser = '';

        io.emit('userLeft', users);

        if (!users.length) {
            currentSeconds = 0;
            messages = [];
            playedVideos = [];
            playlist = [];
        }
    });
});

const port = process.env.PORT || 3000;
io.listen(port);
console.log(`Server started on port: ${port}`);