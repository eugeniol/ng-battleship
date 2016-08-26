const BattleshipGame = require('./lib/BattleshipGame')
const express = require('express');
const _ = require('lodash');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
    var playerData;
    var game = BattleshipGame.getInstance();

    socket.on('start game', function (data) {
        playerData = game.getPlayerData(data.playerId);

        playerData.online = true;
        playerData.socket = socket;

        if (_.every(game.players, (it) => it.online)) {
            game.current().socket.emit('game start')
            game.current().socket.emit('turn on')
        }
        else {
            game.current().socket.emit('waiting opponent')
        }

        socket.emit('player ships', playerData.ships)
    })


    socket.on('fire rocket', function (data) {

        var playerId = data.playerId, coords = [data.y, data.x]

        try {
            var rocket = game.shoot(playerId, coords)


            io.emit('rocket done', rocket);
        }
        catch (err) {
            console.log(err)
            socket.emit('game error', err);
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

