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
                ships: [
                    {
                        coords: [[1, 1], [2, 1]]
                    },
                    {
                        coords: [[6, 2], [6, 3], [6, 4]],
                    },
                    {
                        coords: [[7, 3], [7, 4], [7, 5], [7, 6]],
                    },
                    {
                        coords: [[3, 7], [3, 8], [3, 8]],
                    }

                ]
            },
            {
                playerId: 2,
                ships: [
                    {
                        coords: [[2, 1], [3, 1]]
                    },
                    {
                        coords: [[7, 2], [7, 3], [7, 4]],
                    },
                    {
                        coords: [[8, 3], [8, 4], [8, 5], [8, 6]],
                    },
                    {
                        coords: [[4, 7], [4, 8], [4, 8]]
                    }
                ]
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