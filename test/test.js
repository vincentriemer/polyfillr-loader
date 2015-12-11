var assert = require('chai').assert;

describe('polyfillr', function() {
  it('should correctly polyfill es6 map', function() {
    var testMap = new Map();
    testMap.set('foo', 'bar');
    assert.equal(testMap.get('foo'), 'bar');
    assert.isTrue(testMap.has('foo'));
    assert.equal(testMap.size, 1);
  });

  it('should correctly polyfill es6 array', function() {
    var testArray = Array.of('foo', 'bar');
    assert.deepEqual(testArray, ['foo', 'bar']);
    assert.deepEqual(Array.from(testArray.keys()), [0, 1]);
    assert.deepEqual(Array.from(testArray.values()), ['foo', 'bar']);
    assert.deepEqual(Array.from(testArray.entries()), [[0, 'foo'], [1, 'bar']]);
    assert.equal(testArray.find(function(x) { return x === 'foo' }), 'foo');
    assert.deepEqual(['a', 'b', 'c'].fill(7), [7, 7, 7]);
  });

  it('should correctly polyfill es6 set', function() {
    var testSet = new Set();
    testSet.add('foo');
    testSet.add('bar');
    assert.isTrue(testSet.has('foo'));
    assert.equal(testSet.size, 2);
  });

  it('should correctly polyfill es6 promise', function(done) {
    new Promise(function(resolve) {
      resolve('foo');
    }).then(function(res) {
      assert.equal(res, 'foo');
      done();
    });
  });

  it('should correctly polyfill es6 math', function() {
    assert.equal(Math.round(Math.sinh(Math.asinh(1))), 1);
  });

  it('should correctly polyfill es6 object', function() {
    var test1 = { foo: 'bar' };
    var test2 = { test: 'ing' };
    var expected = { foo: 'bar', test: 'ing' };

    Object.assign(test1, test2);

    assert.deepEqual(test1, expected);
  })
});

mocha.run();

