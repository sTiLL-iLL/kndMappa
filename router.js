
// router.js

function rr(handlers, pathName, request, response) {
	
	if (typeof handlers[pathName] === "function") {
		return handlers[pathName](pathName, request, response);
	}
	var paths = pathName.split("/");
	if (typeof handlers[paths[1]] === "function") {
		return handlers[paths[1]](pathName, request, response);
	}
	else {
		response.writeHead(404, { "Content-Type": "text/html" });
		response.write("404 Not found");
		response.end();
		return console.log("handler not found for:  " + pathName);
	}
}

exports.routeRequest = function (h,p,rq,rp) {
	return rr(h,p,rq,rp);
}
