import d3 from 'd3';
import koto from 'koto';

/**
 * Simple tooltip widget
 */

class Tooltip extends koto.Base {
  constructor(selection){
    super(selection);
     var _Chart = this;
     
     var configs = {
      container: this.base,
      opacity: 0,
      padding: 7,
      caretSize: 5,
      stationary: false,
      maxWidth: 200,
      format: 'default',
      tooltipBackgroundColor: '#fff'
     };

     for (var key in configs) {
      this.configs.set(key, {value: configs[key]});
     }

     var formats = {
      default: function (appends) {},
      text: function (appends) {
        //Automatically position if there is only one text element appended
        if (appends[0].length === 1 && appends.node().childNodes[0].nodeName === 'text') {

          var textBBox = appends.node().childNodes[0].getBBox();

          appends.select('text')
            .attr({
              dy: function () { return getCentralPosition(this); },
              y: textBBox.height / 2
            });
          appends.selectAll('tspan')
            .attr({
              dy: function () { return getCentralPosition(this); },
              y: textBBox.height / 2
            });
        }
      },
      textBlock: function (appends) {

        var textElement = appends.select('text');
        var dy = textElement.node().getBoundingClientRect().height;
        d3.domoStrings.wrapText(textElement, _Chart.config('maxWidth'));

        appends.select('text').attr({y: dy - (dy / 4)});
      },
      textRectText: function (appends) {
        //Automatically format for text rect text pattern
        if (appends.node().childNodes.length % 2 !== 0) {

          if (isTextRectText(appends)) {
            formatAppendTextRectText(appends);
          }

        }
      }
    };

    var r = 3; //Radius to round the rect

    this._baseGroup = this.base.append('g')
      .attr('transform', 'translate(0, 0)')
      .style('pointer-events', 'none');

    _Chart._parent = _Chart._baseGroup.node().parentNode;

    this._baseGroup.append('path')
      .attr('class', 'toolTipPath')
      .style('opacity', 0.9);

    this._appends = this._baseGroup.append('g');

    _Chart._drawn = false;
    _Chart._moveX = undefined;
    _Chart._moveY = undefined;

    /**
       * This will hide the tooltip properly
       */
      this.on('remove', function () {
        _Chart._drawn = false;

        if (d3.select('html').node().contains(_Chart._baseGroup.node())) {
          _Chart._parent.removeChild(_Chart._baseGroup.node());
        }
      });



      /**
       * This will re-draw the tool tip with the correct dimensions around the _appends group
       * @param  {number} width  override the width of the container
       * @param  {number} height  override the height of the container
       */
      this.on('draw', function (width, height) {
        _Chart._parent.appendChild(_Chart._baseGroup.node());

        _Chart._container = _Chart.config('container');
        _Chart._caretWidth = _Chart.config('caretSize') * 2;
        _Chart._containerBBox = _Chart.config('container').node().getBoundingClientRect();

        //Format
        _Chart._baseGroup.select('.toolTipPath').style('fill', _Chart.config('tooltipBackgroundColor'));
        _Chart._appends.attr('transform', 'translate(' + _Chart.config('padding') + ', ' + _Chart.config('padding') + ')');
        formats[_Chart.config('format')](_Chart._appends);

        setGBBox(height, width);
        setBaseGroupBBox();
        generatePaths();

        _Chart._baseGroup
          .select('.toolTipPath')
          .attr({
            'transform': _Chart._topPath.translate,
            d: _Chart._topPath.path
          });

        _Chart._drawn = true;
      });



      /**
       * This will move the tooltip wherever you will it to be
       * @param  {object} point     Object with an x and y
       * @param  {string} location  String that will overide the location of the tooltip
       * @param  {number} newWidth  This will override the width of the tooltip's bounds
       * @param  {number} newHeight This will override the height of the tooltip's bounds
       */
      this.on('moveTo', function (point, location, newWidth, newHeight) {
        setBaseGroupBBoxDimensions(location);

        if (_Chart._drawn) {

          var containerWidth = newWidth ? newWidth : _Chart._containerBBox.width;
          var containerHeight = newHeight ? newHeight : _Chart._containerBBox.height;
          var baseGroup = _Chart._baseGroup;
          var tooltipPositionObj = getTooltipPositionStatus(containerWidth, containerHeight, point);

          if (!location) {
            location = determineInboundsTooltipLocation(tooltipPositionObj);
          }

          offsetCaretAtEdge({
            left: tooltipPositionObj.hittingLeft,
            right: tooltipPositionObj.hittingRight,
            top: tooltipPositionObj.hittingTop,
            bottom: tooltipPositionObj.hittingBottom,
            container: {
              height: containerHeight,
              width: containerWidth
            },
            point: point
          });

          var posAndPathObj = calPositionAndPath(location, tooltipPositionObj, containerHeight, containerWidth);

          baseGroup.attr('transform', 'translate(' + posAndPathObj.translateX + ',' + posAndPathObj.translateY + ')');

          baseGroup
            .select('.toolTipPath')
            .attr({
              'transform': posAndPathObj.translate,
              d: posAndPathObj.path
            });
        }

      });


      /*----------------------------------------------------------------------------------
      // MoveTo Helper Functions
      ----------------------------------------------------------------------------------*/

      /**
       * getTopLocationsAndPath
       */
      function getTopLocationsAndPath(tooltipPositionObj, containerWidth) {

        var path;
        var translate;
        var translateX;
        var translateY;

        translateX = getPathTranslate(
          tooltipPositionObj.hittingRight,
          tooltipPositionObj.hittingLeft,
          (tooltipPositionObj.offsetX + (_Chart.config('caretSize'))),
          'width',
          containerWidth
        );

        translateY = tooltipPositionObj.topY;
        translate = _Chart._topPath.translate;

        if (_Chart._moveX !== 0) {
          path = updateCaretPath('_topPath', 'x');
        }
        else {
          path = _Chart._topPath.path;
        }

        return {translateX: translateX, translateY: translateY, translate: translate, path: path};
      }


      /**
       * getRightPositionAndPath
       */
      function getRightPositionAndPath(tooltipPositionObj, containerHeight) {

        var path;
        var translate;
        var translateX;
        var translateY;

        translateY = getPathTranslate(
          tooltipPositionObj.hittingBottom,
          tooltipPositionObj.hittingTop,
          (tooltipPositionObj.centerY - _Chart.config('padding')),
          'height',
          containerHeight
        );

        translateX = tooltipPositionObj.rightX;
        translate = _Chart._rightPath.translate;

        if (_Chart._moveY !== 0) {
          path = updateCaretPath('_rightPath', 'y');
        }
        else {
          path = _Chart._rightPath.path;
        }

        return {translateX: translateX, translateY: translateY, translate: translate, path: path};
      }


      /**
       * getBottomPositionAndPath
       */
      function getBottomPositionAndPath(tooltipPositionObj, containerWidth) {

        var path;
        var translate;
        var translateX;
        var translateY;

        translateX = getPathTranslate(
          tooltipPositionObj.hittingRight,
          tooltipPositionObj.hittingLeft,
          (tooltipPositionObj.offsetX + (_Chart.config('caretSize') / 2)),
          'width',
          containerWidth
        );

        translateY = (tooltipPositionObj.bottomY + _Chart.config('padding')) + 5;
        translate = _Chart._bottomPath.translate;

        if (_Chart._moveX !== 0) {
          path = updateCaretPath('_bottomPath', 'x');
        }
        else {
          path = _Chart._bottomPath.path;
        }

        return {translateX: translateX, translateY: translateY, translate: translate, path: path};
      }

      /**
      * getLeftPositionAndPath
      */
      function getLeftPositionAndPath (tooltipPositionObj, containerHeight)
      {
        var path;
        var translate;
        var translateX;
        var translateY;

        translateY = getPathTranslate(
          tooltipPositionObj.hittingBottom,
          tooltipPositionObj.hittingTop,
          (tooltipPositionObj.centerY - _Chart.config('padding')),
          'height',
          containerHeight
        );

        translateX = tooltipPositionObj.leftX;
        translate = _Chart._leftPath.translate;

        if (_Chart._moveY !== 0) {
          path = updateCaretPath('_leftPath', 'y');
        }
        else {
          path = _Chart._leftPath.path;
        }

        return {translateX: translateX, translateY: translateY, translate: translate, path: path};
      }


      /**
       * Returns the tooltips draw position and path given the current draw location.
       *
       * @param location
       * @param tooltipPositionObj
       * @param containerHeight
       * @returns {{translateX: *, translateY: *, translate: *, path: *}}
       */
      function calPositionAndPath(location, tooltipPositionObj, containerHeight, containerWidth) {

        var positionAndPath;

        switch (location) {
          case 'top':{
            positionAndPath = getTopLocationsAndPath(tooltipPositionObj, containerWidth);
            break;
          }
          case 'right': {
            positionAndPath = getRightPositionAndPath(tooltipPositionObj, containerHeight);
            break;
          }
          case 'bottom': {
            positionAndPath = getBottomPositionAndPath(tooltipPositionObj, containerWidth);
            break;
          }
          case 'left': {
            positionAndPath = getLeftPositionAndPath(tooltipPositionObj, containerHeight);
            break;
          }
        }

        return positionAndPath;
      }


      /**
       * Determine the direction the tooltip should draw given its location.
       * @param tooltipPositionObj
       * @returns {string}
       */
      function determineInboundsTooltipLocation(tooltipPositionObj) {

        var location = 'top';
        if ((tooltipPositionObj.hittingRight || tooltipPositionObj.hittingLeft) && !tooltipPositionObj.closeToTop) {
          location = 'top';
        }
        else if ((tooltipPositionObj.hittingRight || tooltipPositionObj.hittingLeft) && tooltipPositionObj.closeToTop) {
          location = 'bottom';
        }
        else if (tooltipPositionObj.hittingTop && tooltipPositionObj.closeToRight) {
          location = 'left';
        }
        else if (tooltipPositionObj.hittingTop && tooltipPositionObj.closeToLeft) {
          location = 'right';
        }
        else if (!tooltipPositionObj.hittingRight && tooltipPositionObj.closeToRight) {
          location = 'left';
        }
        else if (!tooltipPositionObj.hittingLeft && tooltipPositionObj.closeToLeft) {
          location = 'right';
        }
        else if (tooltipPositionObj.closeToBottom && tooltipPositionObj.closeToTop) {
          location = 'top';
        }
        else if (tooltipPositionObj.closeToTop) {
          location = 'bottom';
        }

        return location;
      }


      /**
       * getTooltipPositionStatus
       */
      function getTooltipPositionStatus(containerWidth, containerHeight, point) {
        var rectBBox = _Chart._gBBox;

        var offsetY = point.y - _Chart._baseGroupBBox.height;
        var offsetX = point.x - _Chart._baseGroupBBox.width / 2;
        var offsetPadding = _Chart._caretWidth;

        var topY    = offsetY - offsetPadding;
        var bottomY = point.y + offsetPadding;
        var centerY = point.y - rectBBox.height / 2;
        var leftX   = point.x - _Chart._baseGroupBBox.width - _Chart.config('caretSize');
        var rightX  = point.x + offsetPadding + 5;

        var closeToRight = point.x + _Chart._baseGroupBBox.width / 2 >= containerWidth;
        var closeToLeft = point.x - _Chart._baseGroupBBox.width / 2 <= 0;
        var closeToTop = point.y - _Chart._baseGroupBBox.height - offsetPadding - 3 <= 0;
        var closeToBottom = point.y + _Chart._baseGroupBBox.height > containerHeight;

        var hittingRight  = closeToRight && point.x - _Chart._baseGroupBBox.width - offsetPadding <= 0;
        var hittingLeft   = closeToLeft && point.x + _Chart._baseGroupBBox.width + offsetPadding >= containerWidth;
        var hittingTop    = (closeToRight || closeToLeft) && (point.y - (_Chart._baseGroupBBox.height / 2) <= 0);
        var hittingBottom = (closeToRight || closeToLeft) && (point.y + (_Chart._baseGroupBBox.height / 2) >= containerHeight);

        return {
          offsetX: offsetX,
          topY: topY,
          bottomY: bottomY,
          centerY: centerY,
          leftX: leftX,
          rightX: rightX,
          closeToRight: closeToRight,
          closeToLeft: closeToLeft,
          closeToTop: closeToTop,
          closeToBottom: closeToBottom,
          hittingRight: hittingRight,
          hittingLeft: hittingLeft,
          hittingTop: hittingTop,
          hittingBottom: hittingBottom
        };
      }


      /**
       * SetBaseGroupBBoxDimensions
       * @param location position of the tooltip
       */
      function setBaseGroupBBoxDimensions(location) {
        _Chart._baseGroupBBox.height =
          location === 'top' || location === 'bottom' ?
          _Chart._gBBox.height + (_Chart.config('padding') * 2) + _Chart.config('caretSize') + 6 :
          _Chart._gBBox.height + (_Chart.config('padding') * 2) + 6;

        _Chart._baseGroupBBox.width =
          location === 'top' || location === 'bottom' ?
          _Chart._gBBox.width + (_Chart.config('padding') * 2) + 6 :
          _Chart._gBBox.width + (_Chart.config('padding') * 2) + _Chart.config('caretSize') + 6;
      }





      /*----------------------------------------------------------------------------------
      // Helper Functions
      ----------------------------------------------------------------------------------*/

      /**
       * Returns if appends is in text rect text format
       * @param appends
       * @returns {boolean}
       */
      function isTextRectText(appends) {
        var returnVal = true;
        for (var i = 0; i < appends.node().childNodes.length; i++) {
          var nodeName = appends.node().childNodes[i].nodeName;
          returnVal = (i % 2 === 0 && nodeName === 'text' ? true : (nodeName === 'rect'));
          if (!returnVal) { break;}
        }
        return returnVal;
      }

      /**
       * Formats appends as text rect text
       * @param appends
       * @param groupBBox
       */
      function formatAppendTextRectText(appends) {
        var padding = 5;
        var prevWidth = 0;
        var groupBBox = {x:0,y:0,height:0,width:0};

        appends.select('rect').attr('height', 0);
        groupBBox = appends.node().getBBox();


        /*jshint -W083 */
        for (var i = 0; i < appends.node().childNodes.length; i++) {
          var element = appends.node().childNodes[i];

          if (i % 2 === 0) {
            //text
            var t = appends.select('text:nth-child(' + (i + 1) + ')')
              .attr({
                dy: function () {return getCentralPosition(this);},
                x: (prevWidth + (padding * i) + 1),
                y: groupBBox.height / 2
              });

            prevWidth += element.getBBox().width;

          }
          else {
            //rect
            appends.select('rect:nth-child(' + (i + 1) + ')')
              .attr({
                x: (prevWidth + (padding * i)),
                y: 0,
                width: 1,
                height: groupBBox.height
              });
          }
        }

        appends.selectAll('tspan')
          .attr({
            transform: function () { return 'translate(0, ' + getCentralPosition(this) + ')'; },
            y: groupBBox.height / 2
          });
      }


      /**
       * setBaseGroupBBox
       */
      function setBaseGroupBBox() {
        _Chart._baseGroupBBox = cloneBBox(_Chart._baseGroup.node().getBBox());
        _Chart._baseGroupBBox.height = _Chart._baseGroupBBox.height - _Chart._caretWidth + 3;
      }


      /**
       * Set gBBox's height and width to height, width if defined else
       * it will use appends BBox.
       * @param height
       * @param width
       */
      function setGBBox(height, width) {
        if (height !== undefined && width !== undefined) {
          _Chart._gBBox = {
            'height': height,
            'width': width
          };
        }
        else {
          _Chart._gBBox = _Chart._appends.node().getBBox();
        }
      }


      /**
       * Calculates vertical center for text
       * @param elem
       * @returns {number}
       */
      function getCentralPosition(elem) {
        return parseInt(d3.select(elem)
            .style('font-size'), 10) * 0.35;
      }

      /**
       * Returns a tranlate that keeps the path in bounds.
       * @param hittingEdge1
       * @param hittingEdge2
       * @param offset
       * @param dimension
       * @param heightOrWidth
       * @returns {*}
       */
      function getPathTranslate(hittingEdge1, hittingEdge2, offset, dimension, heightOrWidth) {
        var translate;

        if (hittingEdge1) {
          translate = heightOrWidth - _Chart._baseGroupBBox[dimension] + r;
        }
        else if (hittingEdge2) {
          translate = r;
        }
        else {
          translate = offset;
        }

        return translate;
      }

      /**
       * UpdateCaretPath
       * @param path
       * @param axis
       * @returns {.autoshot.default_options.options.path|*|.autoshot.default_options.options.local.path|options.path|options.local.path|path}
       */
      function updateCaretPath(path, axis) {
        var pathString;
        var xyString;

        if (axis === 'y') {
          xyString = _Chart[path].caretX + ' ' + (_Chart[path].caretY - _Chart._moveY);
        }
        else {
          xyString = (_Chart[path].caretX + _Chart._moveX) + ' ' + _Chart[path].caretY;
        }

        pathString = _Chart[path].path.match(/Z m (.*?) l/);
        _Chart[path].path = _Chart[path].path.replace(pathString[1], xyString);
        return _Chart[path].path;
      }


      /**
       * OffsetCaretAtEdge
       * @param config
       */
      function offsetCaretAtEdge(config) {
        var container = config.container;
        var point = config.point;
        var tooltipWidth;
        var tooltipHeight;
        var bboxWidth;
        var bboxHeight;
        var mouseXOffset = container.width - point.x;
        var mouseYOffset = point.y;

        var curvedRectOffset = 2*r; //Compensate for the curved rect path. 1 is for good measure.

        bboxHeight = _Chart._gBBox.height; // - curvedRectOffset;
        bboxWidth  = _Chart._gBBox.width; //  - curvedRectOffset;


        var farthestCaretPosition;

        if (config.left || config.right) {

          //Left
          if (config.left) {
            tooltipWidth = container.width - (_Chart._baseGroupBBox.width / 2);
            _Chart._moveX = tooltipWidth - mouseXOffset;

            if ((bboxWidth / 2) + _Chart.config('caretSize') <= _Chart._moveX) {
              _Chart._moveX = -((bboxWidth / 2) + _Chart.config('caretSize'));
            }
          }

          //Right
          if (config.right) {
            tooltipWidth = _Chart._baseGroupBBox.width / 2;
            _Chart._moveX = tooltipWidth - mouseXOffset;

            if (-((bboxWidth / 2) + _Chart.config('caretSize')) >= _Chart._moveX) {
              _Chart._moveX = -((bboxWidth / 2) + _Chart.config('caretSize'));
            }
          }


        }
        else if (config.top || config.bottom) {

          //Top
          if (config.top) {
            tooltipHeight = _Chart._baseGroupBBox.height / 2;
            _Chart._moveY = tooltipHeight - mouseYOffset;

            farthestCaretPosition = (bboxHeight / 2) + _Chart.config('caretSize') - curvedRectOffset;

            if (farthestCaretPosition <= _Chart._moveY) {
              _Chart._moveY = farthestCaretPosition;
            }
          }

          //Bottom
          if (config.bottom) {
            tooltipHeight = container.height - ((_Chart._baseGroupBBox.height) / 2);
            _Chart._moveY = tooltipHeight - mouseYOffset;

            farthestCaretPosition = -(((bboxHeight) / 2) - _Chart.config('caretSize')) - curvedRectOffset;

            if (farthestCaretPosition >= _Chart._moveY) {
              _Chart._moveY = farthestCaretPosition;
            }
          }
        }
        else {
          _Chart._moveX = 0;
          _Chart._moveY = 0;
        }
      }


      /**
       * GeneratePaths
       */
      function generatePaths() {
        var w = _Chart._gBBox.width + (_Chart.config('padding') * 2);
        var h = _Chart._gBBox.height + (_Chart.config('padding') * 2);
        var c = _Chart.config('caretSize');
        var y = (h / 2) + _Chart.config('caretSize') + r;

        _Chart._topPath = {
          translate: 'translate(' + (w / 2) + ',' + (h + c + r) + ')',
          caretX: ((w / 2) - c),
          caretY: (h + (r * 2))
        };
        _Chart._topPath.path = 'm -' + (w / 2) + ' -' + (h + c + (r * 2)) +
        ' h ' + w +
        ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r +
        ' v ' + h +
        ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r +
        ' h -' + w +
        ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r +
        ' v -' + h +
        ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r +
        ' Z m ' + _Chart._topPath.caretX + ' ' + _Chart._topPath.caretY +
        ' l ' + c + ' ' + c +
        ' l ' + c + ' -' + c;

        _Chart._bottomPath = {
          translate: 'translate(' + (w / 2) + ',' + (-c + (r / 2)) + ')',
          caretX: ((w / 2) - c),
          caretY: 0
        };
        _Chart._bottomPath.path = 'm -' + (w / 2) + ' ' + 0 +
        ' h ' + w +
        ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r +
        ' v ' + h +
        ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r +
        ' h -' + w +
        ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r +
        ' v -' + h +
        ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r +
        ' Z m ' + _Chart._bottomPath.caretX + ' ' + _Chart._bottomPath.caretY +
        ' l ' + c + ' -' + c +
        ' l ' + c + ' ' + c;

        _Chart._leftPath = {
          translate: 'translate(' + (w + c + r) + ',' + (h / 2) + ')',
          caretX: (w + r),
          caretY: y
        };
        _Chart._leftPath.path = 'm -' + (w + c + r) + ' ' + -((h / 2) + r) +
        ' h ' + w +
        ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r +
        ' v ' + h +
        ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r +
        ' h -' + w +
        ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r +
        ' v -' + h +
        ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r +
        ' Z m ' + _Chart._leftPath.caretX + ' ' + _Chart._leftPath.caretY +
        ' l ' + c + ' -' + c +
        ' l -' + c + ' -' + c;

        _Chart._rightPath = {
          translate: 'translate(' + -(c + r) + ',' + (h / 2) + ')',
          caretX: -r,
          caretY: y
        };
        _Chart._rightPath.path = 'm ' + (c + r) + ' ' + -((h / 2) + r) +
        ' h ' + w +
        ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r +
        ' v ' + h +
        ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r +
        ' h -' + w +
        ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r +
        ' v -' + h +
        ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r +
        ' Z m ' + _Chart._rightPath.caretX + ' ' + _Chart._rightPath.caretY +
        ' l -' + c + ' -' + c +
        ' l ' + c + ' -' + c + ' Z';
      }

      /**
       * cloneBBox, IE will not let you modify the obj returned from getBBox
       * @param box
       * @returns {{x: *, y: *, width: *, height: *}}
       */
      function cloneBBox(box) {
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        };
      }
  }
  preDraw(){
    this._container = this.config('container');
  }
}

export default Tooltip;