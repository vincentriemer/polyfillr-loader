new Promise(function(resolve, reject) {
  resolve('foo');
}).then(function(res) {
  console.log(res + 'bar');
});

