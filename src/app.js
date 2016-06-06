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

app.directive('onFinishRender',['$timeout', '$parse', function ($timeout, $parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                    if(!!attr.onFinishRender){
                      $parse(attr.onFinishRender)(scope);
                    }
                });
            }
        }
    };
}]);
  
app.controller('SearchController', ['$scope', '$http', '$location', ($scope, $http, $location) => {
  $scope.search = (query) => {
    $location.path("/search/" + query);
  };
}]);

app.controller('ResultsController', ['$scope', '$http', '$location', '$routeParams', ($scope, $http, $location, $routeParams) => {
  $scope.Math = window.Math;
  $scope.query = $routeParams.query;
  // console.log($scope.query);

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
  $scope.hoverNode = -1;
  $scope.hover = id => {
    $scope.hoverNode = id;
  };

  $scope.loading = true;

  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
    componentHandler.upgradeAllRegistered();
  });

  $scope.keywords = {};

  $http.get('/keywords').success((res) => {
    $scope.keywords = res;
  });

  $scope.filters = [];

  $scope.numChecked = 0;

  $scope.truncateLink = function(link) {
    link = link.replace('http://','').replace('https://','');
    var domain = link.split(/[/?#]/)[0];
    var domain_length = domain.length;
    var path = link.substr(domain_length);
    return domain.concat(path.substr(0, 6)).concat("...").concat(path.substr(-5));
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
    $scope.paper = res.paper;
    console.log(res.paper.date);

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

    // if we want to grab top keywords from current paper
    // var sketch = $scope.paper.sketch;

    // for (var key in sketch) {
    //   if (!sketch.hasOwnProperty(key)) continue;
    //   $scope.filters.push({ id: key, weight: sketch[key], value: false });
    // }

    // take the top n results
    $scope.filters.sort(function(t1, t2) {
      return t2.count - t1.count;
    });

    $scope.filters.length = Math.min(8, $scope.filters.length);
  
    $scope.getNodeName = id => {
      if (id < 0) return "";
      else if (id == res.paper.id) return res.paper.title;
      else if (!(id in res.neighbors)) return "";
      return res.neighbors[id].t;
    };

    $scope.getYear = id => {
      if (id < 0) return "";

      var date = '';
      if (id == res.paper.id) date = res.paper.date;
      else if (id in res.neighbors) date = res.neighbors[id].d;
      else return "";

      if (!date) return '';

      return " (" + date.substr(0, 4) + ")";
    };

    // for (var i = 0; i < $scope.filters.length; i++) {
    //   console.log($scope.keywords[$scope.filters[i].id]);
    // }
    // console.log(JSON.stringify($scope.filters));

    drawGraph($scope, $scope.paper, res.neighbors);
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

var getScore = (s1, s2) => {

  var score = 0;
  var keys = [];
  for (var key in s1) {
    if (s1.hasOwnProperty(key)) keys.push(key);
  }

  for (var key in s2) {
    if (s2.hasOwnProperty(key) && keys.indexOf(key) == -1)
      keys.push(key);
  }

  var numKeys = keys.length;
  for (var i = 0; i < numKeys; i++) {
    var key = keys[i];
    if (key in s1 && key in s2)
      score += s1[key] * s2[key];  
  }  

  return score;

}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function componentToHex(c) {
  c = Math.round(c);
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function dilute(color1, min, max, val, closeness) {
  if (min == max) return color1;
  max *= closeness;                   // so it doesn't dilute all the way to white
  var c1 = hexToRgb(color1);
  var percentage = (val - min) / (max-min);
  c1.r += (255 - c1.r) * percentage;
  c1.g += (255 - c1.g) * percentage;
  c1.b += (255 - c1.b) * percentage;
  // console.log(rgbToHex(c1.r, c1.g, c1.b));
  return rgbToHex(c1.r, c1.g, c1.b);
}

var drawGraph = ($scope, paper, neighbors) => {

  var curID = paper.id;
  var first_total = 40;

  var nodeColor = "#BF1D81";
  var fBaseColor = "#E53822";
  var bBaseColor = "#09A8B2";
  var secondaryBaseColor = dilute("#22344C", 0, 100, 50, 1);

  var theUI = {
    nodes: {},
    edges: {}
  };

  theUI.nodes[curID] = {
    _id: curID,
    color: nodeColor,
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

    theUI.edges[curID]['dummyNode'] = { color: 'white', show: true, length: 0.1 };

  }

  var index = 1;
  var curSketch = paper.sketch;

  var maxFScore = -1, minFScore = Number.MAX_SAFE_INTEGER;
  paper.neighborsF.forEach(n => {
    var score = getScore(curSketch, n.s);
    if (score > maxFScore) maxFScore = score;
    if (score < minFScore) minFScore = score;
  });

  var maxBScore = -1, minBScore = Number.MAX_SAFE_INTEGER;
  paper.neighborsB.forEach(n => {
    var score = getScore(curSketch, n.s);
    if (score > maxBScore) maxBScore = score;
    if (score < minBScore) minBScore = score;
  });

  var maxNScore = -1, minNScore = Number.MAX_SAFE_INTEGER;
  for (var key in neighbors) {
    var neighbor = neighbors[key];
    var score = getScore(curSketch, neighbor.s);
    if (score > maxNScore) maxNScore = score;
    if (score < minNScore) minNScore = score;
  }

  $scope.allNeighbors = [];

  for (var i = 0; i < paper.neighborsF.length; i++) {
    if (first_total <= 0)
      continue;

    first_total--;

    var b_count = 0;
    var f_count = 0;

    var curr_index = index;
    var score = getScore(curSketch, paper.neighborsF[i].s);
    theUI['nodes'][paper.neighborsF[i]._id] = {
      _id:paper.neighborsF[i]._id,
      color: dilute(fBaseColor, 0, maxFScore - minFScore, maxFScore - score, 1.3),
      shape: "dot",
      label: "    " + curr_index + "    ",
      keywords: paper.neighborsF[i].k,
      show: true,
      center: false,
      link: "/graph/" + paper.neighborsF[i]._id,
      update: updateGraph,
      score: score
    };
    $scope.allNeighbors.push({ _id: paper.neighborsF[i]._id, t: paper.neighborsF[i].t });
    index++;

    var backNeighbors = paper.neighborsF[i].b;
    if (backNeighbors) {
      var size = backNeighbors.length;
      for (var j = 0; j < size; j++) {
        if (backNeighbors[j] in theUI.nodes) {
          if (!(backNeighbors[j] in theUI.edges))
            theUI['edges'][backNeighbors[j]] = {};
          theUI['edges'][backNeighbors[j]][paper.neighborsF[i]._id] = { show: true };
        } else if (b_count < 1) {
          var neighbor = neighbors[backNeighbors[j]];
          curr_index = index;
          if (neighbor) {
            theUI['nodes'][neighbor._id] = {
              _id:neighbor._id,
              color: dilute(secondaryBaseColor, 0, maxNScore - minNScore, maxNScore - score, 1.3),
              shape: "dot",
              label: "    " + curr_index + "    ",
              keywords: neighbor.k,
              show: true,
              center: false,
              link: "/graph/" + neighbor._id,
              update: updateGraph,
              score: getScore(curSketch, neighbor.s)
            };
            $scope.allNeighbors.push({ _id: neighbor._id, t: neighbor.t });
            index++;
            b_count++;

            if (!(backNeighbors[j] in theUI.edges))
              theUI['edges'][backNeighbors[j]] = {};
            theUI['edges'][backNeighbors[j]][paper.neighborsF[i]._id] = { show: true };
          }
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


          if (!(paper.neighborsF[i]._id in theUI.edges))
            theUI['edges'][paper.neighborsF[i]._id] = {};
          theUI['edges'][paper.neighborsF[i]._id][frontNeighbors[j]] = { show: true };

        } else if (f_count < 1) {
          var neighbor = neighbors[frontNeighbors[j]];
          curr_index = index;
          if (neighbor) {
            theUI['nodes'][neighbor._id] = {
              _id: neighbor._id,
              color: dilute(secondaryBaseColor, 0, maxNScore - minNScore, maxNScore - score, 1.3),
              shape: "dot",
              label: "    " + curr_index + "    ",
              keywords: neighbor.k,
              show: true,
              center: false,
              link: "/graph/" + neighbor._id,
              update: updateGraph,
              score: getScore(curSketch, neighbor.s)
            };
            $scope.allNeighbors.push({ _id: neighbor._id, t: neighbor.t });
            index++;
            f_count++;

            if (!(paper.neighborsF[i]._id in theUI.edges))
              theUI['edges'][paper.neighborsF[i]._id] = {};
            theUI['edges'][paper.neighborsF[i]._id][frontNeighbors[j]] = { show: true };

          }
        }
      }
    }
  }


  for (var i = 0; i < paper.neighborsB.length; i++) {
    if (first_total <= 0)
      continue;

    first_total--;

    var b_count = 0;
    var f_count = 0;

    var curr_index = index;
    var score = getScore(curSketch, paper.neighborsB[i].s);
    theUI.nodes[paper.neighborsB[i]._id] = {
      _id: paper.neighborsB[i]._id,
      color: dilute(bBaseColor, 0, maxBScore - minBScore, maxBScore - score, 1.3),
      shape: "dot",
      label: "    " + curr_index + "    ",
      keywords: paper.neighborsB[i].k,
      show: true,
      center: false,
      link: "/graph/" + paper.neighborsB[i]._id,
      update: updateGraph,
      score: score
    };
    $scope.allNeighbors.push({ _id: paper.neighborsB[i]._id, t: paper.neighborsB[i].t });
    index++;

    var backNeighbors = paper.neighborsB[i].b;
    if (backNeighbors) {
      var size = backNeighbors.length;
      for (var j = 0; j < size; j++) {
        if (backNeighbors[j] in theUI.nodes) {

          if (!(backNeighbors[j] in theUI.edges))
            theUI['edges'][backNeighbors[j]] = {};
          theUI['edges'][backNeighbors[j]][paper.neighborsB[i]._id] = { show: true };

        } else if (b_count < 1) {
          var neighbor = neighbors[backNeighbors[j]];
          curr_index = index;
          if (neighbor) {
            theUI['nodes'][neighbor._id] = {
              _id: neighbor._id,
              color: dilute(secondaryBaseColor, 0, maxNScore - minNScore, maxNScore - score, 1.3),
              shape: "dot",
              label: "    " + curr_index + "    ",
              keywords: neighbor.k,
              show: true,
              center: false,
              link: "/graph/" + neighbor._id,
              update: updateGraph,
              score: getScore(curSketch, neighbor.s)
            };
            $scope.allNeighbors.push({ _id: neighbor._id, t: neighbor.t });
            index++;
            b_count++;

            if (!(backNeighbors[j] in theUI.edges))
              theUI['edges'][backNeighbors[j]] = {};
            theUI['edges'][backNeighbors[j]][paper.neighborsB[i]._id] = { show: true };
          }
        }
      }
    }

    var frontNeighbors = paper.neighborsB[i].f;
    if (frontNeighbors) {
      var size = frontNeighbors.length;
      for (var j = 0; j < size; j++) {
        if (frontNeighbors[j] in theUI.nodes) {

          if (!(paper.neighborsB[i]._id in theUI.edges))
            theUI['edges'][paper.neighborsB[i]._id] = {};
          theUI['edges'][paper.neighborsB[i]._id][frontNeighbors[j]] = { show: true };

          // if (!(frontNeighbors[j] in theUI.edges))
          //   theUI['edges'][frontNeighbors[j]] = {};
          // theUI['edges'][frontNeighbors[j]][paper.neighborsB[i]._id] = { show: true };
        } else if (f_count < 1) {
          var neighbor = neighbors[frontNeighbors[j]];
          curr_index = index;
          if (neighbor) {
            theUI['nodes'][neighbor._id] = {
              _id: neighbor._id,
              color: dilute(secondaryBaseColor, 0, maxNScore - minNScore, maxNScore - score, 1.3),
              shape: "dot",
              label: "    " + curr_index + "    ",
              keywords: neighbor.k,
              show: true,
              center: false,
              link: "/graph/" + neighbor._id,
              update: updateGraph,
              score: getScore(curSketch, neighbor.s)
            };
            $scope.allNeighbors.push({ _id: neighbor._id, t: neighbor.t });
            index++;
            f_count++;

            if (!(paper.neighborsB[i]._id in theUI.edges))
              theUI['edges'][paper.neighborsB[i]._id] = {};
            theUI['edges'][paper.neighborsB[i]._id][frontNeighbors[j]] = { show: true };

            // if (!(frontNeighbors[j] in theUI.edges))
            //   theUI['edges'][frontNeighbors[j]] = {};
            // theUI['edges'][frontNeighbors[j]][paper.neighborsB[i]._id] = { show: true };
          }
        }
      }
    }
  }

  $scope.sys = arbor.ParticleSystem(500, 900, 1); // create the system with sensible repulsion/stiffness/friction
  $scope.sys.parameters({gravity:true, dt:0.015}); // use center-gravity to make the graph settle nicely (ymmv)
  $scope.sys.fps(20);
  $scope.sys.renderer = Renderer("#viewport", "#graph", $scope); // our newly created renderer will have its .init() method called shortly by sys...
  $scope.sys.graft(theUI);

    // Iterate through all neighbors, store a mapping from their node ids to their scores

};
