import React from 'react';

class Login extends React.Component {

    constructor (args) {
        super(args);

        this.state = {
            username: ''
        };
    }

    onChange (e) {
        this.setState({ username: e.target.value });
    }

    onSubmit (e) {
        e.preventDefault();
        this.props.onSubmit(this.state.username);
    }

    render () {
        return (
            <div className="Login">
                <form onSubmit={(e) => this.onSubmit(e)}>
                    <input type="text" placeholder="Enter username here" value={this.state.username} onChange={(e) => this.onChange(e)} />
                    <button type="submit">Save</button>
                </form>
            </div>
        );
    }
}

export default Login;