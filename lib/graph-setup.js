// initMouseHandling:function(){
// // no-nonsense drag and drop (thanks springy.js)
// selected = null;
// nearest = null;
// var dragged = null;
// var move = false;

// // set up a handler object that will initially listen for mousedowns then
// // for moves and mouseups while dragging
// var handler = {
//   moved:function(e){
//     var pos = $(canvas).offset();
//     _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
//     nearest = particleSystem.nearest(_mouseP);

//     if(!nearest.node){
//         return false;
//     }

//     selected = (nearest.distance < nearest.node.data.radius) ? nearest : null

//     // code for node that mouse is hovered on ('selected')
//     alert("hover");

//   },
//   down:function(e){
//     var pos = $(canvas).offset();
//     _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
//     nearest = dragged = particleSystem.nearest(_mouseP);
//     move = false;

//     if (dragged && dragged.node !== null){
//         dragged.node.fixed = true
//     }

//     $(canvas).bind('mousemove', handler.dragged)
//     $(window).bind('mouseup', handler.dropped)

//     return false
//   },
//   dragged:function(e){
//     var old_nearest = nearest && nearest.node._id
//     var pos = $(canvas).offset();
//     var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
//     move = true;

//     if (!nearest) return
//     if (dragged !== null && dragged.node !== null){
//       var p = particleSystem.fromScreen(s)
//       dragged.node.p = p
//     }

//     return false
//   },

//   dropped:function(e){
//     var edit = $("#edit").prop('checked')
//     if (dragged===null || dragged.node===undefined) return
//     if (dragged.node !== null) {
//         if(move===false) {

//             // code for clicked node (dragged.node)
//             alert("clicked");

//         }
//         dragged.node.fixed = false
//     }
//     dragged.node.tempMass = 1000
//     dragged = null
//     selected = null
//     $(canvas).unbind('mousemove', handler.dragged)
//     $(window).unbind('mouseup', handler.dropped)
//     _mouseP = null
//     return false
//   }
// }

// $(canvas).mousedown(handler.down);
// $(canvas).mousemove(handler.moved);
// }
"use strict";