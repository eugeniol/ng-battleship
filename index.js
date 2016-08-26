var BattleshipGame = require('./lib/BattleshipGame')

var express = require('express');
var cors = require('express-cors')
var bodyParser = require('body-parser')

var _ = require('lodash');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.use(cors({allowedOrigins: ['*']}));                 // Supports tacking CORS headers into actual requests (as defined by the spec). Note that preflight requests are automatically handled by the router, and you can override the default behavior on a per-URL basis with server.opts(:url, ...).
app.use(bodyParser())

app.get('/game/:gameId/:playerId', function (req, res, next) {
    var game = BattleshipGame.getInstance();

    var playerData = game.getPlayerData(req.params.playerId)

    if (!playerData)
        return next(new Error("Game or player not found"));

    res.send(playerData)

    next();
})

// shot player 2
app.post('/game/:gameId/:playerId', function (req, res, next) {
    var game = BattleshipGame.getInstance();

    var playerId = _.toInteger(req.params.playerId)
    var coords = [req.body.y, req.body.x].map(_.toInteger)

    try {
        var rocket = game.shoot(playerId, coords)
        res.send(rocket)
        next();
    }
    catch (err) {
        next(err)
    }
})

// shot player 2
app.get('/game/:gameId/:playerId/check', function (req, res, next) {
    var game = BattleshipGame.getInstance();

    try {
        res.send(game.rockets)
        next();
    }
    catch (err) {
        next(err)
    }
})

io.on('connection', function (socket) {
    var game = BattleshipGame.getInstance();

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
    });
});


http.listen('80')

