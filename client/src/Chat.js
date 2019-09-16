import React from 'react';

class Chat extends React.Component {

    constructor (props) {
        super(props);

        this.state = {
            text: ''
        };
    }

    onSubmit (e) {
        e.preventDefault();

        this.props.onSubmit({
            text: this.state.text
        });

        this.setState({
            text: ''
        });
    }

    render () {
        return (
            <div className="Chat">
                <h3>Chat</h3>
                <ul>
                    {this.props.users.map((u) => {
                        return (
                            <li key={u}>{u}</li>
                        );
                    })}
                </ul>
                {this.props.messages.map((m) => {
                    return (
                        <div key={m.id} className="message">{m.text}</div>
                    );
                })}
                <form onSubmit={(e) => this.onSubmit(e)}>
                    <input type="text" placeholder="Enter message here" value={this.state.text} onChange={(e) => this.setState({ text: e.target.value})} />
                    <button type="submit">Send</button>
                </form>
            </div>
        );
    }
};

export default Chat;