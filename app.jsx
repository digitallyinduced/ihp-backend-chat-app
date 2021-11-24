import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom'
import { initIHPBackend, DataSubscription } from 'ihp-datasync/ihp-datasync.js';
import { query, createRecord } from 'ihp-datasync/ihp-querybuilder.js';
import { useQueryResult } from 'ihp-datasync/ihp-datasync-react';
import { ensureIsUser, getCurrentUserId, useCurrentUser, logout } from 'ihp-backend';

function Chat() {
    const messages = useQueryResult(query('messages').orderBy('createdAt'));
    const user = useCurrentUser();
    
    if (messages === null) {
        return <LoadingIndicator/>;
    }

    return <div>
        <AppNavbar/>
        <div className="chat">
            {groupMessages(messages)
                .reverse()
                .map(messages => <MessagesSection
                        messages={messages}
                        key={messages[0].id}
                        ownMessages={messages[0].userId === user.id}
                        />
                )
            }
        </div>

        <NewChatMessage/>
    </div>
}

function LoadingIndicator() {
    return <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Loading...</span>
    </div>;
}

class NewChatMessage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { body: '' };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        return <form onSubmit={this.handleSubmit} disabled={this.state.loading}>
            <div className="form-group d-flex flex-row">
                <input
                    type="text"
                    className="form-control"
                    placeholder="New message"
                    value={this.state.body}
                    onChange={event => this.setState({ body: event.target.value })}
                    disabled={this.state.loading}
                />

                <button type="submit" className="btn btn-primary" disabled={this.state.loading}>Send</button>
            </div>
        </form>
    }

    async handleSubmit(event) {
        const form = event.target;

        event.preventDefault();
        if (this.state.body === '') {
            return;
        }

        this.setState({ loading: true });
        await createRecord('messages', { body: this.state.body, userId: await getCurrentUserId() });

        this.setState({ loading: false, body: '' });
    }
}

function MessagesSection({ messages, ownMessages }) {
    const className = (ownMessages ? "mine" : "yours") + " messages";
    return <div className={className}>
        {messages.map((message, index) => <ChatMessage message={message} key={message.id} isLast={index === (messages.length - 1)}/>)}
    </div>
}

function ChatMessage({ message, isLast }) {
    return <div className={"message" + (isLast ? " last" : "")}>{message.body}</div>
}

function AppNavbar() {
    const user = useCurrentUser();
    return <nav className="navbar navbar-expand-lg navbar-light bg-light mb-5">
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ml-auto">
                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            {user?.email}
                        </a>
                        <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                            <a className="dropdown-item" href="#" onClick={() => logout()}>Logout</a>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
}

function groupMessages(messages) {
    const messageSections = [];
    for (const message of messages) {
        let section = messageSections.length > 0 ? messageSections[messageSections.length - 1] : null;

        if (section && section[0].userId === message.userId) {
            section.push(message);
        } else {
            section = [message];
            messageSections.push(section)
        }
    }
    return messageSections;
}

initIHPBackend({
    host: 'https://bufsdidjdjbvdrgxnnuwplssrfbxwkun.di1337.com'
});

(async () => {
    await ensureIsUser();

    ReactDOM.render(<Chat/>, document.getElementById('app'));
})();
