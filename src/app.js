var app = angular.module('citegraph', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', ($routeProvider, $locationProvider) => {
  $locationProvider.html5Mode(true);
  $routeProvider
    .when("/search", {
      templateUrl: "partials/search",
      controller: "SearchController" })
    .when("/graph/:query", {
      templateUrl: "partials/graph",
      controller: "GraphController" })
    .otherwise({ redirectTo: "/search" });
}]);

app.controller('SearchController', ['$scope', '$location', ($scope, $location) => {
  $scope.search = (query) => {
    $scope.query = '';
    $location.url('/graph/' + query);
    // $scope.paper = $scope.samplePaper;
    // $scope.showGraph = true;
  };
}]);

app.controller('GraphController', ['$scope', '$http', '$routeParams', ($scope, $http, $routeParams) => {

  $scope.keywords = {};

  $http.get('/keywords').success((res) => {
    $scope.keywords = res;
  });

  $scope.filters = [];

  $scope.getDomain = function(link) {
    return link.replace('http://','').replace('https://','').split(/[/?#]/)[0];
  }

  var query = $routeParams.query;

  $http.get('/paper/' + query).success((res) => {
    $scope.paper = res;

    // add filters
    // for (var i = 0; i < $scope.paper.topics.length; i++) {
    //   $scope.filters[$scope.paper.topics[i]._id] = {
    //     name: $scope.paper.topics[i].n,
    //     value: true
    //   }
    // }

    

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
          { id: curTopic, count: 1, value: true }
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
          { id: curTopic, count: 1, value: true }
        );
      }
    }

    // take the top n results
    $scope.filters.sort(function(t1, t2) {
      return t2.count - t1.count;
    });
    $scope.filters.length = 6;

    drawGraph($scope);
  });

}]);

function search(myArray, nameKey){
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].id === nameKey) {
      return i;
    }
  }
  return -1;
}

var updateGraph = (id) => {
  alert(JSON.stringify(id));

} 


var drawGraph = ($scope) => {
    var CLR = {
      branch:"#b2b19d",
      code:"orange",
      doc:"#922E00",
      demo:"#a7af00"
    };

// add some nodes to the graph and watch it go...
    // sys.addEdge('a','b')
    // sys.addEdge('a','c')
    // sys.addEdge('a','d')
    // sys.addEdge('a','e')
    // sys.addNode('f', {alone:true, mass:.25})

    // or, equivalently:
    // var theUI = {
    //   nodes:{
    //     curPaper:{color:"red", shape:"dot", label:"          " },
    //     b:{color:"orange", shape:"dot", label:"    1    "},
    //     c:{color:"orange", shape:"dot", label:"    2    "},
    //     d:{color:"orange", shape:"dot", label:"    3    "},
    //     e:{color:"orange", shape:"dot", label:"    4    "}
    //   }, 
    //   edges:{
    //     curPaper:{ 
    //         b:{length:.2},
    //         c:{},
    //         d:{},
    //         e:{}
    //     }
    //   }
    // };

    // var theUI = {
    //   nodes:{
    //     curPaper:{color:"red", shape:"dot", label:"          " },
    //     b:{color:"orange", shape:"dot", label:"    1    "},
    //     c:{color:"orange", shape:"dot", label:"    2    "},
    //     d:{color:"orange", shape:"dot", label:"    3    "},
    //     e:{color:"orange", shape:"dot", label:"    4    "}
    //   }, 
    //   edges:{
    //     curPaper:{ 
    //         b:{length:.2},
    //         c:{},
    //         d:{},
    //         e:{}
    //     }
    //   }
    // };

    var paper = $scope.paper;
    var curID = paper.id;
    
    var theUI = {
      nodes: {},
      edges: {}
    };

    theUI.nodes[curID] = {
      color: "red",
      shape:"dot",
      label: "          "
    };

    theUI.edges[curID] = {};

    var index = 1;

    for (var i = 0; i < paper.neighborsF.length; i++) {
      theUI['nodes'][paper.neighborsF[i]._id] = {
        color: "orange",
        shape: "dot",
        label: "    " + index + "    ",
        // link: "/graph/" + paper.neighborsF[i]
        update: updateGraph
      };
      var backNeighbors = paper.neighborsF[i].b;
      for (var j = 0; j < backNeighbors.length; j++) {
        if (backNeighbors[j] in theUI.nodes) {

          if (!(paper.neighborsF[i]._id in theUI.edges))
            theUI['edges'][paper.neighborsF[i]._id] = {};
          theUI['edges'][paper.neighborsF[i]._id][backNeighbors[j]] = {};

        }
      }

      var frontNeighbors = paper.neighborsF[i].f;
      for (var j = 0; j < frontNeighbors.length; j++) {
        if (frontNeighbors[j] in theUI.nodes) {
          // alert(JSON.stringify(frontNeighbors[j]));
          // theUI.edges[paper.neighborsF[i]._id][frontNeighbors[j]] = {};
          if (!(frontNeighbors[j] in theUI.edges))
            theUI['edges'][frontNeighbors[j]] = {};
          theUI['edges'][frontNeighbors[j]][paper.neighborsF[i]._id] = {};
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
        // link: "/graph/" + paper.neighborsB[i]
        update: updateGraph
      };
      var backNeighbors = paper.neighborsB[i].b;
      for (var j = 0; j < backNeighbors.length; j++) {
        if (backNeighbors[j] in theUI.nodes) {

          if (!(paper.neighborsB[i]._id in theUI.edges))
            theUI['edges'][paper.neighborsB[i]._id] = {};
          theUI['edges'][paper.neighborsB[i]._id][backNeighbors[j]] = {};
        }
      }

      var frontNeighbors = paper.neighborsB[i].f;
      for (var j = 0; j < frontNeighbors.length; j++) {
        if (frontNeighbors[j] in theUI.nodes) {

          if (!(frontNeighbors[j] in theUI.edges))
            theUI['edges'][frontNeighbors[j]] = {};
          theUI['edges'][frontNeighbors[j]][paper.neighborsB[i]._id] = {};
        }
      }
      // theUI.edges['curPaper'][paper.neighborsB[i]._id] = {};
      index++;
    }



    var sys = arbor.ParticleSystem(2600, 900, 0.5); // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true, dt:0.015}); // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...
    sys.graft(theUI);

    // var index = 1;

    // for (var i = 0; i < paper.neighborsF.length; i++) {
    //   sys.addNode(paper.neighborsF[i], {
    //     color: "orange",
    //     shape: "dot",
    //     label: "    " + index + "    ",
    //     link: "/graph/" + paper.neighborsF[i]
    //   });
    //   sys.addEdge('curPaper', paper.neighborsF[i]);
    //   index++;
    // }


    // for (var i = 0; i < paper.neighborsB.length; i++) {
    //   sys.addNode(paper.neighborsB[i], {
    //     color: "blue",
    //     shape: "dot",
    //     label: "    " + index + "    ",
    //     link: "/graph/" + paper.neighborsB[i]
    //   });
    //   sys.addEdge('curPaper', paper.neighborsB[i]);
    //   index++;
    // }

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
