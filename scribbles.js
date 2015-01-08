

var fs = require('fs'),
	path = require('path'),
	scribe = null,
	canWrite = true,
	roster = [],
	scribblesQue = {};

function Scribbles(file) {
  this.fPath = file;
  this.react = null;
}

scribe = Scribbles.prototype;
scribe.scribble = function(data, reaction) {
	var proceed = function () {
		canWrite = true;
		if (proceed) {
			var dta = proceed;
			proceed = null;
			scribble(dta);
		}
	},
	react = function(err, data, proceed) {
		if (err) {
			throw err;
		}
		proceed();
	},
	assign = function(reaction) {
		this.react = reaction;
		return this;
	};
	
	if (!this.canWrite) {
		proceed = data;
		if (reaction) {
			this.roster.push(reaction);
		}
		return this;
	}
	else {
		var lazyfunc = null,
			slf = this;
		canWrite = false;
		fs.appendFile(slf.fPath, data, function(err) {
			proceed();
			react(err, data, proceed); 
			while (lazyfunc = roster.shift()) {
				lazyfunc(err);
			}
			if (reaction){
				reaction(err);
			}
		});
	}
	return this;
};

module.exports = function(fileName) {
  var fnm = path.resolve(fileName);
  return scribblesQue[fnm] = scribblesQue[fnm] || new Scribbles(fileName);
}
