'use strict';

var app = angular.module('citegraph', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider.when("/search", {
    templateUrl: "partials/search",
    controller: "SearchController" }).when("/search/:query", {
    templateUrl: "partials/results",
    controller: "ResultsController" }).when("/graph/:query", {
    templateUrl: "partials/graph",
    controller: "GraphController" }).otherwise({ redirectTo: "/search" });
}]);

app.run(function ($rootScope, $location, $timeout) {
  $rootScope.$on('$viewContentLoaded', function () {
    $timeout(function () {
      componentHandler.upgradeAllRegistered();
    });
  });
});

app.directive('onFinishRender', ['$timeout', '$parse', function ($timeout, $parse) {
  return {
    restrict: 'A',
    link: function link(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit('ngRepeatFinished');
          if (!!attr.onFinishRender) {
            $parse(attr.onFinishRender)(scope);
          }
        });
      }
    }
  };
}]);

app.controller('SearchController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
  $scope.search = function (query) {
    $location.path("/search/" + query);
  };
}]);

app.controller('ResultsController', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
  $scope.Math = window.Math;
  $scope.query = $routeParams.query;
  console.log($scope.query);

  $scope.results = [];
  $scope.currentResults = [];
  $scope.index = 0;
  $scope.numResults = -1;

  $scope.search = function (query) {
    $location.path("/search/" + query);
  };

  $http.get('/findpaper/' + $scope.query).success(function (res) {
    $scope.results = res;
    $scope.numResults = $scope.results.length;
    $scope.currentResults = [];
    $scope.index = 0;

    for (var i = 0; i < 10 && i < $scope.numResults; i++) {
      $scope.currentResults.push($scope.results[i]);
    }
  });

  $scope.next = function () {
    $scope.currentResults = [];
    $scope.index += 10;
    for (var i = $scope.index; i < $scope.index + 10 && i < $scope.numResults; i++) {
      $scope.currentResults.push($scope.results[i]);
    }
  };

  $scope.prev = function () {
    $scope.currentResults = [];
    $scope.index -= 10;
    for (var i = $scope.index; i < $scope.index + 10 && i < $scope.numResults; i++) {
      $scope.currentResults.push($scope.results[i]);
    }
  };
}]);

app.controller('GraphController', ['$scope', '$http', '$routeParams', function ($scope, $http, $routeParams) {

  $scope.loading = true;

  $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
    componentHandler.upgradeAllRegistered();
  });

  $scope.keywords = {};

  $http.get('/keywords').success(function (res) {
    $scope.keywords = res;
  });

  $scope.filters = [];

  $scope.numChecked = 0;

  $scope.truncateLink = function (link) {
    link = link.replace('http://', '').replace('https://', '');
    var domain = link.split(/[/?#]/)[0];
    var domain_length = domain.length;
    var path = link.substr(domain_length);
    return domain.concat(path.substr(0, 6)).concat("...").concat(path.substr(-5));
  };

  $scope.updateNodes = function (topic) {

    if (topic.value) $scope.numChecked++;else $scope.numChecked--;

    if ($scope.numChecked == 0) {
      // display all
      $scope.sys.eachNode(function (node, pt) {
        if (!node.data.center) node.data.show = true;
      });
      $scope.sys.eachEdge(function (edge, pt1, pt2) {
        edge.data.show = true;
      });
    } else {
      var nodeIDs = []; // arborjs indices of nodes to hide

      $scope.sys.eachNode(function (node, pt) {
        if (!node.data.center) {

          if (!displayNode(node.data.keywords, $scope.filters)) {
            node.data.show = false;
            nodeIDs.push(node._id);
          } else node.data.show = true;
        }
      });
      $scope.sys.eachEdge(function (edge, pt1, pt2) {
        if (edge.source.data.center && edge.target.data.center) return;
        if (nodeIDs.indexOf(edge.source._id) != -1 || nodeIDs.indexOf(edge.target._id) != -1) edge.data.show = false;else edge.data.show = true;
      });
    }
  };

  var query = $routeParams.query;

  $http.get('/paper/' + query).success(function (res) {
    var paper = res.paper;

    var backNeighbors = paper.neighborsB;
    var backSize = backNeighbors.length;
    for (var i = 0; i < backSize; i++) {
      var numTopics = backNeighbors[i].k.length;
      for (var j = 0; j < numTopics; j++) {
        var curTopic = backNeighbors[i].k[j];
        var index = search($scope.filters, curTopic);
        if (index != -1) $scope.filters[index].count++;else $scope.filters.push({ id: curTopic, count: 1, value: false });
      }
    }

    var frontNeighbors = paper.neighborsF;
    var frontSize = frontNeighbors.length;
    for (var i = 0; i < frontSize; i++) {
      var numTopics = frontNeighbors[i].k.length;
      for (var j = 0; j < numTopics; j++) {
        var curTopic = frontNeighbors[i].k[j];
        var index = search($scope.filters, curTopic);
        if (index != -1) $scope.filters[index].count++;else $scope.filters.push({ id: curTopic, count: 1, value: false });
      }
    }

    // take the top n results
    $scope.filters.sort(function (t1, t2) {
      return t2.count - t1.count;
    });
    $scope.filters.length = Math.min(6, $scope.filters.length);

    for (var i = 0; i < $scope.filters.length; i++) {
      console.log($scope.keywords[$scope.filters[i].id]);
    }
    console.log(JSON.stringify($scope.filters));

    drawGraph($scope, paper, res.neighbors);
    $scope.loading = false;
  });
}]);

function displayNode(keywords, filters) {

  if (!keywords) return false;

  var size = keywords.length;
  var numFilters = filters.length;

  var found = false;
  for (var i = 0; i < size; i++) {

    for (var j = 0; j < numFilters; j++) {
      if (filters[j].value && keywords[i] == filters[j].id) {
        return true;
      }
    }
  }
  return false;
}

function search(myArray, nameKey) {
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].id === nameKey) {
      return i;
    }
  }
  return -1;
}

var updateGraph = function updateGraph(id) {
  // alert(JSON.stringify(id));

};

var getScore = function getScore(s1, s2) {

  var score = 0;
  var keys = [];
  for (var key in s1) {
    if (s1.hasOwnProperty(key)) keys.push(key);
  }

  for (var key in s2) {
    if (s2.hasOwnProperty(key) && keys.indexOf(key) == -1) keys.push(key);
  }

  var numKeys = keys.length;
  for (var i = 0; i < numKeys; i++) {
    var key = keys[i];
    if (key in s1 && key in s2) score += s1[key] * s2[key];
  }

  return score;
};

var drawGraph = function drawGraph($scope, paper, neighbors) {

  var curID = paper.id;

  var theUI = {
    nodes: {},
    edges: {}
  };

  theUI.nodes[curID] = {
    color: "red",
    shape: "dot",
    label: "          ",
    show: true,
    center: true
  };

  theUI.edges[curID] = {};

  if (paper.neighborsF.length == 0 && paper.neighborsB.length == 0) {
    theUI.nodes['dummyNode'] = {
      color: 'white',
      shape: 'dot',
      show: true,
      center: true
    };

    theUI.edges[curID]['dummyNode'] = { color: 'white', show: true };
  }

  var index = 1;

  var curSketch = paper.sketch;

  // for (var i = 0; i < paper.neighbors.length; i++) {
  //   theUI['nodes'][paper.neighbors[i]._id] = {
  //     color: "yellow",
  //     shape: "dot",
  //     label: "    " + index + "    ",
  //     keywords: paper.neighbors[i].k,
  //     show: true,
  //     center: false,
  //     link: "/graph/" + paper.neighbors[i]._id,
  //     update: updateGraph,
  //     score: getScore(curSketch, paper.neighbors[i].s)
  //   };
  // }

  console.log("what is happening");
  console.log(neighbors);

  for (var i = 0; i < paper.neighborsF.length; i++) {
    theUI['nodes'][paper.neighborsF[i]._id] = {
      color: "orange",
      shape: "dot",
      label: "    " + index + "    ",
      keywords: paper.neighborsF[i].k,
      show: true,
      center: false,
      link: "/graph/" + paper.neighborsF[i]._id,
      update: updateGraph,
      score: getScore(curSketch, paper.neighborsF[i].s)
    };

    var backNeighbors = paper.neighborsF[i].b;
    if (backNeighbors) {
      var size = backNeighbors.length;
      for (var j = 0; j < size; j++) {
        if (backNeighbors[j] in theUI.nodes) {

          if (!(paper.neighborsF[i]._id in theUI.edges)) theUI['edges'][paper.neighborsF[i]._id] = {};
          theUI['edges'][paper.neighborsF[i]._id][backNeighbors[j]] = { show: true };
        }
      }
    }

    var frontNeighbors = paper.neighborsF[i].f;
    if (frontNeighbors) {
      var size = frontNeighbors.length;
      for (var j = 0; j < size; j++) {
        if (frontNeighbors[j] in theUI.nodes) {
          // alert(JSON.stringify(frontNeighbors[j]));
          // theUI.edges[paper.neighborsF[i]._id][frontNeighbors[j]] = {};
          if (!(frontNeighbors[j] in theUI.edges)) theUI['edges'][frontNeighbors[j]] = {};
          theUI['edges'][frontNeighbors[j]][paper.neighborsF[i]._id] = { show: true };
        }
      }
    }
    // theUI.edges[cur][paper.neighborsF[i]._id] = {};
    index++;
  }

  for (var i = 0; i < paper.neighborsB.length; i++) {
    theUI.nodes[paper.neighborsB[i]._id] = {
      color: "blue",
      shape: "dot",
      label: "    " + index + "    ",
      keywords: paper.neighborsB[i].k,
      show: true,
      center: false,
      link: "/graph/" + paper.neighborsB[i]._id,
      update: updateGraph,
      score: getScore(curSketch, paper.neighborsB[i].s)
    };
    var backNeighbors = paper.neighborsB[i].b;
    if (backNeighbors) {
      var size = backNeighbors.length;
      for (var j = 0; j < size; j++) {
        if (backNeighbors[j] in theUI.nodes) {

          if (!(paper.neighborsB[i]._id in theUI.edges)) theUI['edges'][paper.neighborsB[i]._id] = {};
          theUI['edges'][paper.neighborsB[i]._id][backNeighbors[j]] = { show: true };
        }
      }
    }

    var frontNeighbors = paper.neighborsB[i].f;
    if (frontNeighbors) {
      var size = frontNeighbors.length;
      for (var j = 0; j < size; j++) {
        if (frontNeighbors[j] in theUI.nodes) {

          if (!(frontNeighbors[j] in theUI.edges)) theUI['edges'][frontNeighbors[j]] = {};
          theUI['edges'][frontNeighbors[j]][paper.neighborsB[i]._id] = { show: true };
        }
      }
    }
    index++;
  }

  $scope.sys = arbor.ParticleSystem(500, 900, 1); // create the system with sensible repulsion/stiffness/friction
  $scope.sys.parameters({ gravity: true, dt: 0.015 }); // use center-gravity to make the graph settle nicely (ymmv)
  $scope.sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...
  $scope.sys.graft(theUI);

  // Iterate through all neighbors, store a mapping from their node ids to their scores
};