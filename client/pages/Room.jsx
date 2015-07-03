var React = require('react')
var app = require('ampersand-app')

var EnrollForm = require('../views/room/EnrollForm.jsx')
var PlayerList = require('../views/room/PlayerList.jsx')

module.exports = React.createClass({
  displayName: 'Room',
  getInitialState: function () {
    return {
      roomId: this.props.room,
      status: 'anonymous',
      players: [],
      me: {}
    }
  },
  componentDidMount: function () {
    var self = this
    app.socket.on('room', function (data) {
      if (data.roomId !== self.state.roomId) {
        return
      }

      self.setState({
        players: data.room.players,
        isLeader: data.room.leader === self.state.me.id
      })
    })

    app.socket.on('room:players:enroll_confirmed', function (data) {
      console.log('room:players:enroll_confirmed', data)
      if (data.roomId !== self.state.roomId) {
        return
      }
      if (data.player.id === self.state.me.id) {
        console.log('enroll confirmed')
        self.setState({status: 'enrolled'})
      }
    })

    app.socket.on('room:game:start', function (data) {
      console.log('room:game:start', data)
      if (data.roomId !== self.state.roomId) {
        return
      }
      self.setState({status: 'playing'})
    })

    app.socket.emit('room:get', {
      roomId: this.state.roomId
    })

    window.onbeforeunload = function () {
      self.componentWillUnmount()
    }
  },
  componentWillUnmount: function () {
    app.socket.emit('room:players:leave', {
      roomId: this.state.roomId,
      player: this.state.me
    })
  },
  handleEnroll: function (data) {
    var me = {
      id: data.name,
      name: data.name
    }

    this.setState({me: me})
    app.socket.emit('room:players:enroll', {
      roomId: this.state.roomId,
      player: me
    })
  },
  handleStartGameClick: function () {
    app.socket.emit('room:game:start', {
      roomId: this.state.roomId
    })
  },
  render: function () {
    var content

    if (this.state.status === 'anonymous') {
      content = (<EnrollForm onChange={this.handleEnroll}/>)
    }

    if (this.state.status === 'enrolled') {
      if (this.state.players.length < 2) {
        content = (<span>Waiting for more players to join...</span>)
      } else if (this.state.isLeader) {
        content = (<button className='btn btn-primary' onClick={this.handleStartGameClick}>Start game!</button>)
      } else {
        content = (<span>Waiting for leader to start the game...</span>)
      }
    }

    if (this.state.status === 'playing') {
      content = (<div>THE GAME</div>)
    }

    return (
      <div>
        <h1>Room {this.state.roomId}</h1>

        <PlayerList players={this.state.players}/>

        {content}
      </div>
    )
  }
})
