
//  core.js

(function (wdw, gps) {
	this.Promise = function () {
		return {
			status: 'pending',
			error: null,
			posCBKs: [],
			negCBKs: [],
			then: function (posCBK, negCBK) {
				var defer = new Deferred();
				posCBK = (!posCBK)? function(d){d = (d || true); return d;}:posCBK;
				negCBK = (!negCBK)? function(d){d = (d || true); return d;}:negCBK;
				this.posCBKs.push({
					func: posCBK,
					deferred: defer
				});				
				this.negCBKs.push({
					func: negCBK,
					deferred: defer
				});
				if (status === 'resolved') {
					this.execAction({
						func: posCBK,
						deferred: defer
					}, this.data);
				}
				else if (status === 'rejected') {
					this.execAction({
						func: negCBK,
						deferred: defer
					}, this.error);
				}
				return defer.promise;
			},
			execAction: function (callbackData, result) {
				wdw.setTimeout(function () {
					var res = callbackData.func(result);
					if (res instanceof Promise) {
						callbackData.deferred.bind(res);
					}
					else {
						callbackData.deferred.resolve(res);
					}
				}, 0);
			}
		};
	};
	this.Deferred = function () {
		return {
			promise: new Promise(),
			resolve: function (data) {
				var pms = this.promise;
				pms.data = data;
				pms.status = 'resolved';
				if (pms.posCBKs) {
					pms.posCBKs.forEach(function (dta) {
						pms.execAction(dta, data);
					});
				}
			},
			reject: function (err) {
				var pms = this.promise;
				pms.error = err;
				pms.status = 'rejected';
				if (pms.negCBks) {
					pms.negCBKs.forEach(function (dta) {
						pms.execAction(dta, err);
					});
				}
			},
			bind: function (promise) {
				var slf = this;
				promise.then(function (dta) {
					slf.resolve(dta);
				}, function (err) {
					slf.reject(err);
				});
			}
		};
	};
	this.ajax = function () {
		function doReports(position) {
			var dfd = new Deferred();
			try {				
				var xhr = new XMLHttpRequest(),
					url = '/pos?' + JSON.stringify(position);
				xhr.open('GET', url, true);
				xhr.setRequestHeader('Accept', 'application/json');
				xhr.onerror = function (err) {
					dfd.reject(err);
					console.log("error: " + err);
				};
				xhr.send({});
				dfd.resolve(true);
			} catch (er) {
				console.log("error: " + er);
				dfd.reject(err);
			}
			return dfd.promise;
		}
		return {
			report: function (args) {
				var dfd = new Deferred();
				doReports(args).then(function (d) {
					dfd.resolve(d);
				}, function (d) {
					dfd.reject(d);												
				});
				return dfd.promise;					
			}
		}
	};
	(function () {
		var gmp = Object.create(gps),
			opts = {
				zoom: 18,
				center: latlng,
				tilt: 45,
				panControl: true,
				zoomControl: true,
				overviewMapControl: true,
				scaleControl: true,
				mapTypeControl: true,
				navigationControlOptions: {
					style: gmp.NavigationControlStyle.DEFAULT
				},
				mapTypeId: gmp.MapTypeId.HYBRID
			},

			map = {},
			mark = {},
			latlng = {},
			now = getNow(),
			watch = {},
			ajx = new ajax();
		
		function update(position) {
			var cds = position.coords,
				spd = cds.speed, 
				ll = cds.latitude.toString().substring(0, 6) + ", " + cds.longitude.toString().substring(0, 8),
				tt = new Date(position.timestamp).toString();
			tt = tt.substring(3, tt.toLowerCase().lastIndexOf("gmt"));
			
			document.querySelector("#spdTxt").innerText = spd = (spd || "000");
			document.querySelector("#posTxt").innerText = ll || "N/A";
			mark.title = tt + " | " + ll + " | " + spd;
			return;
		};
		
		function report(position) {
			ajx.report(position).then(function (d) {
				console.log("ping! " + d);
			}, function (d) {
				console.log("error! " + d);
			});
		};

		function onPing(position) {
			try {
				if (position) {
					var cds = position.coords;
					latlng = convertPosition(cds);
					report(position);
					update(position);
				}
				
				if (!latlng) {
					return;
				}
				
				map.setCenter(latlng);
				mark.setPosition(latlng);
			} 
			catch (err) {
				console.log("error... " + err);
			}
		};
		
		function convertPosition(coords) {
			if (!coords) {
				if (latlng) {
					return latlng;
				} 
				else {
					return;
				}
			}
			latlng = new gmp.LatLng(coords.latitude, coords.longitude);
			return latlng;
		};
		
		function configListener(arg) {		
			if (arg) {
				wdw.onbeforeunload = function (e) {
					navigator.geolocation.clearWatch(watch);
				}
			}
			document.querySelector('#admnBtn').addEventListener("click", function (evt) {
				location.href = "/admin1";
			});
		};
		
		function initialPing(position) {
			var dfd = new Deferred();
			if (!position) {
				dfd.reject(false);
			}
			else {
				var pcd = position.coords,
					s = document.querySelector('#status'),
					mpdv = document.createElement('div'),
					ttl = ((now = getNow()) + " + / - " + pcd.accuracy + " meters");
				
				mpdv.id = 'mpdv';
				opts.center = convertPosition(pcd);
				var mps = mpdv.style;
				report(position);
				s.innerHTML = '<span style="margin-left: 20px;">position: </span><span id="posTxt" style="margin-left: 0; width: 110px;">000, 000</span>'+
					'<span>speed: </span><span id="spdTxt" style="margin-left: 0; width: 100px;">000</span>';
				s.className = "success";
				configListener();
				
				if (wdw.innerWidth > 520) {
					mps.height = '720px';
				} 
				else {
					mps.height = '552px';
				}
				
				document.querySelector('article').appendChild(mpdv);
				map = null;
				map = new gmp.Map(document.getElementById("mpdv"), opts);
				map.setCenter(latlng);	
				mark = new gmp.Marker({
					position: latlng,
					map: map,
					title: ttl,
					icon: "/img/mrk.png"
				});
				
				update(position);
				dfd.resolve(true);
			}
			return dfd.promise;
		};
		
		function getNow() {
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			function pad(n) {
				return n < 10?'0' + n.toString(10):n.toString(10);
			}			;
			
			function sp() {
				var d = new Date();
				return [
					d.getDate(),
					months[d.getMonth()]
					, [pad(d.getHours())
					, pad(d.getMinutes())
					, pad(d.getSeconds())
					, (d.getTime() + "")
					.substr(-4, 4)
					].join(':')]
					.join(' ');
				}	
			return sp();
		};
			
		var ops = {
			enableHighAccuracy: true
		};
			
		function error(msg) {
			var s = document.querySelector('#status');
			s.innerHTML = (typeof msg == 'string')?msg:"you're a complete failure";
			s.className = 'fail';
		};
		
		function gCBK(func) {
			configListener(true);
			if (func) {
				func();
			}
		};
		
		function bCBK(func) {
			if (func && !watch) {
				func();
			}
		};
		
		function mkWatch() {
			watch = navigator.geolocation.watchPosition(onPing, error, ops);
		};
		
		function start(position) {
			initialPing(position).then(gCBK(mkWatch), bCBK(begin));																												
		};
		
		function begin() {
			navigator.geolocation.getCurrentPosition(start, error, ops);
		};
		
		if (navigator.geolocation) {
			begin();
		}
		else {
			alert('your browser wont do this. sorry you suck so bad...');
		}

	}());
}(window, google.maps));