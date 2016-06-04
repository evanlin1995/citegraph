var app = angular.module('citegraph', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', ($routeProvider, $locationProvider) => {
  $locationProvider.html5Mode(true);
  $routeProvider
    .when("/search", {
      templateUrl: "partials/search",
      controller: "SearchController" })
    .when("/search/:query", {
      templateUrl: "partials/results",
      controller: "ResultsController" })
    .when("/graph/:query", {
      templateUrl: "partials/graph",
      controller: "GraphController" })
    .otherwise({ redirectTo: "/search" });
}]);

app.run(function($rootScope, $location, $timeout) {
    $rootScope.$on('$viewContentLoaded', function() {
        $timeout(function() {
            componentHandler.upgradeAllRegistered();
        });
    });
});

app.controller('SearchController', ['$scope', '$http', '$location', ($scope, $http, $location) => {
  $scope.search = (query) => {
    $location.path("/search/" + query);
  };
}]);

app.controller('ResultsController', ['$scope', '$http', '$location', '$routeParams', ($scope, $http, $location, $routeParams) => {
  $scope.Math = window.Math;
  $scope.query = $routeParams.query;
  console.log($scope.query);

  $scope.results = [];
  $scope.currentResults = [];
  $scope.index = 0;
  $scope.numResults = -1;

  $scope.search = (query) => {
    $location.path("/search/" + query);
  };

  $http.get('/findpaper/' + $scope.query).success((res) => {
    $scope.results = res;
    $scope.numResults = $scope.results.length;
    $scope.currentResults = [];
    $scope.index = 0;

    for (var i = 0; i < 10 && i < $scope.numResults; i++) {
      $scope.currentResults.push($scope.results[i]);
    }
  });

  $scope.next = function() {
    $scope.currentResults = [];
    $scope.index += 10;
    for (var i = $scope.index; i < $scope.index + 10 && i < $scope.numResults; i++) {
      $scope.currentResults.push($scope.results[i]);
    }
  };

  $scope.prev = function() {
    $scope.currentResults = [];
    $scope.index -= 10;
    for (var i = $scope.index; i < $scope.index + 10 && i < $scope.numResults; i++) {
      $scope.currentResults.push($scope.results[i]);
    }
  };

}]);

app.controller('GraphController', ['$scope', '$http', '$routeParams', ($scope, $http, $routeParams) => {

  $scope.keywords = {};

  $http.get('/keywords').success((res) => {
    $scope.keywords = res;
  });

  $scope.filters = [];

  $scope.numChecked = 0;

  $scope.getDomain = function(link) {
    return link.replace('http://','').replace('https://','').split(/[/?#]/)[0];
  };

  $scope.updateNodes = function (topic) {

    if (topic.value) $scope.numChecked++;
    else $scope.numChecked--;

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
        if (nodeIDs.indexOf(edge.source._id) != -1 || nodeIDs.indexOf(edge.target._id) != -1)
          edge.data.show = false;
        else edge.data.show = true;
      });

    }
  };

  var query = $routeParams.query;

  $http.get('/paper/' + query).success((res) => {
    $scope.paper = res;

    var backNeighbors = $scope.paper.neighborsB;
    var backSize = backNeighbors.length;
    for (var i = 0; i < backSize; i++) {
      var numTopics = backNeighbors[i].k.length;
      for (var j = 0; j < numTopics; j++) {
        var curTopic = backNeighbors[i].k[j];
        var index = search($scope.filters, curTopic);
        if (index != -1)
          $scope.filters[index].count++;
        else $scope.filters.push(
          { id: curTopic, count: 1, value: false }
        );
      }
    }

    var frontNeighbors = $scope.paper.neighborsF;
    var frontSize = frontNeighbors.length;
    for (var i = 0; i < frontSize; i++) {
      var numTopics = frontNeighbors[i].k.length;
      for (var j = 0; j < numTopics; j++) {
        var curTopic = frontNeighbors[i].k[j];
        var index = search($scope.filters, curTopic);
        if (index != -1)
          $scope.filters[index].count++;
        else $scope.filters.push(
          { id: curTopic, count: 1, value: false }
        );
      }
    }

    // take the top n results
    $scope.filters.sort(function(t1, t2) {
      return t2.count - t1.count;
    });
    $scope.filters.length = Math.min(6, $scope.filters.length);

    for (var i = 0; i < $scope.filters.length; i++) {
      console.log($scope.keywords[$scope.filters[i].id]);
    }
    console.log(JSON.stringify($scope.filters));

    drawGraph($scope);
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

function search(myArray, nameKey){
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].id === nameKey) {
      return i;
    }
  }
  return -1;
}

var updateGraph = (id) => {
  // alert(JSON.stringify(id));

}


var drawGraph = ($scope) => {

    var paper = $scope.paper;
    var curID = paper.id;

    $scope.theUI = {
      nodes: {},
      edges: {}
    };

    $scope.theUI.nodes[curID] = {
      color: "red",
      shape: "dot",
      label: "          ",
      show: true,
      center: true
    };

    $scope.theUI.nodes['dummyNode'] = {
      color: 'white',
      shape: 'dot',
      show: true,
      center: true
    }


    $scope.theUI.edges[curID] = {};
    $scope.theUI.edges[curID]['dummyNode'] = { color: 'white', show: true };

    var index = 1;

    for (var i = 0; i < paper.neighborsF.length; i++) {
      $scope.theUI['nodes'][paper.neighborsF[i]._id] = {
        color: "orange",
        shape: "dot",
        label: "    " + index + "    ",
        keywords: paper.neighborsF[i].k,
        show: true,
        center: false,
        link: "/graph/" + paper.neighborsF[i]._id,
        update: updateGraph
      };
      var backNeighbors = paper.neighborsF[i].b;
      for (var j = 0; j < backNeighbors.length; j++) {
        if (backNeighbors[j] in $scope.theUI.nodes) {

          if (!(paper.neighborsF[i]._id in $scope.theUI.edges))
            $scope.theUI['edges'][paper.neighborsF[i]._id] = {};
          $scope.theUI['edges'][paper.neighborsF[i]._id][backNeighbors[j]] = { show: true };

        }
      }

      var frontNeighbors = paper.neighborsF[i].f;
      for (var j = 0; j < frontNeighbors.length; j++) {
        if (frontNeighbors[j] in $scope.theUI.nodes) {
          // alert(JSON.stringify(frontNeighbors[j]));
          // theUI.edges[paper.neighborsF[i]._id][frontNeighbors[j]] = {};
          if (!(frontNeighbors[j] in $scope.theUI.edges))
            $scope.theUI['edges'][frontNeighbors[j]] = {};
          $scope.theUI['edges'][frontNeighbors[j]][paper.neighborsF[i]._id] = { show: true };
        }
      }
      // theUI.edges[cur][paper.neighborsF[i]._id] = {};
      index++;
    }


    for (var i = 0; i < paper.neighborsB.length; i++) {
      $scope.theUI.nodes[paper.neighborsB[i]._id] = {
        color: "blue",
        shape: "dot",
        label: "    " + index + "    ",
        keywords: paper.neighborsB[i].k,
        show: true,
        center: false,
        link: "/graph/" + paper.neighborsB[i]._id,
        update: updateGraph
      };
      var backNeighbors = paper.neighborsB[i].b;
      for (var j = 0; j < backNeighbors.length; j++) {
        if (backNeighbors[j] in $scope.theUI.nodes) {

          if (!(paper.neighborsB[i]._id in $scope.theUI.edges))
            $scope.theUI['edges'][paper.neighborsB[i]._id] = {};
          $scope.theUI['edges'][paper.neighborsB[i]._id][backNeighbors[j]] = { show: true };
        }
      }

      var frontNeighbors = paper.neighborsB[i].f;
      for (var j = 0; j < frontNeighbors.length; j++) {
        if (frontNeighbors[j] in $scope.theUI.nodes) {

          if (!(frontNeighbors[j] in $scope.theUI.edges))
            $scope.theUI['edges'][frontNeighbors[j]] = {};
          $scope.theUI['edges'][frontNeighbors[j]][paper.neighborsB[i]._id] = { show: true };
        }
      }
      index++;
    }



    $scope.sys = arbor.ParticleSystem(2600, 900, 0.5); // create the system with sensible repulsion/stiffness/friction
    $scope.sys.parameters({gravity:true, dt:0.015}); // use center-gravity to make the graph settle nicely (ymmv)
    $scope.sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...
    $scope.sys.graft($scope.theUI);

};
