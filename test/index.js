new Promise(function(resolve, reject) {
  resolve('ES6 Promise works!');
}).then(function(res) {
  console.log(res);
});

var testMap = new Map();
testMap.set('foo', 'ES6 Map works!');
console.log(testMap.get('foo'));

var testArray = Array.of('ES6', 'Array', 'works!');
console.log(testArray.join(' '));

