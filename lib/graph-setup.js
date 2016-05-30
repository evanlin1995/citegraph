"use strict";

$(canvas).mousedown(function (e) {
    var pos = $(this).offset();
    var p = { x: e.pageX - pos.left, y: e.pageY - pos.top };
    selected = nearest = dragged = particleSystem.nearest(p);

    if (selected.node !== null) {
        // dragged.node.tempMass = 10000
        $(that).trigger({ type: "navigate", path: selected.node.data.link });
    }
    return false;
});