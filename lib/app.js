'use strict';

var app = angular.module('citegraph', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider.when("/search", {
    templateUrl: "partials/search",
    controller: "SearchController" }).when("/graph", {
    templateUrl: "partials/graph",
    controller: "GraphController" }).otherwise({ redirectTo: "/search" });
}]);

app.controller('SearchController', ['$scope', '$location', function ($scope, $location) {
  $scope.search = function (query) {
    $scope.query = '';
    $location.path("/graph");
    // $scope.paper = $scope.samplePaper;
    // $scope.showGraph = true;
  };
}]);

app.controller('GraphController', ['$scope', function ($scope) {
  $scope.filters = ['Topic', 'Size'];

  $scope.paper = {
    title: 'Sample Paper',
    authors: ['Xue, Alfred', 'Man, Colin', 'Yee, Spencer'],
    topics: ['Computer Vision', 'Natural Language Processing', 'Machine Learning'],
    conferences: ['CS 194 Spring Fair'],
    link: 'http://www.google.com/pdf'
  };

  drawGraph();
}]);

var drawGraph = function drawGraph() {
  var CLR = {
    branch: "#b2b19d",
    code: "orange",
    doc: "#922E00",
    demo: "#a7af00"
  };

  // add some nodes to the graph and watch it go...
  // sys.addEdge('a','b')
  // sys.addEdge('a','c')
  // sys.addEdge('a','d')
  // sys.addEdge('a','e')
  // sys.addNode('f', {alone:true, mass:.25})

  // or, equivalently:
  var theUI = {
    nodes: {
      curPaper: { color: "red", shape: "dot", label: "Sample Paper" },
      b: { color: "orange", shape: "dot", label: "Neighbor 1" },
      c: { color: "orange", shape: "dot", label: "Neighbor 2" },
      d: { color: "orange", shape: "dot", label: "Neighbor 3" },
      e: { color: "orange", shape: "dot", label: "Neighbor 4" }
    },
    edges: {
      curPaper: {
        b: { length: .2 },
        c: {},
        d: {},
        e: {}
      },
      b: {
        c: {}
      }
    }
  };

  var sys = arbor.ParticleSystem(1000, 400, 1); // create the system with sensible repulsion/stiffness/friction
  sys.parameters({ gravity: true }); // use center-gravity to make the graph settle nicely (ymmv)
  sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...
  sys.graft(theUI);
};

// myApp.controller('MainController', function($scope) {

//   // var myRenderer = {
//   //   init: function(system) { console.log("starting", system) },
//   //   redraw: function() { console.log("redraw") }
//   // };

//   // $scope.sys = arbor.ParticleSystem();
//   // $scope.sys.renderer = myRenderer;

// });

// myApp.directive('ngEnter', function () {
// 	return function (scope, element, attrs) {
// 		element.bind("keydown keypress", function (event) {
// 			if(event.which === 13) {
// 				scope.$apply(function () {
// 					scope.$eval(attrs.ngEnter);
// 				});
// 				event.preventDefault();
// 			}
// 		});
// 	};
// });