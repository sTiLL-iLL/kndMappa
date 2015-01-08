
//cluster server

var clusters = require('cluster'),
	signalCaster = require("./signals").Signals,
	port = 8080,
    http = require('http'),
	routingLogic = null,
    CPUs = require('os').cpus().length,
    fs = require('fs-extra'),
	url = require('url');
	
function sw(router, handle) {
	
	routingLogic = router.routeRequest;
	function onRequest(request, response) {
		var namedPath = url.parse(request.url).pathname;
		return routingLogic(handle, namedPath, request, response);   
	}
	process.on('unhandledException', function (err) {
		console.log(err);
	});
	signalCaster.signaled("event!", function(dta) {
		return console.log("signal message: " + dta);
	});
	
	if (clusters.isMaster) {
		for (var i = 0; i < CPUs; i++) {
			clusters.fork();
		}
		clusters.on('fork', function (worker) {
			console.log('worker process forked...' + worker.id);
		});
		clusters.on('listening', function (worker, address) {
			console.log("worker connection: " + address.address + ":" + address.port);
		});
		clusters.on('disconnect', function (worker) {
			console.log('a worker died, spawning replacement thread in 3 seconds...');
			setTimeout(function() {
				clusters.fork();
			});
		});
		clusters.on('exit', function (worker, code, signal) {
			console.log('worker ' + worker.process.pid + ' died');
		});
	}
	else {
		console.log("starting webServer on port:" + port);
		var server = http.createServer(onRequest);
		server.listen(port);
		//server.listen(8080, '0.0.0.0');
	}
}

exports.startWebServer = function (r, h) {
    return sw(r, h);
}
