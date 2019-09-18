import React from 'react';

import axios from 'axios';
import YTPlayer from 'yt-player';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import Chat from './Chat';
import Login from './Login';
import Playlist from './Playlist';
import SearchResults from './SearchResults';

import io from 'socket.io-client';
const socket = io('http://localhost:5000');

class Main extends React.Component {

    state = {
        apiKey: '',
        currentSeconds: 0,
        loaded: false,
        messages: [],
        playedVideos: [],
        player: null,
        playlist: [],
        searchInput: '',
        searchQuery: '',
        searchResults: [],
        timer: null,
        username: '',
        users: [],
    }

    constructor (props) {
        super(props);

        // user has attempted to log in
        socket.on('server_checkUsername', (res) => {
            if (res.duplicate) {
                return alert('That username is already taken.');
            }
            
            this.setState({ username: res.username });

            socket.emit('client_addUser', res.username);
        });

        // user has logged in, so load current state
        socket.on('server_loadData', (data) => {
            const player = new YTPlayer('#ytPlayer', {
                controls: false,
                info: false,
                keyboard: false,
                modestBranding: true,
                related: false,
                width: '100%'
            });

            data.loaded = true;
            data.player = player;
            
            this.setState(data, () => {
                this.initSocketEvents();
                this.initPlayerEvents();
                this.loadVideo(this.state.playlist[0], data.currentSeconds);
            });
        });
    }

    initPlayerEvents () {
        const player = this.state.player;

        player.on('playing', () => {
            const timer = setInterval(() => {
                socket.emit('updateCurrentSeconds', player.getCurrentTime());
            }, 1000);

            this.setState({
                timer
            });
        });

        player.on('ended', () => {
            clearInterval(this.state.timer);
            socket.emit('client_endVideo');
        });

        // on error, load the next video
        player.on('error', (err) => {
            player.trigger('ended');
        });

        // on unplayable, load the next video
        player.on('unplayable', () => {
            player.trigger('ended');
        });
    }

    initSocketEvents () {

        // all users have finished current video, so play the next one
        socket.on('server_playVideo', () => {
            const [currentVideo, ...playlist] = this.state.playlist;
            const playedVideos = this.state.playedVideos;

            playedVideos.push(currentVideo);

            this.setState({
                playedVideos,
                playlist
            }, () => {
                this.loadVideo(playlist[0]);
            });
        });

        // user has added a message
        socket.on('server_addMessage', (message) => {
            const messages = this.state.messages;

            messages.push(message);

            this.setState({ messages });
        });

        // user has added a video
        socket.on('server_addVideo', (video) => {
            const playlist = this.state.playlist;
            const searchResults = this.state.searchResults.filter((r) => {
                return r.id.videoId !== video.id.videoId;
            });

            playlist.push(video);

            this.setState({ playlist, searchResults }, () => {
                const playerState = this.state.player.getState();

                // play the new video if there are none or the previous playlist is over
                if (playerState === 'unstarted' || playerState === 'ended') {
                    this.loadVideo(playlist[0]);
                }
            });
        });

        // user has deleted a video
        socket.on('server_deleteVideo', (video) => {
            const playlist = this.state.playlist.filter((v) => {
                return v.id.videoId !== video.id.videoId;
            });

            this.setState({
                playlist
            });
        })

        // a user has logged in
        socket.on('server_addUser', (username) => {
            const users = this.state.users;

            users.push(username);

            this.setState({ users });
        });

        // a user has disconnected
        socket.on('server_deleteUser', (username) => {
            const users = this.state.users.filter((u) => {
                return u !== username;
            });

            this.setState({ users });
        });

        socket.on('server_ping', () => {
            axios.get('/ping').then(() => {
                socket.emit('client_ping');
            });
        });
    }

    loadVideo (video, startSeconds) {
        if (!video) {
            return false;
        }

        this.state.player.load({ 
            videoId: video.id.videoId, 
            startSeconds: startSeconds ? (startSeconds + 3) : 0 
        }, true);
    }

    onClearSearch () {
        this.setState({
            searchInput: '',
            searchQuery: '',
            searchResults: []
        });
    }

    onLoadResult (video) {
        video.user = this.state.username;
        socket.emit('client_addVideo', video);
    }

    onLogin (username) {
        socket.emit('client_checkUsername', username);
    }

    onMessage (message) {
        message.user = this.state.username;
        socket.emit('client_addMessage', message);
    }

    onSearch (e) {
        e.preventDefault();
        
        const query = this.state.searchInput;

        if (!query) {
            return false;
        }

        axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: this.state.apiKey,
                type: 'video',
                maxResults: '20',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default',
                q: query
            }
        }).then((res) => {
            this.setState({
                searchQuery: query,
                searchResults: res.data.items
            });
        });
    }

    onVideoDelete (video) {
        socket.emit('client_deleteVideo', video);
    }

    render () {
        const loggedIn = !!this.state.username;

        return (
            <div className="Main">
                {!loggedIn && <Login onSubmit={this.onLogin.bind(this)} />}
                {loggedIn &&
                    <React.Fragment>
                        <div className="header">
                            <div className="column floatLeft">
                                <h1>playlistr</h1>
                            </div>
                            <div className="column floatRight">
                                <form onSubmit={(e) => this.onSearch(e)}>
                                    <input type="text" value={this.state.searchInput} placeholder="Search YouTube" onChange={(e) => this.setState({ searchInput: e.target.value})} />
                                    <button type="submit"><FontAwesomeIcon icon={faSearch} /></button>
                                </form>
                            </div>
                        </div>
                        <div className="content">
                            <div className="column floatLeft">
                                {this.state.searchResults.length > 0 && <SearchResults query={this.state.searchQuery} results={this.state.searchResults} onClearSearch={this.onClearSearch.bind(this)} onLoadResult={this.onLoadResult.bind(this)} />}
                                {!this.state.searchResults.length && <Chat messages={this.state.messages} user={this.state.username} users={this.state.users} onSubmit={this.onMessage.bind(this)} />}
                            </div>
                            <div className="column floatRight">
                                <div className="playerContent">
                                    <div className="playerOverlay"></div>
                                    <div id="ytPlayer"></div>
                                </div>
                                <Playlist playedVideos={this.state.playedVideos} playlist={this.state.playlist} username={this.state.username} onVideoDelete={this.onVideoDelete.bind(this)} />
                            </div>
                        </div>
                        <div className="footer">made by <a href="https://github.com/caressingbeast/playlistr">caressingbeast</a></div>
                    </React.Fragment>   
                }
            </div>
        );
    }
}

export default Main;