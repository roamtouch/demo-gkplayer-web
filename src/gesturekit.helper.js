/*!
 * GestureKit Helper v2.1.1
 * http://gesturekit.com/
 *
 * Copyright (c) 2014, RoamTouch
 * Released under the Apache v2 License.
 * http://gesturekit.com/
 */
(function (window, gesturekit) {
    'use strict';

    var doc = window.document,

        docEl = doc.documentElement,

        msPointerSupported = window.navigator.msPointerEnabled,

        touchEvents = {
            'start': msPointerSupported ? 'MSPointerDown' : 'touchstart',
            'move': msPointerSupported ? 'MSPointerMove' : 'touchmove',
            'end': msPointerSupported ? 'MSPointerUp' : 'touchend'
        },

        helperImage = 'https://i.cloudup.com/jAmu8s95gF-3000x3000.png',

        url = 'http://api.gesturekit.com/v1.1/index.php/sdk/getgestures_help/',

        viewport = doc.documentElement,

        defaults = {
            'size': 60,
            'container': doc.body,
            'drag': true,
            'snap': true,
            'title': 'Gestures'
        },

        prefix = (function prefix() {
            var regex = /^(Webkit|Khtml|Moz|ms|O)(?=[A-Z])/,
                styleDeclaration = doc.getElementsByTagName('script')[0].style,
                prop;

            for (prop in styleDeclaration) {
                if (regex.test(prop)) {
                    return '-' + prop.match(regex)[0].toLowerCase() + '-';
                }
            }

            // Nothing found so far? Webkit does not enumerate over the CSS properties of the style object.
            // However (prop in style) returns the correct value, so we'll have to test for
            // the precence of a specific property
            if ('WebkitOpacity' in styleDeclaration) { return '-webkit-'; }
            if ('KhtmlOpacity' in styleDeclaration) { return '-khtml-'; }

            return '';
        }());

    function render(gesture) {
        // console.log(gesture);
        return [
            '<div class="gk-helper-gesture-container">',
                '<div class="gk-helper-gesture">',
                    '<img src="data:image/png;base64,' + gesture.img + '" height="60" width="60">',
                    '<p class="gk-helper-gestureDescription">' + gesture.img_description + '</p>',
                '</div>',
            '</div>'
        ].join('');
    }

    function createNode(tag, classes, parent) {
        parent = parent || doc.body;

        var node = document.createElement(tag);
        node.className = classes;

        parent.appendChild(node);

        return node;
    }

    function customizeOptions(options) {
        var prop;
        for (prop in defaults) {
            if (!options.hasOwnProperty(prop)) {
                options[prop] = defaults[prop];
            }
        }
        return options;
    }

    /**
     * Creates a new instance of Helper.
     * @constructor
     * @returns {helper}
     */
    function Helper(options) {
        this._init(options);

        return this;
    }

    /**
     * Initializes a new instance of Helper.
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._init = function (options) {
        var that = this;

        this._options = customizeOptions(options || {});

        this.container = this._options.container;

        this.lastPoint = {};

        this._motion = false;

        this._move = false;

        this.currentOffset = {
            'x': 2,
            'y': 60
        };

        this._createDisplay();

        this._defineEvents();

        if (this._options.drag) {
            this.drag();
        }

        this._createShowroom();

        gesturekit.on('HELP', function (eve) {
            that.showGestures();
        });

        return this;
    };

    /**
     * Creates a display to draw gestures.
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._createDisplay = function () {
        var styles = [
            'background-color: #999999;',
            'background-image: url("' + helperImage + '");',
            'background-size: cover;',
            'border-radius: 10px;',
            'position: fixed;',
            'top: 0;',
            'left: 0;',
            'z-index: 999;'
        ];

        this.display = doc.createElement('canvas');
        this.display.width = this.display.height = this._options.size;
        this.display.style.cssText = styles.join('');

        this.display.className = 'gk-helper-display';

        this.display.style[prefix + 'transform'] = 'translate(' + this.currentOffset.x + 'px,' + this.currentOffset.y + 'px)';

        this._ctx = this.display.getContext('2d');

        this.container.appendChild(this.display);

        return this;
    };

    /**
     *
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._defineEvents = function () {
        var that = this;

        gesturekit.on('gesturestart', function (eve) {
            that._draw(eve.touches);
        });

        gesturekit.on('gesturemotion', function (eve) {
            that._draw(eve.touches);
        });

        gesturekit.on('gestureend', function () {
            setTimeout(function () {
                that._finishDrawing();
            }, 10);
        });

        return this;
    };

    /**
     *
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype.drag = function () {
        var that = this,
            startOffset = {
                'x': 0,
                'y': 0
            };

        docEl.addEventListener(touchEvents.start, function (eve) {
            if (eve.target === that.display) {
                gesturekit.disable();

                startOffset.x = eve.touches[0].pageX - that.currentOffset.x;
                startOffset.y = eve.touches[0].pageY - that.currentOffset.y;

                that.hideGestures();
            }
        });

        docEl.addEventListener(touchEvents.move, function(eve) {
            if (eve.target === that.display) {
                eve.preventDefault();

                var x = eve.touches[0].pageX - startOffset.x,
                    y = eve.touches[0].pageY - startOffset.y;

                that.display.style[prefix + 'transform'] = 'translate(' + x + 'px,' + y + 'px)';

                that.currentOffset.x = x;
                that.currentOffset.y = y;

                that._move = true;

                return;
            }
        });

        docEl.addEventListener(touchEvents.end, function (eve) {
            if (eve.target === that.display) {

                if (that._options.snap) {
                    that._snap();
                }

                gesturekit.enable();

                if (!that._move) {
                    that.showGestures();
                }

                that._move = false;
            }
        });

        return this;
    };

    /**
     *
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._scalePoints = function (x, y) {
        var offset = {},
            point = {},
            ratio = {},
            display = this.display,
            viewportWidth = viewport.clientWidth,
            viewportHeight = viewport.clientHeight,
            localWidth = this.display.width,
            localHeight = this.display.height;

        if (viewportWidth > viewportHeight) {
            localHeight = (viewportHeight * display.width) / viewportWidth;
            offset.x = 0;
            offset.y = (display.height - localHeight) / 2;

        } else {
            localWidth = (viewportWidth * display.height) / viewportHeight;
            offset.y = 0;
            offset.x = (display.width - localWidth) / 2;
        }

        ratio.x = viewportWidth / localWidth;
        ratio.y = viewportHeight / localHeight;

        point.x = (x / ratio.x) + offset.x;
        point.y = (y / ratio.y) + offset.y;

        return point;
    };

    /**
     *
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._draw = function (touches) {

        var i = 0,
            len = touches.length,
            ctx = this._ctx,
            style = this.display.style,
            id,
            touch,
            point;

        if (style.backgroundImage !== 'none') {
            style.backgroundImage = 'none';
        }

        for (i; i < len; i += 1) {
            touch = touches[i];
            id = touch.identifier;
            point = this._scalePoints(touch.pageX, touch.pageY);

            ctx.beginPath();

            if (this.lastPoint[id]) {
                ctx.moveTo(this.lastPoint[id].x, this.lastPoint[id].y);
                ctx.lineTo(point.x, point.y);
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
            } else {
                ctx.arc(point.x, point.y, 3.5, 0, 2*Math.PI);
                ctx.fillStyle = '#FFF';
                ctx.fill();
            }

            this.lastPoint[id] = {x: point.x, y: point.y};
        }

        return this;
    };

    /**
     *
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._finishDrawing = function () {
        this.display.style.backgroundImage = 'url("' + helperImage +'")';
        this.lastPoint = {};
        this._ctx.clearRect(0, 0, this.display.width, this.display.height);
        return this;
    };

    /**
     * Snap helper to the container.
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._snap = function () {

        var that = this,
            viewportWidth = viewport.clientWidth,
            viewportHeight = viewport.clientHeight,
            displayWidth = this.display.clientWidth,
            displayHeight = this.display.clientHeight,
            y = this.currentOffset.y,
            x = this.currentOffset.x;

        if (this.currentOffset.x < displayWidth / 2) {
            x = 2;

        } else if (this.currentOffset.x + displayWidth > viewportWidth - displayWidth / 2) {
            x = viewportWidth - displayWidth - 2;
        }

        if (this.currentOffset.y < displayHeight) {
            y = 2;

        } else if (this.currentOffset.y + displayHeight > viewportHeight - displayHeight) {
            y =  viewportHeight - displayHeight - 2;

        } else {
            x = (this.currentOffset.x + (displayWidth / 2) > viewportWidth / 2)
                ? viewportWidth - displayWidth - 2
                : 2;
        }

        this.currentOffset.y = y;
        this.currentOffset.x = x;

        this.display.style.transition = prefix + 'transform 200ms ease-in-out';
        this.display.style[prefix + 'transform'] = 'translate(' + this.currentOffset.x + 'px,' + this.currentOffset.y + 'px)';

        window.setTimeout(function () {
            that.display.style.transition = 'none';
        }, 200);

        return this;
    };

    /**
     * Show helper.
     * @memberof! Helper.prototype
     * @function
     * @returns {helper}
     * @example
     * // Show helper.
     * helper.show();
     */
    Helper.prototype.show = function () {
        this._enabled = true;
        this.display.style.display = 'block';

        return this;
    };

    /**
     * Hide helper.
     * @memberof! Helper.prototype
     * @function
     * @returns {helper}
     * @example
     * // Hide helper.
     * helper.hide();
     */
    Helper.prototype.hide = function () {
        this._enabled = false;
        this.display.style.display = 'none';

        return this;
    };

    /**
     * Create a helper showroom.
     * @memberof! Helper.prototype
     * @function
     * @private
     * @returns {helper}
     */
    Helper.prototype._createShowroom = function (options) {
        var that = this,
            showroom = {};
        showroom.container = createNode('div', 'gk-helper-container gk-helper-hide');
        // showroom.title = createNode('h2', 'gk-helper-title', showroom.container);
        // showroom.title.innerHTML = this._options.title;
        // showroom.closeBtn = createNode('button', 'gk-helper-close', showroom.container);
        // showroom.closeBtn.addEventListener('touchend', function () {
        //     that.hideGestures();
        // });

        this.showroom = showroom;

        this.loadGestures();

        return this;
    };

    function findKeyframesRule(rule)
        {
            // gather all stylesheets into an array
            var ss = document.styleSheets;
            
            // loop through the stylesheets
            for (var i = 0; i < ss.length; ++i) {
                
                // loop through all the rules
                for (var j = 0; j < ss[i].cssRules.length; ++j) {
                    
                    // find the -webkit-keyframe rule whose name matches our passed over parameter and return that rule
                    if (ss[i].cssRules[j].type == window.CSSRule.WEBKIT_KEYFRAMES_RULE && ss[i].cssRules[j].name == rule)
                        return ss[i].cssRules[j];
                }
            }
            
            // rule not found
            return null;
        }

    // remove old keyframes and add new ones
    function change(anim, from, to)
        {
            // find our -webkit-keyframe rule
            var keyframes = findKeyframesRule(anim);
            
            // remove the existing 0% and 100% rules
            keyframes.deleteRule("from");
            keyframes.deleteRule("to");
            
            // create new 0% and 100% rules with random numbers
            if (from !== 0 && to !== 0)
            {
                keyframes.insertRule("from { width: 0px; left: " + from + "px; }");
                keyframes.insertRule("to { width: 360px; left: " + to + "px; }");
            }
            else {
                keyframes.insertRule("from { width: 0px;}");
                keyframes.insertRule("to { width: 360px;}");
            }
            
            // assign the animation to our element (which will cause the animation to run)
        }

    /**
     * Show available gestures.
     * @memberof! Helper.prototype
     * @function
     * @returns {helper}
     * @example
     * // Show available gestures.
     * helper.showGestures();
     */
    Helper.prototype.showGestures = function () {
        
        var children = this.showroom.container.children
        for (var i=0 ; i< children.length; i++)
        {
            children[i].firstChild.firstChild.style.display = 'inline-block';
            children[i].firstChild.lastChild.style.display = 'none';
        }
        var helperContainerCoordinates = this.display.getBoundingClientRect();
        // console.log(helperContainerCoordinates);
        var displayWidth = this.container.offsetWidth;

        if(this.currentOffset.x > displayWidth / 2)
        {
            var helperContainerCoordinates = this.display.getBoundingClientRect();
            // console.log(helperContainerCoordinates);
            var newLeft = helperContainerCoordinates.left - 360;
            this.showroom.container.style.top = helperContainerCoordinates.top + 'px';
            this.showroom.container.style.left = newLeft + 'px';
            this.showroom.container.style.paddingLeft = 0 + 'px';
            this.showroom.container.style.paddingRight = 58 + 'px';
            change('gkHelper-animation-enter', helperContainerCoordinates.left, helperContainerCoordinates.left - 360);
        }
        else
        {
            this.showroom.container.style.paddingLeft = 58 + 'px';
            this.showroom.container.style.paddingRight = 0 + 'px';
            this.showroom.container.style.top = helperContainerCoordinates.top + 'px';
            this.showroom.container.style.left = helperContainerCoordinates.left + 2 + 'px';
            change('gkHelper-animation-enter', 0, 0);
        }
        
        this.showroom.container.style.display = 'block';
        gesturekit.disable();

        return this;
    };

    /**
     * Hide available gestures.
     * @memberof! Helper.prototype
     * @function
     * @returns {helper}
     * @example
     * // Hide available gestures.
     * Helper.hideGestures();
     */
    Helper.prototype.hideGestures = function () {
        this.showroom.container.style.display = 'none';
        gesturekit.enable();

        return this;
    };

    /**
     * Loads the available gestures from a given gid.
     * @memberof! Helper.prototype
     * @function
     * @params {String} gid - A given GID.
     * @returns {Helper} Returns a new instance of Helper.
     */
    Helper.prototype.loadGestures = function (gid) {
        var that = this,
            xhr = new window.XMLHttpRequest(),
            status,
            response;

        gid = gid || gesturekit._options.gid;

        xhr.open('GET', url + gid);

        // Add events
        xhr.onreadystatechange = function () {
            if (xhr.readyState === xhr.DONE) {
                status = xhr.status;

                if ((status >= 200 && status < 300) || status === 304 || status === 0) {
                    response = JSON.parse(xhr.response || xhr.responseText);
                    that.renderGestures(response.gestureset.gestures);
                }
            }
        };

        xhr.send();

        return this;
    };

    /**
     * Render a given collection of gestures.
     * @memberof! Helper.prototype
     * @function
     * @returns {helper}
     */
    Helper.prototype.renderGestures = function (gestures) {
        var tmp = '';

        gestures.forEach(function (gesture) {
            tmp += render(gesture);
        });

        this.showroom.container.insertAdjacentHTML('beforeend', tmp);

        return this;
    };

    function helper(options) {
        return new Helper(options);
    };

    /**
     * Expose Helper
     */
    // AMD suppport
    if (typeof window.define === 'function' && window.define.amd !== undefined) {
        window.define('helper', [], function () {
            return helper;
        });

    // CommonJS suppport
    } else if (typeof module !== 'undefined' && module.exports !== undefined) {
        module.exports = helper;

    // Default
    } else {
        window.gesturekit.helper = helper;
    }

}(this, this.gesturekit));