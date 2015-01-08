// routing table  - index.js

var router = require('./router.js'), requestHandlers = require('./requestHandlers.js'), webServer = require('./clusterServer.js'),  handle = {};
handle["/"] = handle["/css/stylz.css"] = handle["/img/logo.gif"] = handle["/img/mrk.png"] = handle["/img/lodr.gif"] = handle["/js/mmg.js"] = handle["/js/gmpz.js"] = handle["/js/coreAD.js"] = handle["/js/core.js"] = handle["/ka1"] = handle["/admin1"] = handle["/finder"] = handle["/kadmin1.html"] = handle["/index.html"] = requestHandlers.start;
	handle["/favicon.ico"] = requestHandlers.favicon;
    handle["/ping"] = requestHandlers.ping;
    handle["/pos"] = requestHandlers.report;
	handle["/ls"] = requestHandlers.list;
	handle["/hst"] = requestHandlers.hst;
	handle["/hst1"] = requestHandlers.hst1;

webServer.startWebServer(router, handle);
