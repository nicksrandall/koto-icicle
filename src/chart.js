import d3 from 'd3';
import Koto from 'koto';
import KotoTooltip from 'koto-tooltip';
import hierarchy from './hierarchy';
import configs from './configs';

/**
 * # A working Icicle Chart
 *
 * To see this chart run `gulp connect` and then navigate to localhost:1337.
 * The js file that renders this chart is found `www > js > main.js`
 */
class Icicle extends Koto {
	constructor(selection) {
    super(selection);
    var _Chart = this;

    // load configs
    configs.forEach(function (item) {
      _Chart.configs.set(item.name, item);
    });

    // accessors
    this.accessor('name', function (d) { return d[d.length-2]; });

    // formatters
    var percent = d3.format('%');
    var overUnder = d3.format('+%');

    // scales
    this.x = d3.scale.linear();
    this.y = d3.scale.linear();
    this.color = d3.scale.ordinal();

    // layouts
    this.partition = d3.layout.partition()
      .value(function(d) { return d[d.length - 1]; });

    // setup main group
    this._group = this.base.append('g');
    
    // Set up tool tip;
    this._tooltip = new KotoTooltip(this.base.append('g'));

    this._tooltip.config({
      opacity: 1,
      format: 'textRectText'
    });

    this._tooltipValue = this._tooltip._appends.append('text')
      .style('font-family', 'Open Sans');
    this._tooltipRect = this._tooltip._appends.append('rect');
    this._tooltipLabel = this._tooltip._appends.append('text')
      .style('font-family', 'Open Sans');
    
    this._tooltip.trigger('draw');
    this._tooltip.trigger('remove');

    this.on('external:click', function (d) {
      click(d);
    });
    
    // Setup Layers
    var icicle = this.layer('icicle', this._group, {
      dataBind: function (data) {
        var root = _Chart.partition(data[0]);
        if (_Chart._targetData) {
          var target = _Chart.partition(_Chart._targetData[0]);
          for (var i=0; i < root.length; i++) {
            root[i].target = target[i].value;
          }
        }
        return this.selectAll('g').data(root);
      },
      insert: function () {
        return this.append('g')
          .on('click', click)
          .on('mouseover', function (d) {
            _Chart._group.selectAll('rect')
              .filter(function (datum) {
                var thingName = d.name ? d.name : d[d.length - 2];
                return !isRelated(d, datum);
              })
              .style('fill', '#e3e3e3');

              _Chart._tooltipValue
                .text(d.name ? d.name : _Chart.accessor('name')(d));

              _Chart._tooltipRect.style('fill', '#000');

              _Chart._tooltipLabel
                .text(percent(d.value));

              if (_Chart._targetData) {
                _Chart._tooltipRect2.style('fill', '#000');
                _Chart._tooltipLabel2
                  .text(overUnder(d.value - d.target));
              }

              _Chart._tooltip.trigger('draw');
            })
            .on('mousemove', function () {
              var coordinates = d3.mouse(_Chart.base.node());
              _Chart._tooltip.trigger('moveTo', {x: coordinates[0], y: coordinates[1]}, null, _Chart.config('width'), _Chart.config('height'));
            })
            .on('mouseout', function (d) {
              _Chart._group.selectAll('rect')
                .style('fill', function(d) { return _Chart.color(d.base); });

              _Chart._tooltip.trigger('remove');
            });
      }
    });
  
    // layer life-cycle events
    icicle.on('enter', function () {
      this.append('rect')
        .style('stroke', '#fff');
      
      if (_Chart._targetData) {
        this.append('path');
      }

      this.append('text')
        .style('pointer-events', 'none');

      return this;
    })
    .on('merge', function () {
      // boxes
      this.select('rect')
        .attr('x', function(d) { return _Chart.x(d.x); })
        .attr('y', function(d) { return _Chart.y(d.y); })
        .attr('width', function(d) { return _Chart.x(d.dx); })
        .attr('height', 0)
        .style('fill', function(d) { d.base = getParent(d, _Chart.rootName); return _Chart.color(d.base); });

      // over-under indicator
      if (_Chart._targetData) {
        this.select('path')
          .style('fill', '#555')
          .style('opacity', 0)
          .attr({
            d: function (d) {
              var symbol = d3.svg.symbol();
              var gen = d.value > d.target ? symbol.type('triangle-up') : d.value < d.target ? symbol.type('triangle-down') : symbol.type('triangle-down');
              return gen();
            },
            transform: function (d) {
              var left = _Chart.x(d.x) + 15;
              var top = _Chart.y(d.y) + 15;
              
              return `translate(${left},${top})`;
            }
          });
      }

      // labels
      this.select('text')
        .text(function (d) { return d.name ? d.name : d[d.length - 2]; })
        .attr('x', function(d) { return _Chart.x(d.x); })
        .attr('dx', _Chart._targetData ? 25 : 5)
        .attr('y', function(d) { return _Chart.y(d.y); })
        .attr('dy', 16)
        .style('alignment-baseline', 'middle')
        .style('fill', '#555')
        .style('font-family', 'Open Sans')
        .style('opacity', 0);
    })
    .on('merge:transition', function () {
      var totalDuration = _Chart.config('introDuration');
      var duration = totalDuration/(_Chart.max-1);
      
      // rects
      this
        .duration(duration)
        .ease('linear')
        .delay(function (d) { return d.depth * duration; })
        .select('rect')
        .attr('height', function(d) { return _Chart.y(d.dy); });
      
      // paths
      if (_Chart._targetData) {
        this
          .delay(totalDuration)
          .selectAll('path')
          .style('opacity', function (d) {
            var shouldShow = d.value > d.target || d.value < d.target;
            var canFit = _Chart.x(d.dx) > 25;
            return shouldShow && canFit ? 1 : 0;
          });
      }

      // linear
      this
        .duration(duration)
        .ease('linear')
        .delay(function (d) { return d.depth * duration; })
        .select('text')
        .style('opacity', function (d) {
          d.textLength = this.getComputedTextLength();
          return (d.textLength + 30) < _Chart.x(d.dx) ? 1 : 0;
        });
      return this;
    });

    // click event handler
    function click(d) {
      _Chart.x.domain([d.x, d.x + d.dx]);
      _Chart.y.domain([d.y, 1]).range([d.y ? 20 : 0, _Chart.config('height')]);

      // transition Rects
      _Chart._group.selectAll('rect')
        .transition()
        .duration(_Chart.config('transitionDuration'))
        .attr('x', function(d) { return _Chart.x(d.x); })
        .attr('y', function(d) { return _Chart.y(d.y); })
        .attr('width', function(d) { return _Chart.x(d.x + d.dx) - _Chart.x(d.x); })
        .attr('height', function(d) { return _Chart.y(d.y + d.dy) - _Chart.y(d.y); });

      // transition paths
      if (_Chart._targetData) {
        _Chart._group.selectAll('path')
          .transition()
          .duration(_Chart.config('transitionDuration'))
          .attr('transform', function (d) {
            var left = _Chart.x(d.x) + 15;
            var top = _Chart.y(d.y) + 15;
            return `translate(${left},${top})`;
          });
      }

      // transition text
      _Chart._group.selectAll('text')
        .transition()
        .duration(_Chart.config('transitionDuration'))
        .attr('x', function(d) { return _Chart.x(d.x); })
        .attr('y', function(d) { return _Chart.y(d.y); })
        .style('opacity', function (d) {
          return (d.textLength + 12) < (_Chart.x(d.x + d.dx) - _Chart.x(d.x)) ? 1 : 0;
        });
    }

    // check to see if nodes are related
    function isRelated(thing, relative) {
      return (isChild(thing, relative) || isParent(thing, relative));
    }

    // check to see if node is child
    function isChild(thing, relative) {
      if (thing === relative) {
        return true;
      }
      if (!thing.parent) {
        return false;
      }
      return isChild(thing.parent, relative);
    }

    // check to see if node is parent
    function isParent (thing, relative) {
      var i;
      var temp;
      if (thing === relative) {
        return true;
      }
      if (!thing.children) {
        return false;
      }
      for (i=0; i < thing.children.length; i++) {
        if (isParent(thing.children[i], relative)) {
          return true;
        }
      }
      return false;
    }

    // get parents name - for color
    function getParent (d, rootName) {
      if (!d.parent) {
        return d.name;
      }
      if (d.parent.name === rootName) {
        return d.name;
      }
      return getParent(d.parent, rootName);
    }
  }

  transform(data){
    this.max = d3.max(data, function (row) { return row.length; });
    return hierarchy()
      .maxLength(this.max)
      .entries(data);
  }

  targetData(data){
    this._targetData = hierarchy()
      .maxLength(this.max)
      .entries(data);

    this._tooltipRect2 = this._tooltip._appends.append('rect');
    this._tooltipLabel2 = this._tooltip._appends.append('text')
      .style('font-family', 'Open Sans');
    return this;
  }

  preDraw(data){
    this.x.range([0, this.config('width')]);
    this.y.range([0, this.config('height')]);
    this.rootName = data[0].name;
    
    var level1 = data[0].children.map(function (child) { return child.name; });
    level1.push(this.rootName);
    this.color.range(this.config('colorRange')).domain(level1);
  }
}

export default Icicle;