const BattleshipGame = require('./lib/BattleshipGame').BattleshipGame
const GameFactory = require('./lib/BattleshipGame').GameFactory

const express = require('express');
const _ = require('lodash');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);


app.use(express.static(__dirname + '/public'));

var gameFactory = new GameFactory(BattleshipGame);

app.get('/status', function (req, res, next) {
    var data = {
        totalGames: _.size(gameFactory._games),
        gamesId: _.keys(gameFactory._games)
    }
    res.send(data)
    next()
})

io.on('connection', function (socket) {
    var playerData;

    socket.on('start game', function (data) {
        var playerId = data.playerId;

        var game = gameFactory.getInstance(data)
        playerData = game.getPlayerData(playerId);

        console.log("user connected")

        playerData.online = true;
        playerData.socket = socket;

        if (_.every(game.players, (it) => it.online)) {
            io.emit('game start')
            game.current().socket.emit('turn on')
        }
        else {
            socket.emit('waiting opponent')
        }

        socket.emit('player ships', playerData.ships)
    })


    socket.on('fire rocket', function (data) {
        var game = gameFactory.getInstance(data),
            playerId = data.playerId,
            coords = [data.y, data.x],
            current = game.current(),
            opponent = game.opponent();

        console.log("fire rocket", data)

        if (game.isValidTurn(playerId)) {
            console.log("turn valid")
            var rocket = current.fire(coords)
            opponent.receive(rocket)

            io.emit('rocket done', rocket)

            if (rocket.hasHit()) {
                socket.emit('rocket hit')

                opponent.socket.emit('turn off')
                current.socket.emit('turn on')

                if (opponent.isGameOver()) {
                    io.emit('game over', {winner: playerId})
                    gameFactory.removeInstance(data)
                    this.winner = current
                }
            }
            else {
                socket.emit('rocket fail')
                current.socket.emit('turn off')
                opponent.socket.emit('turn on')

                game.next()
            }


        }
        else {
            socket.emit('game error', {message: "Is not your turn"});
        }
    })
    socket.on('disconnect', function () {
        console.log('user disconnected');
        if (playerData)
            delete playerData.socket
    });
});


var port = process.env.PORT || 8080;
http.listen(port)

