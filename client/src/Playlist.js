import React from 'react';

class Playlist extends React.Component {

    constructor (props) {
        super(props);

        this.state = {
            playlistActive: true
        };
    }

    toggleActive (toggle) {
        this.setState({
            playlistActive: toggle
        });
    }

    render () {
        const { playedVideos } = this.props;
        const { playlistActive } = this.state;
        const [currentVideo, ...playlist] = this.props.playlist;

        return (
            <div className="Playlist">
                <button onClick={() => this.toggleActive(true)}>Queue</button>
                <button onClick={() => this.toggleActive(false)}>History</button>
                {playlistActive && 
                    <div className="playlistView">
                        {!currentVideo && !playlist.length &&
                            <p>No videos in queue.</p>
                        }
                        {currentVideo &&
                            <div key={currentVideo.id.videoId} className="currentVideo">
                                {currentVideo.snippet.title}
                            </div>
                        }
                        {playlist.map((video) => {
                            return (
                                <div key={video.id.videoId} className="video">
                                    {video.snippet.title}
                                    {this.props.username === video.user &&
                                        <button onClick={() => this.props.onVideoDelete(video)}>delete</button>
                                    }
                                </div>
                            );
                        })}
                    </div>
                }
                {!playlistActive &&
                    <div className="playedVideosView">
                        {!playedVideos.length &&
                            <p>No videos in history.</p>
                        }
                        {playedVideos.map((video) => {
                            return (
                                <div key={video.id.videoId} className="video">
                                    {video.snippet.title}
                                </div>
                            );
                        })}
                    </div>
                }
            </div>
        );
    }
};

export default Playlist;