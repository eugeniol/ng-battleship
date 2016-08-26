(function () {

    angular
        .module("Demo", ["ngResource", "ui.router"])
        .config(function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('home', {
                    url: '/',
                    views: {
                        'content@': {
                            templateUrl: 'views/main.html',
                            controller: 'HomeController'
                        }
                    }
                })
                .state('gameDetail', {
                    url: '/game/:gameId/:playerId',
                    views: {
                        'content@': {
                            templateUrl: 'views/detail.html',
                            controller: 'GameDetailController'
                        }
                    }

                })

            $urlRouterProvider.otherwise('/')

        })
        .value('BOARD_SIZE', 10)
        .factory('BoardService', function (BOARD_SIZE) {
            return {
                createBoard: function (ships) {
                    var b = _.range(BOARD_SIZE).map(function (y) {
                        return _.range(BOARD_SIZE).map(function (x) {
                            return {
                                x: x,
                                y: y
                            }
                        })
                    })

                    if (ships)
                        ships.forEach(function (ship) {
                            ship.coords.forEach(function (coord) {
                                b[coord[0]][coord[1]].ship = ship;
                            })
                        })

                    return b
                }
            }
        })
        .directive('board', function (BOARD_SIZE) {
            return {
                templateUrl: 'views/directives/board.html',
                scope: {
                    ngModel: '=',
                    showShips: '=',
                    select: '='
                },
                controller: function ($scope) {
                    var ngModel = $scope.ngModel;
                    $scope.board = ngModel
                    $scope.size = BOARD_SIZE;
                    var labels = {
                        x: _.range(BOARD_SIZE).map(function (it) {
                            return it + 1
                        }),
                        y: _.range(BOARD_SIZE).map(function (it) {
                            return String.fromCharCode(65 + it)
                        })
                    };

                    $scope.labels = labels

                }
            }
        })
        .controller("HomeController", function ($scope) {
            $scope.gameId = _.uniqueId();
        })
        .controller('GameDetailController', function ($scope, $stateParams, BoardService, $timeout) {
            var gameId = $stateParams.gameId;
            var playerId = $stateParams.playerId;
            var socket = io();

            $scope.rockets = []

            socket.on('game error', function (err) {
                alert(JSON.stringify(err))
            })

            socket.on('rocket hit', function (rocket) {
                $scope.status = "your rocket hit! fire again!"
                $scope.$digest();

            })
            socket.on('rocket fail', function (rocket) {
                $scope.status = "your rocket fail, wating opponent"
                $scope.$digest();

            })


            socket.on('rocket done', function (rocket) {

                $scope.rockets.unshift(rocket)

                var board = playerId == rocket.playerId ? $scope.yourBoard : $scope.myBoard
                board[rocket.y][rocket.x].rocket = rocket
                $scope.$digest();

            })

            socket.on('player ships', function (ships) {
                $scope.myBoard = BoardService.createBoard(ships)
                $scope.$digest();
            })

            socket.on('waiting opponent', function (rocket) {
                $scope.status = "Wating opponent"
                $scope.$digest();
            })

            socket.on('game over', function (data) {
                $scope.isTurn = false

                $scope.status = "Game Over player  " +
                    data.winner + " has won"
                $scope.$digest();
            })

            socket.on('game start', function (rocket) {
                $scope.status = ""
                $scope.$digest();
            })

            socket.on('turn on', function (rocket) {
                $scope.isTurn = true
                $scope.$digest();
            })

            socket.on('turn off', function (rocket) {
                $scope.isTurn = false
                $scope.$digest();
            })

            $timeout(function () {
                socket.emit('start game', {gameId: gameId, playerId: playerId})
            }, 1000)


            $scope.shootShip = function (cel) {
                if ($scope.isTurn)
                    socket.emit('fire rocket', {
                        gameId: gameId,
                        playerId: playerId,
                        x: cel.x,
                        y: cel.y
                    })
            }


            $scope.yourBoard = BoardService.createBoard()

        })
})()