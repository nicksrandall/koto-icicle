export default [{
  name: 'height',
  description: 'The height of the chart.',
  value: 700,
  type: 'number',
  units: 'px',
  category: 'Size',
  getter: function (){
    // get value
    // console.log('getter');
    return this.value;
  },
  setter: function (newValue){
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