# simplerest
Simple express wrapper in nodejs

# Installation
```
npm install github:becksebenius/simplerest
```

# Usage
Most of the usage should refer to the express documentation.

This wrapper simplifies callbacks and provides some baseline application restrictions.

```
var simplerest = require('simplerest');
var rest = new simplerest();

rest.onGet('/some_path', function (context) {
	context.result.success('Hello World')
})

rest.start(8800);
```