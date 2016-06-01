var app = angular.module('citegraph', ['ngRoute']);
var currentPaper;

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
  $scope.filters = [ 'Topic', 'Size' ];

  // $scope.paper = {
  //   title: 'Sample Paper',
  //   authors: ['Xue, Alfred', 'Man, Colin', 'Yee, Spencer'],
  //   topics: ['Computer Vision', 'Natural Language Processing', 'Machine Learning'],
  //   conference: ['CS 194 Spring Fair'],
  //   link: 'http://www.google.com/pdf'
  // };
  var query = $routeParams.query;

  // $http({
  //   method: 'GET',
  //   url: '/paper',
  //   params: { title: query }
  // }).then ((res) => {
  //   console.log(JSON.stringify(res));
  //   currentPaper = res;
  // }, (res) => {
  //   //some error
  //   alert('error');
  // });

  $http.get('/paper/' + query).success((res) => {
    $scope.paper = res;
    drawGraph($scope.paper);
  });

  // $scope.paper = {
  //   title: 'Multipath Rejection Through Spatial Processing',
  //   authors: ['Allison Brown'],
  //   topics: ['Digital Signal Processing'],
  //   conference: '',
  //   links: ["http://www.navsys.com/Papers/0009003.pdf"],
  //   neighborsF: [
  //     { title: 'Neural Networks Based Approach for Data Fusion in Multi-frequency Navigation Receivers', author: 'Alison Brown' },
  //     { title: 'Paper Two', author: 'Author Two' },
  //     { title: 'Paper Three', author: 'Author Three' },
  //     { title: 'Paper Four', author: 'Author Four' }

  //   ],
  //   neighborsB: []
  // }

}]);


var drawGraph = (paper) => {
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
        update: function() {

          alert(JSON.stringify(theUI));



        }
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
        update: function() {


          alert(JSON.stringify(theUI));



        }
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
