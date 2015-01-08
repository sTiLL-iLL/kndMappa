
// kach.js

var signalCaster = require("./signals").Signals,
	fs = require('fs-extra'),
	url = require("url"),
	path = require("path"),
	config = {
		cache: [], 
		cachedFilesMaximum: function (maxFiles) {
			var f = maxFiles || 500;
			return f;
		},
		cacheInterval: function (interval) {
			var v = interval || 1550; // 1/2 hour
			return v;
		}, 
		mimeTypes: {
			".txt": "text/plain",
			".css": "text/css",
			".js": "text/javascript",
			".htm": "text/html",
			".html": "text/html",
			".jpeg": "image/jpeg",
			".jpg": "image/jpeg",
			".png": "image/png",
			".gif": "image/gif",
			".ico": "image/x-icon",
			".xml": "text/xml",
			".rss": "application/rss+xml",
			".json": "application/json",
			".zip": "application/zip, application/octet-stream",
			".rar": "application/x-rar-compressed, application/octet-stream",
			".exe": "application/octet-stream",
			".mp4": "video/mp4",
			".flv": "video/x-flv",
			".m3u8": "application/x-mpegURL",
			".ts":	"video/MP2T",
			".3gp":	"video/3gpp",
			".mov": "video/quicktime",
			".avi":	"video/x-msvideo",
			".wmv":	"video/x-ms-wmv"
		}
};

function st(interval, fileMax) {
	config.cacheInterval(interval);
	config.cachedFilesMaximum(fileMax);

	setInterval(function(){
		for (var pth in config.cache) {
			performCacheAssessment(pth);
		}
	}, config.cacheInterval());
}

function addToCache(fPth, dta){
	if(config.cache.length < config.cachedFilesMaximum()) {
		config.cache[fPth]={
			data: dta,
			mtime: 0
		};
	}
}

function performCacheAssessment(pth) {
	fs.stat(pth, function(err, sts){   
		if(!err){
			if(config.cache[pth].mtime != sts.mtime.getTime()){
				fs.readFile(pth, function(err, dta){
					if(!err){
						config.cache[pth].data = dta;
						config.cache[pth].mtime = sts.mtime.getTime();
					}
				});
			}    
		}
	});
}

function srv(pnm, request, response) {
	var fn =  path.basename(pnm),
		xt = path.extname(request.url),
		dn = path.dirname(request.url),
		fPth = path.join(__dirname+dn, fn);
	
	if(config.cache[fPth] !== undefined) {
		response.writeHead(200, { "Content-Type": config.mimeTypes[xt] });
		response.end(config.cache[fPth].data);
		signalCaster.signal("event!", fPth + ": served from the cache...");
	} 
	else {
		fs.readFile(fPth, function(err, dta){
			if(!err){
				addToCache(fPth, dta, config.mimeTypes[xt]);
				signalCaster.signal("event!", fPth + ": served from the disk...");
				response.writeHead(200, {"Content-Type":config.mimeTypes[xt]});
				response.end(dta);
				signalCaster.signal("event!", fPth + ": placed in cache...");
			}
			else{
				response.writeHead(404, {"Content-Type": "text/html"});
				response.end("file aint here... Sorry you suck.")
				console.log(err);
			}
		});
	}
	return;
}

exports.startCache = function(i, m) {
	st(i,m);
	return srv
}