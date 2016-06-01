$(canvas).mousedown(function(e){
    var pos = $(this).offset();
    var p = {x:e.pageX-pos.left, y:e.pageY-pos.top}
    selected = nearest = dragged = particleSystem.nearest(p);
    alert("mousedown")

    if (selected.node !== null){
    // dragged.node.tempMass = 10000
    	alert("hi!");
        // $(that).trigger({type:"navigate", path:selected.node.data.link});
    }
    return false;
});