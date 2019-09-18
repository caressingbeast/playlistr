const uuid = require('uuid/v4');

module.exports = function (io) {
    let currentSeconds = 0;
    let endCount = 0;
    let messages = [];
    let playedVideos = [];
    let playlist = [];
    let users = [];

    function checkForImageUrl (text) {
        return url.match(/\.(jpeg|jpg|gif|png)$/) !== null;
    }

    function clearData () {
        endCount = 0;
        messages = [];
        playedVideos = [];
        playlist = [];
        users = [];
    }

    io.on('connection', function (socket) {
        let currentUser = '';

        if (!users.length) {
            clearData();
        }
    
        // check for valid username
        socket.on('client_checkUsername', function (username) {
            const isDuplicate = users.filter((u) => {
                return u.toLowerCase() === username.toLowerCase();
            }).length > 0;
    
            socket.emit('server_checkUsername', {
                duplicate: isDuplicate,
                username
            });
        });

        socket.on('client_addUser', (username) => {
            currentUser = username;

            socket.emit('server_loadData', {
                apiKey: process.env.API_KEY,
                currentSeconds,
                messages,
                playedVideos,
                playlist,
                users
            });
                    
            const message = {
                id: uuid(),
                date: new Date(),
                system: true,
                text: 'joined the room.',
                user: currentUser
            };

            messages.push(message);
            
            // broadcast new message
            io.emit('server_addMessage', message);
    
            // broadcast new user
            io.emit('server_addUser', currentUser);

            users.push(username);
        });
    
        socket.on('client_addMessage', function (message) {
            message.date = new Date();
            message.id = uuid();

            // check for image
            if (checkForImageUrl(message.text)) {
                message.text = `<a href="${message.text}" target="new">${message.text}</a><br /><img src="${message.text}" alt="${message.text}" />`;
            }

            // TODO: check for URLs

            messages.push(message);

            io.emit('server_addMessage', message);
        });
    
        socket.on('client_addVideo', function (video) {
            const isDuplicate = playlist.find(v => v.id.videoId === video.id.videoId);

            if (isDuplicate) {
                return false;
            }

            playlist.push(video);

            io.emit('server_addVideo', video);
        });
    
        socket.on('client_deleteVideo', function (video) {
            playlist = playlist.filter(v => v.id.videoId !== video.id.videoId);
            io.emit('server_deleteVideo', video);
        });
    
        socket.on('client_endVideo', function () {
            endCount++;

            if (endCount !== users.length) {
                return false;
            }
            
            const [currentVideo, ...nextPlaylist] = playlist;

            playedVideos.push(currentVideo);
            playlist = nextPlaylist;

            // tell clients to play the next video
            io.emit('server_playVideo');

            // clear the count
            endCount = 0;
        });
    
        socket.on('client_ping', function () {
            // do nothing, keep connection alive
        });
    
        socket.on('disconnect', function () {

            // if the user is just a guest, exit
            if (!currentUser) {
                return false;
            }

            users = users.filter((u) => {
                return u !== currentUser;
            });

            if (users.length) {
                const message = {
                    id: uuid(),
                    date: new Date(),
                    system: true,
                    text: 'left the room.',
                    user: currentUser
                };

                messages.push(message);
        
                io.emit('server_addMessage', message);
                io.emit('server_deleteUser', currentUser);
            } else {
                clearData();
            }
    
            currentUser = '';
        });
    });
    
    setInterval(() => {
        io.sockets.emit('server_ping');
    }, 15000);
};