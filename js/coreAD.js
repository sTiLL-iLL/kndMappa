
// adminCore.js

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
		function listHistorys(callBk) {
			var paths = [],
			xhr = new XMLHttpRequest();

			xhr.open('GET', '/ls?', true);
			xhr.responseType = 'JSON';

			xhr.onload = function() {
				if (this.status == 200) {
					paths = JSON.parse(xhr.responseText);
					console.log("paths retreived");
				}
				callBk(paths);
			};
			xhr.send({});
		}

		function getHistory(args, callBk) {
			var paths = [],
				xhr = new XMLHttpRequest();
			xhr.open('GET', '/hst?' + args, true);
			xhr.responseType = 'JSON';
			xhr.onload = function () {
				if (this.status == 200) {
					var lst = xhr.responseText.slice(0, xhr.responseText.lastIndexOf(","));
					lst = ("[" + lst + "]").toString();
					paths = JSON.parse(lst);
					console.log("paths retreived... " + JSON.stringify(paths));
				}
				callBk(paths);
			};
			xhr.send({});
		}

		function getMyHistory(callBk) {
			var paths = [],
				xhr = new XMLHttpRequest();
			xhr.open('GET', '/hst1?', true);
			xhr.responseType = 'JSON';
			xhr.onload = function () {
				if (this.status == 200) {
					var lst = xhr.responseText.slice(0, xhr.responseText.length - 1);
					lst = ("[" + lst + "]").toString();
					paths = JSON.parse(lst);
					console.log("paths retreived... " + JSON.stringify(paths));
				}
				callBk(paths);
			};
			xhr.send({});
		}
		return {
			getMyPaths: function (callBk) {
				var dfd = new Deferred();
				try {
					if (callBk) {
						getMyHistory(function (d) {
							dfd.resolve(d);
							callBk(d);
						});
					} else {
						getMyHistory(function (d) {
							dfd.resolve(d);
						});
					}
				} catch (err) {
					dfd.reject(false);
				}
				return dfd.promise;
			},
			getPaths: function (args, callBk) {
				var dfd = new Deferred();
				try {
					if (callBk) {
						getHistory(args, function (d) {
							dfd.resolve(d);
							callBk(d);
						});
					} else {
						getHistory(args, function (d) {
							dfd.resolve(d);
						});
					}
				} catch (err) {
					dfd.reject(false);
				}
				return dfd.promise;
			},
			getPathList: function (callBk) {
				var dfd = new Deferred();
				try {
					if (callBk) {
						listHistorys(function (d) {
							dfd.resolve(d);
							callBk(d);
						});
					} else {
						listHistorys(function (d) {
							dfd.resolve(d);
						});
					}
				} catch (err) {
					dfd.reject(false);
				}
				return dfd.promise;
			}
		};
	};
	(function () {
		var gmp = Object.create(gps),
			anima = gmp.Animation.DROP,
			map = {},

			mpdv = document.createElement("div"),
			markers = [],
			linez = [],
			plnz = [],
			latlng = {},
			mark = {},
			ajx = new ajax(),
			mps = mpdv.style,

			opts = {
				zoom: 17,
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
			};

		mpdv.id = "mpdv";
		function updateContext(position) {
			var cds = position.coords,
				spd = cds.speed,
				ll = cds.latitude.toString().substring(0, 6) + ", " + cds.longitude.toString().substring(0, 8),
				tt = new Date(position.timestamp).toDateString();
				tt = tt.substring(3, tt.toLowerCase().lastIndexOf("gmt"));

			document.querySelector("#spdTxt").innerText = spd = (spd || "000");
			document.querySelector("#posTxt").innerText = ll || "N/A";
			document.querySelector("#tmTxt").innerText = tt || "N/A";
			mark.title = tt + " | " + ll + " | " + spd;
			if (!mark.icon) {
				mark.setIcon("./img/mrk.png");
			}
			return;
		}

		function convertPosition(coords) {
			if (coords && !coords.latitude) {
				coords = coords.coords;
			}
			if (coords) {
				latlng = new gmp.LatLng(coords.latitude, coords.longitude);
			}
			return latlng;
		}


		function draw(position) {
			latlng = convertPosition(position.coords);
			linez.push(latlng);
			map.setCenter(latlng);

			plnz.push(new gmp.Polyline({
				map: map,
				path: linez,
				strokeColor: "#063396",
				strokeOpacity: 0.3,
				strokeWeight: 6
			}));
			
			mark.setPosition(latlng);
			updateContext(position);
		}

		function setVectors(map) {
			var i=0;
			for (i;i< plnz.length;i++) {
				markers[i].setMap(map);
				plnz[i].setMap(map);
			}
		}

		function clearVectors(func) {
			var i=0;
			for (i; i < plnz.length; ++i) {
				plnz[i].setMap(null);
			}
			func(true);
		}

		function clearVertices(func) {
			var i=0;
			for (i; i < markers.length; ++i) {
				markers[i].setMap(null);
			}
			func(true);
		}

		function resetContext(func) {
			clearVectors(function (dta) {
				//(dta)?(plnz.length = 0):dta;
				plnz.length = 0
			});

			clearVertices(function (dta) {
				markers.length = 0;
			});

			linez.length = 0;
			map = null;
			mark = null;
			
			func(true);
		}

		function configure(position, func) {
			resetContext(function (dta) {
				if (dta) {
					initialize(position, function (dt) {
						func(true);
					});
				} else {
					func(false);
				}
			});
		}

		function initialize(position, func) {
			var pcd = position.coords,
				r = document.querySelector('#rslt'),
				ttl = JSON.stringify(new Date(position.timestamp) + " | " + pcd.latitude + ", " + pcd.longitude);

			latlng = convertPosition(pcd);
			r.innerHTML = 'position:<span id="posTxt">000-000</span><span id="tmTxt"></span>';
			
			//func(true);
			
			if (mpdv.innerHTML === "") {
				document.querySelector('article').appendChild(mpdv);
			}

			opts.center = latlng;
			map = new gmp.Map(document.querySelector("#mpdv"), opts);
			map.setCenter(latlng);
			
			if (wdw.innerWidth > 500) {
				mps.height = '680px';
			}
			else {
				mps.height = '520px';
			}			

			mark = new gmp.Marker({
				position: latlng,
				map: map,
				title: ttl,
				icon: "./img/mrk.png",
				animation: anima
			});
			
			func(true);
			mark.setPosition(latlng);
		}

		function klikCBb(d) {
			return d;
		}

		function klikCBg(d) {
			if (d) {
				var to = "";
				var nd = d.sort(function (a, b) {
					var xa = new Date(a.position.timestamp),
						xb = new Date(b.position.timestamp);
					return xa - xb;
				});
				clearTimeout(to);
				configure(nd.shift(0).position, function (dta) {
					to = setTimeout(function () {
						var i = 0;
						nd.forEach(function (itm) {
							setTimeout(function () {
								draw(itm.position);
							}, i * 350);
							i++;
						});
						clearTimeout(to);
					}, 500);
				});
			}
		}

		function wenKlik(ev) {
			var txt = ev.target.text,
				w = document.querySelector("#stf"),
				lg = document.querySelector("#lgo"),
				ato = setTimeout(function() {
					wdw.scrollTo(0, wdw.innerHeight);
					clearTimeout(ato);
				},250);
			lg.style.display = "none";
			w.innerHTML = "path: " + txt + "<span id='ya'>speed: </span><span id='spdTxt'>000 </span><hr/>";
			var prms = ajx.getPaths(txt);
			prms.then(klikCBg, klikCBb);
		}

		function domInsert(lst, xp, s) {
			lst.forEach(function (itm) {
				var mp = document.createElement('li');
				mp.innerHTML = "<a href='#'>" + itm + "</a>";
				xp.appendChild(mp);
			});
			xp.addEventListener("click", wenKlik);
			s.appendChild(xp);
			
			return;
		}

		function prepare(evt) {
			var s = document.querySelector('#stats'),
				xp = document.createElement('ul'),
				gdCB = function(d) {
					domInsert(d, xp, s);
				},
				bdCB = function(d) {
					return d;
				};

			s.innerHTML = "<h1>Trace Your Tracks... </h1>";
			
			var prms = ajx.getPathList();
			prms.then(gdCB, bdCB);
			
			document.removeEventListener("click", prepare, true);
		}
		
		document.addEventListener("click", prepare, true);
		wdw.onbeforeunload = function (e) {
			setVectors(null);
			gps = gmp = map = null;
			markers = linez = null;
			plnz = latlng = mark = null;
		}
	}());
}(window, google.maps));