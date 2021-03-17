/*!
 * Inspired by
 * yii2-js-cookie v2.0.3
 * https://github.com/requilence/yii2-js-cookie
 */
/*!
 * js-php-unserialize v31-Aug-2016
 * https://github.com/naholyr/js-php-unserialize
 */
/*!
 * JavaScript Cookie v2.2.0
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
// Wrapper for nodejs/browser compat
(function (window, exports) {

// Public API
    exports.unserialize = unserialize;
    exports.unserializeSession = unserializeSession;

    /**
     * Unserialize data taken from PHP's serialize() output
     *
     * Taken from https://github.com/kvz/phpjs/blob/master/functions/var/unserialize.js
     * Fixed window reference to make it nodejs-compatible
     *
     * @param string serialized data
     * @return unserialized data
     * @throws
     */
    function unserialize (data) {
        // http://kevin.vanzonneveld.net
        // +     original by: Arpad Ray (mailto:arpad@php.net)
        // +     improved by: Pedro Tainha (http://www.pedrotainha.com)
        // +     bugfixed by: dptr1988
        // +      revised by: d3x
        // +     improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +        input by: Brett Zamir (http://brett-zamir.me)
        // +     improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +     improved by: Chris
        // +     improved by: James
        // +        input by: Martin (http://www.erlenwiese.de/)
        // +     bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +     improved by: Le Torbi
        // +     input by: kilops
        // +     bugfixed by: Brett Zamir (http://brett-zamir.me)
        // +      input by: Jaroslaw Czarniak
        // %            note: We feel the main purpose of this function should be to ease the transport of data between php & js
        // %            note: Aiming for PHP-compatibility, we have to translate objects to arrays
        // *       example 1: unserialize('a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}');
        // *       returns 1: ['Kevin', 'van', 'Zonneveld']
        // *       example 2: unserialize('a:3:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";s:7:"surName";s:9:"Zonneveld";}');
        // *       returns 2: {firstName: 'Kevin', midName: 'van', surName: 'Zonneveld'}
        var that = this,
            utf8Overhead = function (chr) {
                // http://phpjs.org/functions/unserialize:571#comment_95906
                var code = chr.charCodeAt(0);
                if (code < 0x0080) {
                    return 0;
                }
                if (code < 0x0800) {
                    return 1;
                }
                return 2;
            },
            error = function (type, msg, filename, line) {
                throw new window[type](msg, filename, line);
            },
            read_until = function (data, offset, stopchr) {
                var i = 2, buf = [], chr = data.slice(offset, offset + 1);

                while (chr != stopchr) {
                    if ((i + offset) > data.length) {
                        error('Error', 'Invalid');
                    }
                    buf.push(chr);
                    chr = data.slice(offset + (i - 1), offset + i);
                    i += 1;
                }
                return [buf.length, buf.join('')];
            },
            read_chrs = function (data, offset, length) {
                var i, chr, buf;

                buf = [];
                for (i = 0; i < length; i++) {
                    chr = data.slice(offset + (i - 1), offset + i);
                    buf.push(chr);
                    length -= utf8Overhead(chr);
                }
                return [buf.length, buf.join('')];
            },
            _unserialize = function (data, offset) {
                var dtype, dataoffset, keyandchrs, keys,
                    readdata, readData, ccount, stringlength,
                    i, key, kprops, kchrs, vprops, vchrs, value,
                    chrs = 0,
                    typeconvert = function (x) {
                        return x;
                    },
                    readArray = function () {
                        readdata = {};

                        keyandchrs = read_until(data, dataoffset, ':');
                        chrs = keyandchrs[0];
                        keys = keyandchrs[1];
                        dataoffset += chrs + 2;

                        for (i = 0; i < parseInt(keys, 10); i++) {
                            kprops = _unserialize(data, dataoffset);
                            kchrs = kprops[1];
                            key = kprops[2];
                            dataoffset += kchrs;

                            vprops = _unserialize(data, dataoffset);
                            vchrs = vprops[1];
                            value = vprops[2];
                            dataoffset += vchrs;

                            readdata[key] = value;
                        }
                    };

                if (!offset) {
                    offset = 0;
                }
                dtype = (data.slice(offset, offset + 1)).toLowerCase();

                dataoffset = offset + 2;

                switch (dtype) {
                    case 'i':
                        typeconvert = function (x) {
                            return parseInt(x, 10);
                        };
                        readData = read_until(data, dataoffset, ';');
                        chrs = readData[0];
                        readdata = readData[1];
                        dataoffset += chrs + 1;
                        break;
                    case 'b':
                        typeconvert = function (x) {
                            return parseInt(x, 10) !== 0;
                        };
                        readData = read_until(data, dataoffset, ';');
                        chrs = readData[0];
                        readdata = readData[1];
                        dataoffset += chrs + 1;
                        break;
                    case 'd':
                        typeconvert = function (x) {
                            return parseFloat(x);
                        };
                        readData = read_until(data, dataoffset, ';');
                        chrs = readData[0];
                        readdata = readData[1];
                        dataoffset += chrs + 1;
                        break;
                    case 'n':
                        readdata = null;
                        break;
                    case 's':
                        ccount = read_until(data, dataoffset, ':');
                        chrs = ccount[0];
                        stringlength = ccount[1];
                        dataoffset += chrs + 2;

                        readData = read_chrs(data, dataoffset + 1, parseInt(stringlength, 10));
                        chrs = readData[0];
                        readdata = readData[1];
                        dataoffset += chrs + 2;
                        if (chrs != parseInt(stringlength, 10) && chrs != readdata.length) {
                            error('SyntaxError', 'String length mismatch');
                        }
                        break;
                    case 'a':
                        readArray();
                        dataoffset += 1;
                        break;
                    case 'o':
                        ccount = read_until(data, dataoffset, ':');
                        dataoffset += ccount[0] + 2;

                        ccount = read_until(data, dataoffset, '"');
                        dataoffset += ccount[0] + 2;

                        readArray();
                        dataoffset += 1;
                        break;
                    default:
                        error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
                        break;
                }
                return [dtype, dataoffset - offset, typeconvert(readdata)];
            }
        ;

        return _unserialize((data + ''), 0)[2];
    }

    /**
     * Parse PHP-serialized session data
     *
     * @param string serialized session
     * @return unserialized data
     * @throws
     */
    function unserializeSession (input) {
        return input.split(/\|/).reduce(function (output, part, index, parts) {
            // First part = $key
            if (index === 0) {
                output._currKey = part;
            }
            // Last part = $someSerializedStuff
            else if (index === parts.length - 1) {
                output[output._currKey] = unserialize(part);
                delete output._currKey;
            }
            // Other output = $someSerializedStuff$key
            else {
                var repper = part.replace(/(\n|\r)/g," ");
                var match = repper.match(/^((?:.*?[;\}])+)([^;\}]+?)$/);
                if (match) {
                    output[output._currKey] = unserialize(match[1]);
                    output._currKey = match[2];
                } else {
                    throw new Error('Parse error on part "' + part + '"');
                }
            }
            return output;
        }, {});
    }

// /Wrapper
})((typeof window === 'undefined') ? global : window, (typeof exports === 'undefined') ? (window.PHPUnserialize = {}) : exports);

;(function (factory) {
    var registeredInModuleLoader = false;
    if (typeof define === 'function' && define.amd) {
        define(factory);
        registeredInModuleLoader = true;
    }
    if (typeof exports === 'object') {
        module.exports = factory();
        registeredInModuleLoader = true;
    }
    if (!registeredInModuleLoader) {
        var OldCookies = window.Cookies;
        var api = window.Cookies = factory();
        api.noConflict = function () {
            window.Cookies = OldCookies;
            return api;
        };
    }
}(function () {
    function extend () {
        var i = 0;
        var result = {};
        for (; i < arguments.length; i++) {
            var attributes = arguments[ i ];
            for (var key in attributes) {
                result[key] = attributes[key];
            }
        }
        return result;
    }

    function init (converter) {
        function api (key, value, attributes) {
            var result;
            if (typeof document === 'undefined') {
                return;
            }

            // Write

            if (arguments.length > 1) {
                attributes = extend({
                    path: '/'
                }, api.defaults, attributes);

                if (typeof attributes.expires === 'number') {
                    var expires = new Date();
                    expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
                    attributes.expires = expires;
                }

                // We're using "expires" because "max-age" is not supported by IE
                attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

                try {
                    result = JSON.stringify(value);
                    if (/^[\{\[]/.test(result)) {
                        value = result;
                    }
                } catch (e) {}

                if (!converter.write) {
                    value = encodeURIComponent(String(value))
                    .replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
                } else {
                    value = converter.write(value, key);
                }

                key = encodeURIComponent(String(key));
                key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
                key = key.replace(/[\(\)]/g, escape);

                var stringifiedAttributes = '';

                for (var attributeName in attributes) {
                    if (!attributes[attributeName]) {
                        continue;
                    }
                    stringifiedAttributes += '; ' + attributeName;
                    if (attributes[attributeName] === true) {
                        continue;
                    }
                    stringifiedAttributes += '=' + attributes[attributeName];
                }
                return (document.cookie = key + '=' + value + stringifiedAttributes);
            }

            // Read

            if (!key) {
                result = {};
            }

            // To prevent the for loop in the first place assign an empty array
            // in case there are no cookies at all. Also prevents odd result when
            // calling "get()"
            var cookies = document.cookie ? document.cookie.split('; ') : [];
            var rdecode = /(%[0-9A-Z]{2})+/g;
            var i = 0;

            for (; i < cookies.length; i++) {
                var parts = cookies[i].split('=');
                var cookie = parts.slice(1).join('=');

                if (!this.json && cookie.charAt(0) === '"') {
                    cookie = cookie.slice(1, -1);
                }

                try {
                    var name = parts[0].replace(rdecode, decodeURIComponent);
                    cookie = converter.read ?
                        converter.read(cookie, name) : converter(cookie, name) ||
                        cookie.replace(rdecode, decodeURIComponent);

                    if (this.json) {
                        try {
                            cookie = JSON.parse(cookie);
                        } catch (e) {}
                    }

                    if (this.protected) {
                        try {
                            var cookieData = PHPUnserialize.unserialize(cookie.substring(64));
                            cookie = cookieData[1];
                        } catch (e) {}
                    }

                    if (key === name) {
                        result = cookie;
                        break;
                    }

                    if (!key) {
                        result[name] = cookie;
                    }
                } catch (e) {}
            }

            return result;
        }

        api.set = api;
        api.get = function (key) {
            return api.call(api, key);
        };
        api.getJSON = function () {
            return api.apply({
                json: true
            }, [].slice.call(arguments));
        };
        api.getProtected = function () {
            return api.apply({
                protected: true
            }, [].slice.call(arguments));
        };
        api.defaults = {};

        api.remove = function (key, attributes) {
            api(key, '', extend(attributes, {
                expires: -1
            }));
        };

        api.withConverter = init;

        return api;
    }

    return init(function () {});
}));
