
// requestHandlers.js

var signalCaster = require("./signals").Signals,
	skrblz = require("./scribbles"), fs = require('fs-extra'),
	url = require("url"), path = require("path"),
	kch = require("./kach"), flag = false, list = [],
	proxyServe = function(){};

signalCaster.signaled("saved", function(dta) {
	return console.log("signal message: itm saved: " + dta);
});

var clnt = "",
	fileName = function () {
		if (clnt !== "") {
			console.log("xxx- "+clnt);
			return ("./logs/"+clnt+".json");
		}
		return null;
};

function gl(pthNm, request, response) {
	clnt = (request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress;
	var getFiles = function(func) {
		var _files = [],
			name = null,
			files = fs.readdirSync("./logs/");
		for(var i in files) {
			name = files[i];
			_files.push(name);
		}
		func(_files);	
	};
	getFiles(function(dta) {
		response.writeHead(200, { "Content-Type": "application/json" });
		response.end(JSON.stringify(dta));
	});
	return;
}


function gh1(pthNm, request, response) {
	clnt = (request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress;
	forwardStrm(clnt+".json", response);
}


function gh(pthNm, request, response) {
	clnt = decodeURIComponent(url.parse(request.url).search.toString().substring(1));
	forwardStrm(clnt, response);
}


function forwardStrm(clt, response) {
	response.writeHead(200, { "Content-Type": "application/json" });
	var strm = fs.createReadStream("./logs/"+clnt);	
	strm.on("open", function() {
		strm.pipe(response);
	});
	strm.on("error", function(err) {
		response.end("error: " + err);
		return;
	});
}



function st(pthNm, request, response) {
	clnt = (request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress;
	if (!flag) {
		proxyServe = kch.startCache();
		flag = true;
	}
	if(pthNm == "/"||pthNm.toLowerCase().lastIndexOf("finder")!==-1) {
		pthNm = "/index.html";
	}
	else if(pthNm.toLowerCase().lastIndexOf("ka1")!==-1||pthNm.toLowerCase().lastIndexOf("admin1")!==-1) {
		pthNm = "/kadmin.html";
	}
	proxyServe(pthNm, request, response);
	return;
}



function pg(pthNm, request, response) {
	clnt = (request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress;
	response.write("pong");	
	response.end("..in your butt hole");
	return;
}



function sortAndWrite() {
	if(list.length>0) {
		var tt = list.sort(function(a, b) {
			var xa = new Date(a.timestamp),
				xb = new Date(b.timestamp);
			 	return xa - xb;
		});
		tt.forEach(function(itm) {
			skrblz(fileName()).scribble(itm+",");
			signalCaster.signal("event!", "history item saved: " + itm);
		});
		list.length = 0;
	}
	return;
}

function sp(pthNm, request, response)  {
	var args = null, argza = null;
		clnt = (request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress;
	try {
		args = decodeURIComponent(url.parse(request.url).search.toString().substring(1));
		argza = '{"ip":'+JSON.stringify(clnt)+', "pos":'+args+'}';
		var cx = JSON.parse(args);
		if(list.indexOf(argza)===-1) {
			list.push(argza);
			signalCaster.signal("event!", "position: " + argza);
		} 
	} 
	catch(err) {
		console.log("data error: " + err);
	}
	response.end();
	return;
}


signalCaster.receiveOnce("fvico", function(dta) {
	console.log("favicon served");
	var response = dta, rs = null;
	try {
		response.writeHead(200, { "Content-Type": "image/x-icon" });
		rs = fs.createReadStream("favicon.ico");
		rs.on("open", function() {
			rs.pipe(response);
		});
		rs.on("error", function(err) {
			response.end("error: " + err);
			return;
		});
	}
	catch(er) {
		rs.end();
		response.end("error: " + er);
	}
});

function fv(pthNm, request, response)  {
	clnt = (request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress;
	signalCaster.signal("fvico", response);
}

function rb(pthNm, request, response) {
	response.writeHead(200, { "Content-Type": "text/xml" });
	response.end();
	return;
}


setInterval(function() {
	sortAndWrite();
},15000);


exports.robot = function(p,r,s) {
	return rb(p,r,s);
}
exports.report = function(p,r,s) {
	return sp(p,r,s);
}
exports.hst1 = function(p,r,s) {
	return gh1(p,r,s);
}
exports.hst = function(p,r,s) {
	return gh(p,r,s);
}
exports.list = function(p,r,s) {
	return gl(p,r,s);
}
exports.ping = function(p,r,s) {
	return pg(p,r,s);
}
exports.start = function(p,r,s) {
	return st(p,r,s);
}
exports.favicon = function(p,r,s) {
	return signalCaster.receiveOnce(fv(p,r,s));
}
