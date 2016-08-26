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
                            controller: 'ShopController'
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

        .value('API_BASE_URL', window.location.protocol + "//" + location.hostname + ':8081/')
        .value('BOARD_SIZE', 10)
        .factory('GameService', function ($resource, API_BASE_URL) {
            return $resource(
                API_BASE_URL + 'game/:gameId/:playerId',
                {
                    gameId: '@gameId',
                    playerId: '@playerId'
                },
                {
                    shoot: {
                        method: 'POST'
                    },
                    check: {
                        method: 'GET',
                        url: API_BASE_URL + 'game/:gameId/:playerId/check',
                        isArray: true
                    }
                })
        })
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
        .controller("ShopController", function ($scope) {
            $scope.gameId = _.uniqueId();
        })
        .controller('GameDetailController', function ($scope, $stateParams, GameService, BoardService, $interval) {
            var gameId = $stateParams.gameId;
            var playerId = $stateParams.playerId;

            var socket = io();
            var lastShoot = null
            $scope.rockets = []

            socket.on('game error', function (err) {
                alert(JSON.stringify(err))
            })

            socket.on('rocket done', function (rocket) {
                if (lastShoot)
                    lastShoot.rocket = rocket

                $scope.rockets.unshift(rocket)

                $scope.$digest();

                lastShoot = null
            })

            socket.on('turn on', function (rocket) {
                $scope.isTurn = true
                $scope.$digest();
            })

            socket.on('turn off', function (rocket) {
                $scope.isTurn = false
                $scope.$digest();
            })


            socket.emit('start game', {gameId: gameId, playerId: playerId})


            $scope.shootShip = function (cel) {
                socket.emit('fire rocket', {
                    gameId: gameId,
                    playerId: playerId,
                    x: cel.x,
                    y: cel.y
                })
                lastShoot = cel;
            }


            GameService
                .get($stateParams).$promise
                .then(function (ret) {
                    $scope.myBoard = BoardService.createBoard(ret.ships)

                })


            $scope.yourBoard = BoardService.createBoard()

        })
})()