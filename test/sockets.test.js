const expect = require('chai').expect;

const io = require('socket.io-client');

describe('sockets', () => {
    let socket;

    beforeEach((done) => {
        require('../server').server;
        socket = io.connect('http://localhost:5000');
        socket.on('connect', () => {
            done();
        });
    });

    afterEach((done) => {
        if (socket.connected) {
            socket.emit('test_clearData');
            socket.disconnect();
        }

        done();
    });

    describe('client_checkUsername', () => {

        it('checks if username is duplicate (unique)', (done) => {
            const username = 'username';

            socket.on('server_checkUsername', (data) => {
                expect(data.duplicate).to.be.false;
                expect(data.username).to.equal(username);
                done();
            });

            socket.emit('client_checkUsername', username);
        });

        it('checks if username is duplicate (duplicate)', (done) => {
            const username = 'username';

            socket.on('server_checkUsername', (data) => {
                expect(data.duplicate).to.be.true;
                expect(data.username).to.equal(username);
                done();
            });

            socket.emit('test_addData', { currentUser: username, users: [username] });
            socket.emit('client_checkUsername', username);
        });
    });

    describe('client_addUser', () => {

        it('loads data', (done) => {
            socket.on('server_loadData', (data) => {
                expect(data.currentSeconds).to.equal(0);
                expect(data.messages).to.deep.equal([]);
                expect(data.playedVideos).to.deep.equal([]);
                expect(data.playlist).to.deep.equal([]);
                expect(data.users).to.deep.equal([]);
                done();
            });

            socket.emit('client_addUser', 'username');
        });

        it('adds system message to "messages" and emits', (done) => {
            const username = 'username';

            socket.on('server_addMessage', (message) => {
                expect(message.date).to.not.be.undefined;
                expect(message.id).to.not.be.undefined;
                expect(message.system).to.be.true;
                expect(message.text).to.equal('joined the room.');
                expect(message.user).to.equal(username);
                done();
            });

            socket.emit('client_addUser', username);
        });

        it('adds user to "users" and emits', (done) => {
            const username = 'username';

            socket.on('server_addUser', (user) => {
                expect(user).to.equal(username);
                done();
            });

            socket.emit('client_addUser', username);
        });
    });

    describe('client_addMessage', () => {

        it('adds message to "messages" and emits', (done) => {
            const message = {
                text: 'text',
                user: 'user'
            };

            socket.on('server_addMessage', (res) => {
                expect(res.id).to.not.be.undefined;
                expect(res.date).to.not.be.undefined;
                expect(res.text).to.equal(message.text);
                expect(res.user).to.equal(message.user);
                done();
            });

            socket.emit('client_addMessage', message);
        });

        it('handles image URLs', (done) => {
            const url = 'http://google.com/img.jpg';
            const expected = `<a href="${url}" target="new">${url}</a><br /><img src="${url}" alt="${url}" />`;

            const message = {
                text: url,
                user: 'user'
            };

            socket.on('server_addMessage', (res) => {
                expect(res.text).to.equal(expected);
                done();
            });

            socket.emit('client_addMessage', message);
        });

        it('sanitizes HTML', (done) => {
            const message = {
                text: '<h1>Heading</h1><br /><p>Paragraph</p><br /><a href="https://google.com" onClick="javascript:void(0);">Google</a>',
                user: 'user'
            };

            const expected = 'Heading<br />Paragraph<br /><a href="https://google.com">Google</a>';

            socket.on('server_addMessage', (res) => {
                expect(res.text).to.equal(expected);
                done();
            });

            socket.emit('client_addMessage', message);
        });
    });

    describe('client_addVideo', () => {

        it('checks for duplicates', (done) => {
            const video = {
                id: {
                    videoId: 'videoId'
                }
            };

            socket.on('server_duplicateVideo', () => {
                done();
            });

            socket.emit('test_addData', { playlist: [video] });
            socket.emit('client_addVideo', video);
        });

        it('adds video to "playlist" and emits', (done) => {
            const video = {
                id: {
                    videoId: 'videoId'
                }
            };

            socket.on('server_addVideo', (res) => {
                expect(res).to.deep.equal(video);
                done();
            });

            socket.emit('client_addVideo', video);
        });
    });

    describe('client_deleteVideo', () => {

        it('deletes video from "playlist" and emits', (done) => {
            const video = {
                id: {
                    videoId: 'videoId'
                }
            };

            socket.on('server_deleteVideo', (res) => {
                expect(res).to.deep.equal(video);
                done();
            });

            socket.emit('test_addData', { playlist: [video] });
            socket.emit('client_deleteVideo', video);
        });
    });

    describe('client_endVideo', () => {

        it('moves video from "playlist" to "playedVideos" and emits event', (done) => {
            const video = {
                id: '1234567890'
            };

            socket.on('server_playVideo', (res) => {
                expect(res.playlist).to.have.lengthOf(0);
                expect(res.playedVideos).to.have.lengthOf(1);
                expect(res.playedVideos[0]).to.deep.equal(video);
                done();
            });

            socket.emit('test_addData', {
                playlist: [video],
                users: ['username']
            });

            socket.emit('client_endVideo');
        });
    });
});