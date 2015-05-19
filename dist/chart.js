var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3'), require('koto'), require('KotoTooltip')) : typeof define === 'function' && define.amd ? define(['d3', 'koto', 'KotoTooltip'], factory) : global.KotoIcicle = factory(global.d3, global.koto, global.KotoTooltip);
})(this, function (d3, koto, KotoTooltip) {
  'use strict';

  /**
   * This will convert a flat, 2D array into a nested data structure.
   * Simular to d3.nest but allows n number of depths for each node
   */

  // jscs:disable
  function hierarchy() {
    var nest = {},
        keys = [],
        sortKeys = [],
        maxLength = 0,
        sortValues,
        rollup,
        filter = function filter(d) {
      return d !== null;
    };

    function keySetter(depth) {
      return function (d) {
        return d[depth];
      };
    }

    function map(mapType, array, depth) {
      if (depth >= maxLength) {
        return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      }

      var i = -1,
          n = array.length,
          key = keySetter(depth++),
          keyValue,
          object,
          setter,
          size,
          valuesByKey = d3.map({}),
          values;

      /*jshint -W084 */
      while (++i < n) {
        if (depth === 1) {
          object = array[i].filter(filter);
        } else {
          object = array[i];
        }
        values = valuesByKey.get(keyValue = key(object));
        if (array[i].length > depth) {
          if (values) {
            values.push(object);
          } else {
            valuesByKey.set(keyValue, [object]);
          }
        }
      }

      if (mapType) {
        object = mapType();
        size = function (object) {
          return object.size();
        };
        setter = function (keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        size = function (object) {
          return Object.keys(object).length;
        };
        setter = function (keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }

      valuesByKey.forEach(setter);
      if (!size(object)) {
        return array;
      }
      return object;
    }

    function entries(map, depth) {
      if (depth >= maxLength || depth > map.length - 1) {
        return map;
      }

      var array = [],
          sortKey = sortKeys[depth++];

      map.forEach(function (key, keyMap) {
        array.push({ name: key, children: entries(keyMap, depth) });
      });

      return sortKey ? array.sort(function (a, b) {
        return sortKey(a.name, b.name);
      }) : array;
    }

    nest.map = function (array, mapType) {
      return map(mapType, array, 0);
    };

    nest.entries = function (array) {
      return entries(map(d3.map, array, 0), 0);
    };

    nest.maxLength = function (newMaxLength) {
      maxLength = newMaxLength - 2;
      return nest;
    };

    nest.filter = function (f) {
      filter = f;
      return nest;
    };

    // Specifies the order for the most-recently specified key.
    // Note: only applies to entries. Map keys are unordered!
    nest.sortKeys = function (order, depth) {
      depth = depth || maxLength;
      sortKeys[depth] = order;
      return nest;
    };

    // Specifies the order for leaf values.
    // Applies to both maps and entries array.
    nest.sortValues = function (order) {
      sortValues = order;
      return nest;
    };

    nest.rollup = function (f) {
      rollup = f;
      return nest;
    };

    return nest;
  }
  // jscs:enable

  var configs = [{
    name: 'height',
    description: 'The height of the chart.',
    value: 700,
    type: 'number',
    units: 'px',
    category: 'Size',
    getter: function getter() {
      // get value
      // console.log('getter');
      return this.value;
    },
    setter: function setter(newValue) {
      // Set something
      // console.log('setter');
      return newValue;
    }
  }, {
    name: 'width',
    description: 'The widthj of the chart.',
    value: 900,
    units: 'px',
    type: 'number',
    category: 'Size'
  }, {
    name: 'transitionDuration',
    description: 'How long should it take to animate on click.',
    value: 750,
    units: 'ms',
    type: 'number',
    category: 'Animation'
  }, {
    name: 'introDuration',
    description: 'How long should it take to animate in.',
    value: 2000,
    units: 'ms',
    type: 'number',
    category: 'Animation'
  }, {
    name: 'colorRange',
    value: ['#BBE491', '#FB8D34', '#E45621', '#73B0D7'],
    description: 'colors for categories',
    type: 'colorArray',
    category: 'Color'
  }];

  var Icicle = (function (_koto$Base) {
    function Icicle(selection) {
      _classCallCheck(this, Icicle);

      _get(Object.getPrototypeOf(Icicle.prototype), 'constructor', this).call(this, selection);
      var _Chart = this;

      // load configs
      configs.forEach(function (item) {
        _Chart.configs.set(item.name, item);
      });

      // accessors
      this.accessor('name', function (d) {
        return d[d.length - 2];
      });

      // formatters
      var percent = d3.format('%');
      var overUnder = d3.format('+%');

      // scales
      this.x = d3.scale.linear();
      this.y = d3.scale.linear();
      this.color = d3.scale.ordinal();

      // layouts
      this.partition = d3.layout.partition().value(function (d) {
        return d[d.length - 1];
      });

      // setup main group
      this._group = this.base.append('g');

      // Set up tool tip;
      this._tooltip = new KotoTooltip(this.base.append('g'));

      this._tooltip.config({
        opacity: 1,
        format: 'textRectText'
      });

      this._tooltipValue = this._tooltip._appends.append('text').style('font-family', 'Open Sans');
      this._tooltipRect = this._tooltip._appends.append('rect');
      this._tooltipLabel = this._tooltip._appends.append('text').style('font-family', 'Open Sans');

      this._tooltip.trigger('draw');
      this._tooltip.trigger('remove');

      // Setup Layers
      var icicle = this.layer('icicle', this._group, {
        dataBind: function dataBind(data) {
          var root = _Chart.partition(data[0]);
          if (_Chart._targetData) {
            var target = _Chart.partition(_Chart._targetData[0]);
            for (var i = 0; i < root.length; i++) {
              root[i].target = target[i].value;
            }
          }
          return this.selectAll('g').data(root);
        },
        insert: function insert() {
          return this.append('g').on('click', click).on('mouseover', function (d) {
            _Chart._group.selectAll('rect').filter(function (datum) {
              var thingName = d.name ? d.name : d[d.length - 2];
              return !isRelated(d, datum);
            }).style('fill', '#e3e3e3');

            _Chart._tooltipValue.text(d.name ? d.name : _Chart.accessor('name')(d));

            _Chart._tooltipRect.style('fill', '#000');

            _Chart._tooltipLabel.text(percent(d.value));

            if (_Chart._targetData) {
              _Chart._tooltipRect2.style('fill', '#000');
              _Chart._tooltipLabel2.text(overUnder(d.value - d.target));
            }

            _Chart._tooltip.trigger('draw');
          }).on('mousemove', function () {
            var coordinates = d3.mouse(_Chart.base.node());
            _Chart._tooltip.trigger('moveTo', { x: coordinates[0], y: coordinates[1] }, null, _Chart.config('width'), _Chart.config('height'));
          }).on('mouseout', function (d) {
            _Chart._group.selectAll('rect').style('fill', function (d) {
              return _Chart.color(d.base);
            });

            _Chart._tooltip.trigger('remove');
          });
        }
      });

      // layer life-cycle events
      icicle.on('enter', function () {
        this.append('rect').style('stroke', '#fff');

        if (_Chart._targetData) {
          this.append('path');
        }

        this.append('text').style('pointer-events', 'none');

        return this;
      }).on('merge', function () {
        // boxes
        this.select('rect').attr('x', function (d) {
          return _Chart.x(d.x);
        }).attr('y', function (d) {
          return _Chart.y(d.y);
        }).attr('width', function (d) {
          return _Chart.x(d.dx);
        }).attr('height', 0).style('fill', function (d) {
          d.base = getParent(d, _Chart.rootName);return _Chart.color(d.base);
        });

        // over-under indicator
        if (_Chart._targetData) {
          this.select('path').style('fill', '#555').style('opacity', 0).attr({
            d: (function (_d) {
              function d(_x) {
                return _d.apply(this, arguments);
              }

              d.toString = function () {
                return _d.toString();
              };

              return d;
            })(function (d) {
              var symbol = d3.svg.symbol();
              var gen = d.value > d.target ? symbol.type('triangle-up') : d.value < d.target ? symbol.type('triangle-down') : symbol.type('triangle-down');
              return gen();
            }),
            transform: function transform(d) {
              var left = _Chart.x(d.x) + 15;
              var top = _Chart.y(d.y) + 15;

              return 'translate(' + left + ',' + top + ')';
            }
          });
        }

        // labels
        this.select('text').text(function (d) {
          return d.name ? d.name : d[d.length - 2];
        }).attr('x', function (d) {
          return _Chart.x(d.x);
        }).attr('dx', _Chart._targetData ? 25 : 5).attr('y', function (d) {
          return _Chart.y(d.y);
        }).attr('dy', 16).style('alignment-baseline', 'middle').style('fill', '#555').style('font-family', 'Open Sans').style('opacity', 0);
      }).on('merge:transition', function () {
        var totalDuration = _Chart.config('introDuration');
        var duration = totalDuration / (_Chart.max - 1);

        // rects
        this.duration(duration).ease('linear').delay(function (d) {
          return d.depth * duration;
        }).select('rect').attr('height', function (d) {
          return _Chart.y(d.dy);
        });

        // paths
        if (_Chart._targetData) {
          this.delay(totalDuration).selectAll('path').style('opacity', function (d) {
            var shouldShow = d.value > d.target || d.value < d.target;
            var canFit = _Chart.x(d.dx) > 25;
            return shouldShow && canFit ? 1 : 0;
          });
        }

        // linear
        this.duration(duration).ease('linear').delay(function (d) {
          return d.depth * duration;
        }).select('text').style('opacity', function (d) {
          d.textLength = this.getComputedTextLength();
          return d.textLength + 30 < _Chart.x(d.dx) ? 1 : 0;
        });
        return this;
      });

      // click event handler
      function click(d) {
        _Chart.x.domain([d.x, d.x + d.dx]);
        _Chart.y.domain([d.y, 1]).range([d.y ? 20 : 0, _Chart.config('height')]);

        // transition Rects
        _Chart._group.selectAll('rect').transition().duration(_Chart.config('transitionDuration')).attr('x', function (d) {
          return _Chart.x(d.x);
        }).attr('y', function (d) {
          return _Chart.y(d.y);
        }).attr('width', function (d) {
          return _Chart.x(d.x + d.dx) - _Chart.x(d.x);
        }).attr('height', function (d) {
          return _Chart.y(d.y + d.dy) - _Chart.y(d.y);
        });

        // transition paths
        if (_Chart._targetData) {
          _Chart._group.selectAll('path').transition().duration(_Chart.config('transitionDuration')).attr('transform', function (d) {
            var left = _Chart.x(d.x) + 15;
            var top = _Chart.y(d.y) + 15;
            return 'translate(' + left + ',' + top + ')';
          });
        }

        // transition text
        _Chart._group.selectAll('text').transition().duration(_Chart.config('transitionDuration')).attr('x', function (d) {
          return _Chart.x(d.x);
        }).attr('y', function (d) {
          return _Chart.y(d.y);
        }).style('opacity', function (d) {
          return d.textLength + 12 < _Chart.x(d.x + d.dx) - _Chart.x(d.x) ? 1 : 0;
        });
      }

      // check to see if nodes are related
      function isRelated(thing, relative) {
        return isChild(thing, relative) || isParent(thing, relative);
      }

      // check to see if node is child
      function isChild(_x2, _x3) {
        var _again = true;

        _function: while (_again) {
          _again = false;
          var thing = _x2,
              relative = _x3;

          if (thing === relative) {
            return true;
          }
          if (!thing.parent) {
            return false;
          }
          _x2 = thing.parent;
          _x3 = relative;
          _again = true;
          continue _function;
        }
      }

      // check to see if node is parent
      function isParent(thing, relative) {
        var i;
        var temp;
        if (thing === relative) {
          return true;
        }
        if (!thing.children) {
          return false;
        }
        for (i = 0; i < thing.children.length; i++) {
          if (isParent(thing.children[i], relative)) {
            return true;
          }
        }
        return false;
      }

      // get parents name - for color
      function getParent(_x4, _x5) {
        var _again2 = true;

        _function2: while (_again2) {
          _again2 = false;
          var d = _x4,
              rootName = _x5;

          if (!d.parent) {
            return d.name;
          }
          if (d.parent.name === rootName) {
            return d.name;
          }
          _x4 = d.parent;
          _x5 = rootName;
          _again2 = true;
          continue _function2;
        }
      }
    }

    _inherits(Icicle, _koto$Base);

    _createClass(Icicle, [{
      key: 'transform',
      value: function transform(data) {
        this.max = d3.max(data, function (row) {
          return row.length;
        });
        return hierarchy().maxLength(this.max).entries(data);
      }
    }, {
      key: 'targetData',
      value: function targetData(data) {
        this._targetData = hierarchy().maxLength(this.max).entries(data);

        this._tooltipRect2 = this._tooltip._appends.append('rect');
        this._tooltipLabel2 = this._tooltip._appends.append('text').style('font-family', 'Open Sans');
        return this;
      }
    }, {
      key: 'preDraw',
      value: function preDraw(data) {
        this.x.range([0, this.config('width')]);
        this.y.range([0, this.config('height')]);
        this.rootName = data[0].name;

        var level1 = data[0].children.map(function (child) {
          return child.name;
        });
        level1.push(this.rootName);
        this.color.range(this.config('colorRange')).domain(level1);
      }
    }]);

    return Icicle;
  })(koto.Base);

  koto.Icicle = Icicle;

  var chart = koto.Icicle;

  return chart;
});
//# sourceMappingURL=./chart.js.map