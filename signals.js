
// SignalsBest2.js   8;]

var Signals = (function () {
	'use strict';
	var sigCache = {}, singleRtnVal = false, 
		received = function (eventName, func) {
			return wen(eventName, function (evnt) {
				return func(evnt);
			});
		}, 
		dropReceivers = function (eventName, func) {
			if (eventName && func && typeof func === "function") {
				dropReceiver(eventName, func);
				return this;
			}
			if (!eventName) {
				sigCache = {};
				return this;
			}
			if (sigCache && sigCache[eventName]) {
				sigCache[eventName] = null;
			}
			return this;
		}, 
		setSingleRV = function (val) {
			singleRtnVal = val;
			return this;
		}, 
		getSingleRV = function () {
			if (receivers.hasOwnProperty('singleRtnVal')) {
				return singleRtnVal;
			} 
			else {
				return true;
			}
		}, 
		dropReceiver = function (eventName, func) {
			if (sigCache && sigCache[eventName]) {
				var sigLst = sigCache[eventName];
				if (isAry(sigLst)) {
					var idx = -1;
					for (var i = 0, l = sigLst.length; i < l; i++) {
						if (sigLst[i] === func || (sigLst[i].receiver && sigLst[i].receiver === func)) {
							idx = i;
							break;
						}
					}
					if (idx < 0) {
						return this;
					}
					sigLst.splice(idx, 1);
					if (!sigLst.length) {
						delete sigCache[eventName];
					}
				} 
				else if (sigLst === func || (sigLst.receiver && sigLst.receiver === func)) {
					delete sigCache[eventName];
				}
			}
			return this;
		}, 
		signalOnce = function (eventName, func) {
			setSingleRV(true);
			var slf = this,
				onit = function () {
					dropReceiver(eventName, onit);
					func.apply(slf, arguments);
				};
			onit.receiver = func;
			wen(eventName, onit);
			return this;
		}, 
		castSignal = function (eventName, args) {
			var recvrLst = receiverObjects(eventName), 
				k = {}, recvr = [],
				i = 0, rspns = {};
			for (k in recvrLst) {
				if (recvrLst.hasOwnProperty(k)) {
					i = recvrLst[k].length;
					while (i--) {
						recvr = recvrLst[k][i];
						if (recvr.signalOnce === true) {
							dropReceiver(eventName, recvr);
						}
						rspns = recvr.call(this, args || arguments || []);
						if (rspns === getSingleRV()) {
							dropReceiver(eventName, recvr);
						}
					}
				}
			}
			return this;
		};
	
	function isAry(obj) {
		return (obj.constructor === Array);
	};
	function receiverObjects(eventName) {
		var recvrLst = receivers(eventName), rspns;
		if (isAry(recvrLst)) {
			rspns = {};
			rspns[eventName] = recvrLst;
		}
		return rspns || recvrLst;
	};
	function receivers(eventName) {
		if (!sigCache) {
			sigCache = {};
		}
		if (!sigCache[eventName]) {
			sigCache[eventName] = [];
		}
		if (!isAry(sigCache[eventName])) {
			sigCache[eventName] = [sigCache[eventName]];
		}
		return sigCache[eventName];
	};
	function wen(eventName, func) {
		if (!sigCache) {
			sigCache = {};
		}
		if (!sigCache[eventName]) {
			sigCache[eventName] = func;
		} 
		else if (isAry(sigCache[eventName])) {
			sigCache[eventName].push(func);
		} 
		else {
			sigCache[eventName] = [sigCache[eventName], func];
		}
		return this;
	};
	return {
		signal: castSignal,
		signaled: received,
		receive: received,
		receiveOnce: signalOnce,
		receivers: receivers,
		dropReceivers: dropReceivers
	};
}());

exports.Signals = Signals;
