import React from 'react';

export default class Login extends React.Component {

    constructor (props) {
        super(props);

        this.state = {
            username: ''
        };
    }

    onSubmit (e) {
        e.preventDefault();
        this.props.onSubmit(this.state.username);
    }

    render () {
        return (
            <div className="Login">
                <div className="container">
                    <div className="inner">
                        <h1>playlistr</h1>
                        <form onSubmit={(e) => this.onSubmit(e)}>
                            <input type="text" placeholder="Enter a username" value={this.state.username} onChange={(e) => this.setState({ username: e.target.value })} />
                            <button type="submit">Log In</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}