import KotoIcicle from '../../src/chart';

describe('#koto-icicle', function () {
  beforeEach(function () {
    this.myChart = new KotoIcicle(d3.select('#svg'));
  });
  
  it('should exist', function () {
    expect(this.myChart).to.exist;
  });

  it('should be instance of Koto', function () {
    expect(this.myChart).to.be.instanceof(Koto);
  });
});
