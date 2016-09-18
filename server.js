var app = require('./app')
var spdy = require('spdy')
var fs = require('fs')

var options = {
  key: fs.readFileSync('key.pem')
, cert: fs.readFileSync('cert.pem')
}
var http = require('spdy').createServer(options, app)
//var io = require('./lib/sockets').listen(http)
var server = http
var debug = require('debug')('temp:server')
//var http = require('http2');
var port = normalizePort(process.env.PORT || '3000')
console.log('Listening on port:', port)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

