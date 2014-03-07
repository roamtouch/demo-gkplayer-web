/**
 * @author Guille Paz <guille87paz@gmail.com>
 */

(function (window, gesturekit) {
    'use strict';

    var doc = window.document,

        viewport = doc.documentElement,

        defaults = {
            'volume': 50,
            'indexTrack': 0
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
     * Creates a new instance of Player.
     * @constructor
     * @returns {player}
     */
    function Player(options) {
        this._init(options);

        return this;
    }

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype._init = function (options) {

        this._options = customizeOptions(options || {});

        this.timer = document.querySelector('.gk-player-time');

        this.title = document.querySelector('.gk-player-title');

        this.album = document.querySelector('.gk-player-album');

        this._player = new Audio();

        this._muted = false;

        this.volume(this._options.volume);

        this.playlist = this._options.playlist;

        this._indexTrack = this._options.indexTrack;

        this.setTrack(this.playlist[this._indexTrack]);

        this._defineEvents();

        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.play = function (track) {
        if (track) {
            this.setTrack(track);
        }

        this._player.play();

        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.setTrack = function (track) {
        this.currentTrack = track;

        this.timer.innerHTML = '00:00';
        this.title.innerHTML = track.artist + ' / ' + track.title;
        this.album.innerHTML = track.album;
        document.body.style.backgroundImage = 'url("' + track.poster + '")';
        this._player.src = track.src;

        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.pause = function () {
        this._player.pause();

        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.stop = function () {
        if (this._player.currentTime) {
            this._player.currentTime = 0;
            this._player.pause();
        }
        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.next = function () {
        var index = this._indexTrack + 1;

        if (index >= this.playlist.length) {
            return this;
        }

        this._indexTrack = index;
        this.setTrack(this.playlist[this._indexTrack]);


        this.play();


        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.prev = function () {
        var index = this._indexTrack - 1;

        if (index < 0) {
            return this;
        }

        this._indexTrack = index;
        this.setTrack(this.playlist[this._indexTrack]);


        this.play();


        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.volume = function (value) {

        this._player.volume = value / 100;

        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.mute = function () {
        this._muted = !this._muted;
        this._player.muted = this._muted;

        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.reset = function () {
        this._indexTrack = 0;
        this.stop();

        return this;
    };

    /**
     * Initializes a new instance of Player.
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype.toggle = function () {
        if (this._player.paused) {
            this.play();
        } else {
            this.pause();
        }

        return this;
    };

    /**
     *
     * @memberof! Player.prototype
     * @function
     * @private
     * @returns {player}
     */
    Player.prototype._defineEvents = function () {
        var that = this,
            player = this._player;

        player.addEventListener('timeupdate', function (eve) {
            var s = parseInt(this.currentTime % 60),
                m = parseInt((this.currentTime / 60) % 60);

            s = s < 10 ? '0' + s : s;
            m = m < 10 ? '0' + m : m;

            that.timer.innerHTML = m + ':' + s;
        });

        player.addEventListener('ended', function (eve) {
            var track = that.currentTrack;

            that.next();

            if (track !== that.currentTrack) {
                that.play();
            } else {
                that.reset();
            }

        });

        return this;
    };

    /**
     * Expose Player
     */
    // AMD suppport
    if (typeof window.define === 'function' && window.define.amd !== undefined) {
        window.define('Player', [], function () {
            return Player;
        });

    // CommonJS suppport
    } else if (typeof module !== 'undefined' && module.exports !== undefined) {
        module.exports = Player;

    // Default
    } else {
        window.Player = Player;
    }

}(this, this.gesturekit));