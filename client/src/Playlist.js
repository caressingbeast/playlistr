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
        const { playlist, playedVideos } = this.props;
        const { playlistActive } = this.state;

        return (
            <div className="Playlist">
                {playlistActive && 
                    <div className="listView">
                        {!playlist.length &&
                            <p>No videos in queue.</p>
                        }
                        {playlist.map((video, i) => {
                            const isCurrentVideo = (i === 0);

                            return (
                                <div key={video.id.videoId} className={`video active-${isCurrentVideo}`}>
                                    {video.snippet.title}
                                    {!isCurrentVideo && this.props.username === video.user &&
                                        <button onClick={() => this.props.onVideoDelete(video)}>delete</button>
                                    }
                                </div>
                            );
                        })}
                    </div>
                }
                {!playlistActive &&
                    <div className="listView">
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
                <div className="playlistButtons">
                    <button className={this.state.playlistActive ? 'active' : ''} onClick={() => this.toggleActive(true)}>Queue ({playlist.length})</button>
                    <button className={this.state.playlistActive ? '' : 'active'} onClick={() => this.toggleActive(false)}>History ({playedVideos.length})</button>
                </div>
            </div>
        );
    }
};

export default Playlist;