var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3'), require('koto')) : typeof define === 'function' && define.amd ? define(['d3', 'koto'], factory) : global.koto.Icicle = factory(global.d3, global.koto);
})(this, function (d3, koto) {
	'use strict';

	var Tooltip = (function (_koto$Base) {
		function Tooltip(selection) {
			_classCallCheck(this, Tooltip);

			_get(Object.getPrototypeOf(Tooltip.prototype), 'constructor', this).call(this, selection);
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
				this.configs.set(key, {
					value: configs[key]
				});
			}

			var formats = {
				'default': function _default(appends) {},
				text: function text(appends) {
					//Automatically position if there is only one text element appended
					if (appends[0].length === 1 && appends.node().childNodes[0].nodeName === 'text') {

						var textBBox = appends.node().childNodes[0].getBBox();

						appends.select('text').attr({
							dy: function dy() {
								return getCentralPosition(this);
							},
							y: textBBox.height / 2
						});
						appends.selectAll('tspan').attr({
							dy: function dy() {
								return getCentralPosition(this);
							},
							y: textBBox.height / 2
						});
					}
				},
				textBlock: function textBlock(appends) {

					var textElement = appends.select('text');
					var dy = textElement.node().getBoundingClientRect().height;
					d3.domoStrings.wrapText(textElement, _Chart.config('maxWidth'));

					appends.select('text').attr({
						y: dy - dy / 4
					});
				},
				textRectText: function textRectText(appends) {
					//Automatically format for text rect text pattern
					if (appends.node().childNodes.length % 2 !== 0) {

						if (isTextRectText(appends)) {
							formatAppendTextRectText(appends);
						}
					}
				}
			};

			var r = 3; //Radius to round the rect

			this._baseGroup = this.base.append('g').attr('transform', 'translate(0, 0)').style('pointer-events', 'none');

			_Chart._parent = _Chart._baseGroup.node().parentNode;

			this._baseGroup.append('path').attr('class', 'toolTipPath').style('opacity', 0.9);

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

				_Chart._baseGroup.select('.toolTipPath').attr({
					transform: _Chart._topPath.translate,
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

					baseGroup.select('.toolTipPath').attr({
						transform: posAndPathObj.translate,
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

				translateX = getPathTranslate(tooltipPositionObj.hittingRight, tooltipPositionObj.hittingLeft, tooltipPositionObj.offsetX + _Chart.config('caretSize'), 'width', containerWidth);

				translateY = tooltipPositionObj.topY;
				translate = _Chart._topPath.translate;

				if (_Chart._moveX !== 0) {
					path = updateCaretPath('_topPath', 'x');
				} else {
					path = _Chart._topPath.path;
				}

				return {
					translateX: translateX,
					translateY: translateY,
					translate: translate,
					path: path
				};
			}

			/**
    * getRightPositionAndPath
    */
			function getRightPositionAndPath(tooltipPositionObj, containerHeight) {

				var path;
				var translate;
				var translateX;
				var translateY;

				translateY = getPathTranslate(tooltipPositionObj.hittingBottom, tooltipPositionObj.hittingTop, tooltipPositionObj.centerY - _Chart.config('padding'), 'height', containerHeight);

				translateX = tooltipPositionObj.rightX;
				translate = _Chart._rightPath.translate;

				if (_Chart._moveY !== 0) {
					path = updateCaretPath('_rightPath', 'y');
				} else {
					path = _Chart._rightPath.path;
				}

				return {
					translateX: translateX,
					translateY: translateY,
					translate: translate,
					path: path
				};
			}

			/**
    * getBottomPositionAndPath
    */
			function getBottomPositionAndPath(tooltipPositionObj, containerWidth) {

				var path;
				var translate;
				var translateX;
				var translateY;

				translateX = getPathTranslate(tooltipPositionObj.hittingRight, tooltipPositionObj.hittingLeft, tooltipPositionObj.offsetX + _Chart.config('caretSize') / 2, 'width', containerWidth);

				translateY = tooltipPositionObj.bottomY + _Chart.config('padding') + 5;
				translate = _Chart._bottomPath.translate;

				if (_Chart._moveX !== 0) {
					path = updateCaretPath('_bottomPath', 'x');
				} else {
					path = _Chart._bottomPath.path;
				}

				return {
					translateX: translateX,
					translateY: translateY,
					translate: translate,
					path: path
				};
			}

			/**
    * getLeftPositionAndPath
    */
			function getLeftPositionAndPath(tooltipPositionObj, containerHeight) {
				var path;
				var translate;
				var translateX;
				var translateY;

				translateY = getPathTranslate(tooltipPositionObj.hittingBottom, tooltipPositionObj.hittingTop, tooltipPositionObj.centerY - _Chart.config('padding'), 'height', containerHeight);

				translateX = tooltipPositionObj.leftX;
				translate = _Chart._leftPath.translate;

				if (_Chart._moveY !== 0) {
					path = updateCaretPath('_leftPath', 'y');
				} else {
					path = _Chart._leftPath.path;
				}

				return {
					translateX: translateX,
					translateY: translateY,
					translate: translate,
					path: path
				};
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
					case 'top':
						{
							positionAndPath = getTopLocationsAndPath(tooltipPositionObj, containerWidth);
							break;
						}
					case 'right':
						{
							positionAndPath = getRightPositionAndPath(tooltipPositionObj, containerHeight);
							break;
						}
					case 'bottom':
						{
							positionAndPath = getBottomPositionAndPath(tooltipPositionObj, containerWidth);
							break;
						}
					case 'left':
						{
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
				} else if ((tooltipPositionObj.hittingRight || tooltipPositionObj.hittingLeft) && tooltipPositionObj.closeToTop) {
					location = 'bottom';
				} else if (tooltipPositionObj.hittingTop && tooltipPositionObj.closeToRight) {
					location = 'left';
				} else if (tooltipPositionObj.hittingTop && tooltipPositionObj.closeToLeft) {
					location = 'right';
				} else if (!tooltipPositionObj.hittingRight && tooltipPositionObj.closeToRight) {
					location = 'left';
				} else if (!tooltipPositionObj.hittingLeft && tooltipPositionObj.closeToLeft) {
					location = 'right';
				} else if (tooltipPositionObj.closeToBottom && tooltipPositionObj.closeToTop) {
					location = 'top';
				} else if (tooltipPositionObj.closeToTop) {
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

				var topY = offsetY - offsetPadding;
				var bottomY = point.y + offsetPadding;
				var centerY = point.y - rectBBox.height / 2;
				var leftX = point.x - _Chart._baseGroupBBox.width - _Chart.config('caretSize');
				var rightX = point.x + offsetPadding + 5;

				var closeToRight = point.x + _Chart._baseGroupBBox.width / 2 >= containerWidth;
				var closeToLeft = point.x - _Chart._baseGroupBBox.width / 2 <= 0;
				var closeToTop = point.y - _Chart._baseGroupBBox.height - offsetPadding - 3 <= 0;
				var closeToBottom = point.y + _Chart._baseGroupBBox.height > containerHeight;

				var hittingRight = closeToRight && point.x - _Chart._baseGroupBBox.width - offsetPadding <= 0;
				var hittingLeft = closeToLeft && point.x + _Chart._baseGroupBBox.width + offsetPadding >= containerWidth;
				var hittingTop = (closeToRight || closeToLeft) && point.y - _Chart._baseGroupBBox.height / 2 <= 0;
				var hittingBottom = (closeToRight || closeToLeft) && point.y + _Chart._baseGroupBBox.height / 2 >= containerHeight;

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
				_Chart._baseGroupBBox.height = location === 'top' || location === 'bottom' ? _Chart._gBBox.height + _Chart.config('padding') * 2 + _Chart.config('caretSize') + 6 : _Chart._gBBox.height + _Chart.config('padding') * 2 + 6;

				_Chart._baseGroupBBox.width = location === 'top' || location === 'bottom' ? _Chart._gBBox.width + _Chart.config('padding') * 2 + 6 : _Chart._gBBox.width + _Chart.config('padding') * 2 + _Chart.config('caretSize') + 6;
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
					returnVal = i % 2 === 0 && nodeName === 'text' ? true : nodeName === 'rect';
					if (!returnVal) {
						break;
					}
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
				var groupBBox = {
					x: 0,
					y: 0,
					height: 0,
					width: 0
				};

				appends.select('rect').attr('height', 0);
				groupBBox = appends.node().getBBox();

				/*jshint -W083 */
				for (var i = 0; i < appends.node().childNodes.length; i++) {
					var element = appends.node().childNodes[i];

					if (i % 2 === 0) {
						//text
						var t = appends.select('text:nth-child(' + (i + 1) + ')').attr({
							dy: function dy() {
								return getCentralPosition(this);
							},
							x: prevWidth + padding * i + 1,
							y: groupBBox.height / 2
						});

						prevWidth += element.getBBox().width;
					} else {
						//rect
						appends.select('rect:nth-child(' + (i + 1) + ')').attr({
							x: prevWidth + padding * i,
							y: 0,
							width: 1,
							height: groupBBox.height
						});
					}
				}

				appends.selectAll('tspan').attr({
					transform: function transform() {
						return 'translate(0, ' + getCentralPosition(this) + ')';
					},
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
						height: height,
						width: width
					};
				} else {
					_Chart._gBBox = _Chart._appends.node().getBBox();
				}
			}

			/**
    * Calculates vertical center for text
    * @param elem
    * @returns {number}
    */
			function getCentralPosition(elem) {
				return parseInt(d3.select(elem).style('font-size'), 10) * 0.35;
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
				} else if (hittingEdge2) {
					translate = r;
				} else {
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
				} else {
					xyString = _Chart[path].caretX + _Chart._moveX + ' ' + _Chart[path].caretY;
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

				var curvedRectOffset = 2 * r; //Compensate for the curved rect path. 1 is for good measure.

				bboxHeight = _Chart._gBBox.height; // - curvedRectOffset;
				bboxWidth = _Chart._gBBox.width; //  - curvedRectOffset;

				var farthestCaretPosition;

				if (config.left || config.right) {

					//Left
					if (config.left) {
						tooltipWidth = container.width - _Chart._baseGroupBBox.width / 2;
						_Chart._moveX = tooltipWidth - mouseXOffset;

						if (bboxWidth / 2 + _Chart.config('caretSize') <= _Chart._moveX) {
							_Chart._moveX = -(bboxWidth / 2 + _Chart.config('caretSize'));
						}
					}

					//Right
					if (config.right) {
						tooltipWidth = _Chart._baseGroupBBox.width / 2;
						_Chart._moveX = tooltipWidth - mouseXOffset;

						if (-(bboxWidth / 2 + _Chart.config('caretSize')) >= _Chart._moveX) {
							_Chart._moveX = -(bboxWidth / 2 + _Chart.config('caretSize'));
						}
					}
				} else if (config.top || config.bottom) {

					//Top
					if (config.top) {
						tooltipHeight = _Chart._baseGroupBBox.height / 2;
						_Chart._moveY = tooltipHeight - mouseYOffset;

						farthestCaretPosition = bboxHeight / 2 + _Chart.config('caretSize') - curvedRectOffset;

						if (farthestCaretPosition <= _Chart._moveY) {
							_Chart._moveY = farthestCaretPosition;
						}
					}

					//Bottom
					if (config.bottom) {
						tooltipHeight = container.height - _Chart._baseGroupBBox.height / 2;
						_Chart._moveY = tooltipHeight - mouseYOffset;

						farthestCaretPosition = -(bboxHeight / 2 - _Chart.config('caretSize')) - curvedRectOffset;

						if (farthestCaretPosition >= _Chart._moveY) {
							_Chart._moveY = farthestCaretPosition;
						}
					}
				} else {
					_Chart._moveX = 0;
					_Chart._moveY = 0;
				}
			}

			/**
    * GeneratePaths
    */
			function generatePaths() {
				var w = _Chart._gBBox.width + _Chart.config('padding') * 2;
				var h = _Chart._gBBox.height + _Chart.config('padding') * 2;
				var c = _Chart.config('caretSize');
				var y = h / 2 + _Chart.config('caretSize') + r;

				_Chart._topPath = {
					translate: 'translate(' + w / 2 + ',' + (h + c + r) + ')',
					caretX: w / 2 - c,
					caretY: h + r * 2
				};
				_Chart._topPath.path = 'm -' + w / 2 + ' -' + (h + c + r * 2) + ' h ' + w + ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r + ' v ' + h + ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r + ' h -' + w + ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r + ' v -' + h + ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r + ' Z m ' + _Chart._topPath.caretX + ' ' + _Chart._topPath.caretY + ' l ' + c + ' ' + c + ' l ' + c + ' -' + c;

				_Chart._bottomPath = {
					translate: 'translate(' + w / 2 + ',' + (-c + r / 2) + ')',
					caretX: w / 2 - c,
					caretY: 0
				};
				_Chart._bottomPath.path = 'm -' + w / 2 + ' ' + 0 + ' h ' + w + ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r + ' v ' + h + ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r + ' h -' + w + ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r + ' v -' + h + ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r + ' Z m ' + _Chart._bottomPath.caretX + ' ' + _Chart._bottomPath.caretY + ' l ' + c + ' -' + c + ' l ' + c + ' ' + c;

				_Chart._leftPath = {
					translate: 'translate(' + (w + c + r) + ',' + h / 2 + ')',
					caretX: w + r,
					caretY: y
				};
				_Chart._leftPath.path = 'm -' + (w + c + r) + ' ' + -(h / 2 + r) + ' h ' + w + ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r + ' v ' + h + ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r + ' h -' + w + ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r + ' v -' + h + ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r + ' Z m ' + _Chart._leftPath.caretX + ' ' + _Chart._leftPath.caretY + ' l ' + c + ' -' + c + ' l -' + c + ' -' + c;

				_Chart._rightPath = {
					translate: 'translate(' + -(c + r) + ',' + h / 2 + ')',
					caretX: -r,
					caretY: y
				};
				_Chart._rightPath.path = 'm ' + (c + r) + ' ' + -(h / 2 + r) + ' h ' + w + ' c 1.7 0 ' + r + ' 1.3 ' + r + ' ' + r + ' v ' + h + ' c 0 1.7 -1.3 ' + r + ' -' + r + ' ' + r + ' h -' + w + ' c -1.7 0 -' + r + ' -1.3 -' + r + ' -' + r + ' v -' + h + ' c 0 -1.7 1.3 -' + r + ' ' + r + ' -' + r + ' Z m ' + _Chart._rightPath.caretX + ' ' + _Chart._rightPath.caretY + ' l -' + c + ' -' + c + ' l ' + c + ' -' + c + ' Z';
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

		_inherits(Tooltip, _koto$Base);

		_createClass(Tooltip, [{
			key: 'preDraw',
			value: function preDraw() {
				this._container = this.config('container');
			}
		}]);

		return Tooltip;
	})(koto.Base);

	var _Tooltip = Tooltip;

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

	var _hierarchy = hierarchy;

	var Icicle = (function (_koto$Base2) {
		function Icicle(selection) {
			_classCallCheck(this, Icicle);

			_get(Object.getPrototypeOf(Icicle.prototype), 'constructor', this).call(this, selection);
			var _Chart = this;

			[{
				name: 'height',
				description: 'The height of the chart.',
				value: 700,
				type: 'number',
				units: 'px',
				category: 'Size',
				getter: function getter() {
					// get value
					console.log('getter');
					return this.value;
				},
				setter: function setter(newValue) {
					// Set something
					console.log('setter');
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
			}].forEach(function (item) {
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
			this._tooltip = new _Tooltip(this.base.append('g'));

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

		_inherits(Icicle, _koto$Base2);

		_createClass(Icicle, [{
			key: 'transform',
			value: function transform(data) {
				this.max = d3.max(data, function (row) {
					return row.length;
				});
				return _hierarchy().maxLength(this.max).entries(data);
			}
		}, {
			key: 'targetData',
			value: function targetData(data) {
				this._targetData = _hierarchy().maxLength(this.max).entries(data);

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