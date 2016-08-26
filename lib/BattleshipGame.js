var _ = require('lodash');


class BattleshipGame {
    constructor(playerA, playerB) {
        var players = [playerA, playerB]
        if (players.length != 2) {
            throw new Error("Should be 2 players")
        }

        this.gameId = _.uniqueId();
        this.rockets = []
        this.players = players.map((it) => new BattleshipPlayer(it))
    }

    current() {
        return this.players[0]
    }

    opponent() {
        return _.last(this.players)
    }

    next() {
        this.players = this.players.reverse();
        return this.players;
    }

    isValidTurn(playerId) {
        return this.current().playerId === _.toInteger(playerId)
    }

    shoot(playerId, coords) {
        if (this.isValidTurn(playerId)) {
            var current = this.current();
            var opponent = this.opponent();

            var rocket = current.fire(coords)

            this.rockets.push(rocket)

            opponent.receive(rocket);

            if (rocket.hasHit()) {
                if (opponent.isGameOver()) {
                    this.winner = current
                }
            }

            this.next()

            return rocket
        }
        else {
            throw {message: "Is not your turn"}
        }
    }

    isGameActive() {
        return !this.winner
    }

    getPlayerData(playerId) {
        return _.find(this.players, {playerId: _.toInteger(playerId)});
    }
}


// singleton battleship just for Demo
BattleshipGame.getInstance = function () {
    if (!BattleshipGame._instance)
        BattleshipGame._instance = new BattleshipGame(
            {
                playerId: 1,
                ships: [{
                    name: 'Patrol Boat', size: 2, coords: [[1, 1], [2, 1]]
                }, {
                    name: 'Cruiser', size: 3, coords: [[6, 2], [6, 3], [6, 4]],
                }]
            },
            {
                playerId: 2,
                ships: [{
                    name: 'Patrol Boat', size: 2, coords: [[1, 1], [2, 1]]
                }, {
                    name: 'Cruiser', size: 3, coords: [[6, 2], [6, 3], [6, 4]],
                }]
            }
        )

    return BattleshipGame._instance
}

class BattleshipPlayer {
    constructor(opt) {
        this.playerId = opt.playerId
        this.ships = opt.ships && opt.ships.map((it)=> new Ship(it.name, it.coords))
    }

    fire(coords) {
        return new Rocket(coords, this.playerId)
    }

    receive(rocket) {
        _.find(this.ships, (ship) => rocket.hit(ship))
    }

    isGameOver() {
        return _.every(this.ships, (ship) => ship.isSunken())
    }

}

class Ship {
    constructor(name, coords) {
        this.name = name
        this.coords = coords
        this.size = coords.size
        this.hits = _.range(coords.size).map(() => null)
        this.status = "OK"
    }

    toJSON() {
        return _.pick(this, 'name', 'coords', 'status')
    }

    damage(index, rocket) {
        this.status
        this.hits[index] = this

        this.status = 'DAMAGE'

        if (_.every(this.hits)) {
            this.status = 'SUNKEN'
        }

    }

    isSunken() {
        return this.status === 'SUNKEN'
    }
}

class Rocket {
    constructor(coords, playerId) {
        this.playerId = playerId
        this.y = coords[0]
        this.x = coords[1]
        this.status = 'FIRE'
    }

    toString() {
        return [this.y, this.x].toString()
    }


    hit(ship) {
        var index = ship.coords.map(_.toString).indexOf(this.toString());

        if (index >= 0) {
            ship.damage(index, this)

            this.status = 'HIT'
            return true
        }
        else {
            this.status = 'MISS'
        }

        return false
    }

    hasHit() {
        return this.status == 'HIT'
    }
}


module.exports = BattleshipGame