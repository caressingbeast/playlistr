import React from 'react';

function formatDate (timestamp) {
    const date = new Date(timestamp);
    
    return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

export default class Chat extends React.Component {

    constructor (props) {
        super(props);

        this.state = {
            text: ''
        };
    }

    componentDidUpdate () {
        this.el.scrollTop = this.el.scrollHeight;
    }

    onSubmit (e) {
        e.preventDefault();

        const text = this.state.text;

        if (!text) {
            return false;
        }

        this.props.onSubmit({
            text
        });

        this.setState({
            text: ''
        });
    }

    render () {
        return (
            <div className="Chat">
                <div className="userList">
                    <ul>
                        {this.props.users.map((u) => {
                            return (
                                <li key={u}>{u}{u === this.props.user && ' (you)'}</li>
                            );
                        })}
                    </ul>
                </div>
                <div className="messageList" ref={el => this.el = el}>
                    {this.props.messages.map((m) => {
                        return (
                            <div key={m.id} id={m.id} className="message">
                                <div className="messageHeader">
                                    <strong>{m.user}</strong><span>{formatDate(m.date)}</span>
                                </div>
                                <div className={`messageText system-${m.system}`} dangerouslySetInnerHTML={{ __html: m.text }}></div>
                            </div>
                        );
                    })}
                </div>
                <form onSubmit={(e) => this.onSubmit(e)}>
                    <input type="text" placeholder="Enter message" value={this.state.text} onChange={(e) => this.setState({ text: e.target.value})} />
                    <button type="submit">Send</button>
                </form>
            </div>
        );
    }
};