/**
 * Created by giant on 2/11/15.
 */
paper.install(window);
(function($) {
    var selectedField = null;
    var selectedFieldText = '';

    $('.field-buttons label').on('click', function() {
        selectedField = $(this).children().eq(0).data('field-id');
        selectedFieldText = $(this).children().eq(0).data('field-value');
    });
    selectedField = $('.field-buttons').find('label').eq(0).children().eq(0).data('field-id');
    selectedFieldText = $('.field-buttons').find('label').eq(0).children().eq(0).data('field-value');

    function loadFieldImages (callback, errorCallback) {
        $.ajax({
            // url: 'v1/images/',
            url: 'v2/images/',
            type: 'get',
            success: function(data) {
                callback(data);
            },
            failure: function(err) {
                errorCallback(err);
            }
        });
    };
    function createFieldImage (data, callback, errorCallback) {
        $.ajax({
            // url: 'v1/images/',
            url: 'v2/images/create/',
            type: 'post',
            data: data,
            success: function(data) {
                if (callback) {
                    callback(data);
                }
            },
            failure: function(error) {
                if (errorCallback) {
                    errorCallback(error);
                }
            }
        });
    };
    function updateFieldImage (data, callback, errorCallback) {
        $.ajax({
            // url: 'v1/images/' + data.id + '/',
            url: 'v2/images/update/' + data.id + '/',
            type: 'post',
            data: $.extend(data, {_method:'PUT'}),
            success: function(data) {
                if (callback) {
                    callback(data);
                }
            },
            failure: function(error) {
                if (errorCallback) {
                    errorCallback(error);
                }
            }
        });
    };
    function deleteFieldImage (id, callback, errorCallback) {
        $.ajax({
            // url: 'v1/images/' + id + '/',
            url: 'v2/images/delete/' + id + '/',
            type: 'post',
            data: {_method: 'DELETE'},
            success: function(data) {
                if (callback) {
                    callback(data);
                }
            },
            failure: function(error) {
                if (errorCallback) {
                    errorCallback(error);
                }
            }
        });
    };

    var canvas = document.getElementById('draw_area');
    // Setup paperscript on canvas
    paper.setup(canvas);
    view.viewSize = new Size(800, 800);
    var startPoint;         // The start point when the mouse was downed or mouse direction was changed.
    var changeSegment, changePath, changeCurve; // The variables to store segment, path, and curve which is modified currently.
    var hitOptions = {          // It is needed when hit test.
        segments: true,
        stroke: true,
        fill: true,
        tolerance: 5
    };

    var DRAGGING_MODES = {
        NONE: 0,
        RESIZING: 1,
        DRAWING: 2,
        MOVING: 3
    };
    var FONT_SIZE = 18;
    var RECT_RADIUS = 6;
    var MIN_RECT_WIDTH = 50;
    var MIN_RECT_HEIGHT = 20;

    var drawingPath, drawingText, lastHitItem;
    var activeItem = null, bDrawing, resizeStatus;
    var draggingMode = DRAGGING_MODES.NONE;

    var tool = new Tool();  //  It is needed for mouse events. It is not needed in paperscript. I had to use javascript for context menu.

    function setCursorType (enable, setting) {
        if (enable) {
            var cursors = {
                'segment': {
                    0: 'nesw-resize',
                    1: 'nesw-resize',
                    2: 'nwse-resize',
                    3: 'nwse-resize',
                    4: 'nesw-resize',
                    5: 'nesw-resize',
                    6: 'nwse-resize',
                    7: 'nwse-resize'
                },
                'stroke': {
                    0: 'nesw-resize',
                    1: 'ew-resize',
                    2: 'nwse-resize',
                    3: 'ns-resize',
                    4: 'nesw-resize',
                    5: 'ew-resize',
                    6: 'nwse-resize',
                    7: 'ns-resize'
                },
                'fill': {
                    0: 'move'
                }
            }
            $("#draw_area").css('cursor', cursors[setting.type][setting.index]);
        } else {
            $("#draw_area").css('cursor', 'default');
        }
    }

    tool.onMouseMove = function (event) {
        var hitResult = paper.project.hitTest(event.point, hitOptions); // Hit Test to recognize which object was selected.
        if (hitResult && (hitResult.item !== activeItem && hitResult.item.outRect !== activeItem)) {
            if (lastHitItem) {
                lastHitItem.selected = false;
                lastHitItem = null;
            }

            if (hitResult.type == 'stroke') {
                hitResult.item.selected = true;
                lastHitItem = hitResult.item;
                setCursorType(true, {
                    type: 'stroke',
                    index: hitResult.location.curve.index
                });
            } else if (hitResult.type == 'segment') {
                hitResult.item.selected = true;
                lastHitItem = hitResult.item;
                setCursorType( true, {
                    type: 'segment',
                    index: hitResult.segment.index
                });
            } else if (hitResult.type == 'fill') {
                setCursorType( true, {
                    type: 'fill',
                    index: 0
                });
                if ( hitResult.item.outRect ) {
                    lastHitItem = hitResult.item.outRect;
                    lastHitItem.selected = true;
                }
            }
        } else if (hitResult && hitResult.item === activeItem) {
            if (hitResult.type == 'stroke') {
                setCursorType(true, {
                    type: 'stroke',
                    index: hitResult.location.curve.index
                });
            } else if (hitResult.type == 'segment') {
                setCursorType( true, {
                    type: 'segment',
                    index: hitResult.segment.index
                });
            }
        } else {
            setCursorType( false );
            if (lastHitItem) {
                lastHitItem.selected = false;
                lastHitItem = null;
            }
        }
    };
    tool.onMouseDown = function (event) {   // Mouse down function on canvas
        changeSegment = changePath = changeCurve = null;
        var hitResult = paper.project.hitTest(event.point, hitOptions); // Hit Test to recognize which object was selected.
        console.log(hitResult);
        if (hitResult) {    // There is any object
            if (lastHitItem) {
                lastHitItem.selected = false;
            }
            if (activeItem) {
                activeItem.selected = false;
            }
            lastHitItem = null;
            activeItem = null;

            if (hitResult.type == 'stroke') {
                activeItem = hitResult.item;
                activeItem.selected = true;
                resizeStatus = {
                    type: 'stroke',
                    index: hitResult.location.curve.index
                };
                draggingMode = DRAGGING_MODES.RESIZING;
                setCursorType(true, resizeStatus);
            } else if (hitResult.type == 'segment') {
                activeItem = hitResult.item;
                activeItem.selected = true;
                resizeStatus = {
                    type: 'segment',
                    index: hitResult.segment.index
                };
                draggingMode = DRAGGING_MODES.RESIZING;
                setCursorType( true, resizeStatus);
            } else if (hitResult.type == 'fill') {
                if ( hitResult.item.outRect ) {
                    activeItem = hitResult.item.outRect;
                    activeItem.selected = true;
                }
                resizeStatus = {
                    type: 'fill',
                    index: 0
                };
                draggingMode = DRAGGING_MODES.MOVING;
                setCursorType( true, resizeStatus);
            }
            if (activeItem) {
                //activeItem.fillColor = '#0ff';
                //activeItem.opacity = 0.5;
                activeItem.textInPath.bringToFront();
                activeItem.backgroundRect.bringToFront();
                activeItem.bringToFront();
            }
        } else {
            if (activeItem) {
                activeItem.selected = false;
                activeItem = null;
            }
            draggingMode = DRAGGING_MODES.DRAWING;
            bDrawing = false;
            startPoint = event.point;
        }
    };

    tool.onMouseDrag = function (event) {    // Mouse Drag function on canvas
        if (draggingMode == DRAGGING_MODES.DRAWING) {
            if (bDrawing == false && (Math.abs(startPoint.x-event.point.x) > 20 || Math.abs(startPoint.y-event.point.y) > 20)) {
                bDrawing = true;
                if (drawingPath && typeof drawingPath.remove === 'function') {
                    drawingPath.remove();
                }
                if (drawingText && typeof drawingText.remove === 'function') {
                    drawingText.remove();
                }
                drawingPath = new Path.Rectangle({
                    from: startPoint,
                    to: event.point,
                    radius: 6,
                    strokeWidth: 2,
                    strokeColor: 'red',
                    dashArray: [10, 4]
                });
                drawingText = new PointText({
                    point: [drawingPath.bounds.left + 5, drawingPath.bounds.top + 15],
                    content: selectedFieldText,
                    fillColor: 'red',
                    fontFamily: 'Arial',
                    fontSize: FONT_SIZE,
                    justification: 'left'
                });

            } else if (bDrawing == true) {
                if (drawingPath && typeof drawingPath.remove === 'function') {
                    drawingPath.remove();
                }
                drawingPath = new Path.Rectangle({
                    from: startPoint,
                    to: event.point,
                    radius: RECT_RADIUS,
                    strokeWidth: 2,
                    strokeColor: 'red',
                    dashArray: [10, 4]
                });
                drawingText.point.x = drawingPath.bounds.left + 5;
                drawingText.point.y = drawingPath.bounds.top + 15;
            }
        } else if (draggingMode == DRAGGING_MODES.RESIZING) {
            if (activeItem) {
                calculateRectSegments(activeItem, event.point, event.delta , resizeStatus);
            }
        } else if (draggingMode == DRAGGING_MODES.MOVING) {
            if (activeItem) {
                moveRect(activeItem, event.delta);
            }
        }
    };
    tool.onMouseUp = function (event) {
        if (draggingMode === DRAGGING_MODES.DRAWING && bDrawing) {
            bDrawing = false;
            if (drawingPath && typeof drawingPath.remove === 'function') {
                drawingPath.remove();
            }
            if (drawingText && typeof drawingText.remove === 'function') {
                drawingText.remove();
            }
            var endPoint = new Point(0, 0);
            if (event.point.x >= startPoint.x) {
                endPoint.x = startPoint.x + Math.max(event.point.x - startPoint.x, MIN_RECT_WIDTH);
            } else {
                endPoint.x = startPoint.x - Math.max(startPoint.x - event.point.x, MIN_RECT_WIDTH);
            }
            if (event.point.y >= startPoint.y) {
                endPoint.y = startPoint.y + Math.max(event.point.y - startPoint.y, MIN_RECT_HEIGHT);
            } else {
                endPoint.y = startPoint.y - Math.max(startPoint.y - event.point.y, MIN_RECT_HEIGHT);
            }
            var newBackground = new Path.Rectangle({
                from: startPoint,
                to: endPoint,
                radius: RECT_RADIUS,
                fillColor: 'red',
                opacity: 0.1
            });
            var newPath = new Path.Rectangle({
                from: startPoint,
                to: endPoint,
                radius: RECT_RADIUS,
                strokeWidth: 2,
                strokeColor: 'red'
                //dashArray: [10, 4]
            });
            var newText = new PointText({
                point: [newPath.bounds.left + 5, newPath.bounds.top + 15],
                content: selectedFieldText,
                fillColor: 'red',
                fontFamily: 'Arial',
                fontSize: FONT_SIZE,
                justification: 'left'
            });
            newPath.textInPath = newText;
            newPath.backgroundRect = newBackground;
            newText.outRect = newPath;
            newBackground.outRect = newPath;
            //activeLabels.push({
            //    path: newPath,
            //    text: newText,
            //    pk: selectedField,
            //    text: selectedFieldText
            //});
            createFieldImage({
                profile: selectedField,
                left: Math.round(newPath.bounds.left),
                top: Math.round(newPath.bounds.top),
                width: Math.round(newPath.bounds.width),
                height:Math.round( newPath.bounds.height)
            },function(data) {
                console.log('-- create success --', data);
                newPath.djangoData = data;
            }, function(err){
                console.log('-- create failure --', err);
            });
        } else if (draggingMode === DRAGGING_MODES.RESIZING || draggingMode === DRAGGING_MODES.MOVING) {
            updateFieldImage({
                id: activeItem.djangoData.id,
                profile: activeItem.djangoData.profile,
                left: Math.round(activeItem.bounds.left),
                top: Math.round(activeItem.bounds.top),
                width: Math.round(activeItem.bounds.width),
                height: Math.round(activeItem.bounds.height)
            }, function(data) {
                console.log('--update success--', data);
            }, function(err) {
                console.log('--update failure--', err);
            });
        }
        draggingMode = DRAGGING_MODES.NONE;
    };

    function calculateRectSegments (item, point, delta, setting) {
        var xMoveSize = delta.x;
        var yMoveSize = delta.y;
        if (setting.index <= 3) {
            xMoveSize = (item.bounds.right - MIN_RECT_WIDTH) > point.x ? point.x : (item.bounds.right - MIN_RECT_WIDTH);
        } else {
            xMoveSize = (item.bounds.left + MIN_RECT_WIDTH) < point.x ? point.x : (item.bounds.left + MIN_RECT_WIDTH);
        }
        if (setting.index > 1 && setting.index < 6) {
            yMoveSize = (item.bounds.bottom - MIN_RECT_HEIGHT) > point.y ? point.y : (item.bounds.bottom - MIN_RECT_HEIGHT);
        } else {
            yMoveSize = (item.bounds.top + MIN_RECT_HEIGHT) < point.y ? point.y : (item.bounds.top + MIN_RECT_HEIGHT);
        }
        function setTop(value) {
            item.segments[2].point.y = value + RECT_RADIUS;
            item.segments[3].point.y = value;
            item.segments[4].point.y = value;
            item.segments[5].point.y = value + RECT_RADIUS;
        }
        function setLeft(value) {
            item.segments[0].point.x = value + RECT_RADIUS;
            item.segments[1].point.x = value;
            item.segments[2].point.x = value;
            item.segments[3].point.x = value + RECT_RADIUS;
        }
        function setBottom(value) {
            item.segments[6].point.y = value - RECT_RADIUS;
            item.segments[7].point.y = value;
            item.segments[0].point.y = value;
            item.segments[1].point.y = value - RECT_RADIUS;
        }
        function setRight(value) {
            item.segments[4].point.x = value - RECT_RADIUS;
            item.segments[5].point.x = value;
            item.segments[6].point.x = value;
            item.segments[7].point.x = value - RECT_RADIUS;
        }
        if (setting.type === 'stroke') {
            if (setting.index === 3 ) {
                setTop(yMoveSize);
            } else if ( setting.index === 7) {
                setBottom(yMoveSize);
            } else if (setting.index === 1 ) {
                setLeft(xMoveSize);
            } else if(setting.index === 5) {
                setRight(xMoveSize);
            } else if ( setting.index === 0 ) {
                setBottom(yMoveSize);
                setLeft(xMoveSize);
            } else if ( setting.index === 2 ) {
                setTop(yMoveSize);
                setLeft(xMoveSize);
            } else if ( setting.index === 4 ) {
                setTop(yMoveSize);
                setRight(xMoveSize);
            } else if( setting.index === 6 ) {
                setBottom(yMoveSize);
                setRight(xMoveSize);
            }
        } else if (setting.type === 'segment') {
            if ( setting.index === 0 || setting.index === 1 ) {
                setBottom(yMoveSize);
                setLeft(xMoveSize);
            } else if ( setting.index === 2 || setting.index === 3 ) {
                setTop(yMoveSize);
                setLeft(xMoveSize);
            } else if ( setting.index === 4 || setting.index === 5 ) {
                setTop(yMoveSize);
                setRight(xMoveSize);
            } else if( setting.index === 6 || setting.index === 7 ) {
                setBottom(yMoveSize);
                setRight(xMoveSize);
            }
        }
        if (item.textInPath) {
            item.textInPath.point.x = item.bounds.left + 5;
            item.textInPath.point.y = item.bounds.top + 15;
        }
        if (item.backgroundRect) {
            item.backgroundRect.segments = item.segments;
        }
    }
    function moveRect (item, delta) {
        for ( var i = 0; i < item.segments.length; i++) {
            item.segments[i].point.x += delta.x;
            item.segments[i].point.y += delta.y;
        }
        if (item.textInPath) {
            item.textInPath.point.x = item.bounds.left + 5;
            item.textInPath.point.y = item.bounds.top + 15;
        }
        if (item.backgroundRect) {
            item.backgroundRect.segments = item.segments;
        }
    }
    tool.onKeyUp = function (event) {
        console.log(event);
        if (event.key === 'delete') {
            if (confirm("Are you sure you want to remove this widget?")) {
                deleteFieldImage(activeItem.djangoData.id, function(data) {
                    console.log(' -- delete success --', data);
                    activeItem.remove();
                    activeItem.textInPath.remove();
                    activeItem.backgroundRect.remove();
                    activeItem = null;
                }, function(err) {
                    console.log(' -- delete failure --', err);
                });
            }
        }
    };
    loadFieldImages(function(data) {
        console.log('--load images--', data);
        for (var i = 0; i < data.length; i++ ) {
            var newBackground = new Path.Rectangle({
                from: [data[i].left, data[i].top],
                to: [data[i].left + data[i].width, data[i].top + data[i].height],
                radius: RECT_RADIUS,
                fillColor: 'red',
                opacity: 0.1
            });
            var newPath = new Path.Rectangle({
                from: [data[i].left, data[i].top],
                to: [data[i].left + data[i].width, data[i].top + data[i].height],
                radius: RECT_RADIUS,
                strokeWidth: 2,
                strokeColor: 'red'
                //dashArray: [10, 4]
            });
            //newBackground.segments = newPath.segments;
            var newText = new PointText({
                point: [data[i].left + 5, data[i].top + 15],
                content: $('#field_' + data[i].profile).data('field-value'),
                fillColor: 'red',
                fontFamily: 'Arial',
                fontSize: FONT_SIZE,
                justification: 'left'
            });
            newPath.textInPath = newText;
            newText.outRect = newPath;
            newBackground.outRect = newPath;
            newPath.backgroundRect = newBackground;
            newPath.djangoData = data[i];
        }
        paper.view.draw();
    });

})(jQuery);