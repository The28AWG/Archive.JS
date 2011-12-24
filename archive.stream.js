/**
 * 
 */
Archive.Stream = function(data) {
	this.BUFFER_SIZE = 2048;
	this.BUFFER = new Uint8Array(data);
	data = null;
	this.bytesRead = 0;
};
Archive.Stream.prototype.read = function() {
	var buffer = null;
	var offset = null;
	var len = null;
	if (arguments.length == 0) {
		buffer = [];
		offset = this.bytesRead;
		len = 1;
	} else if (arguments.length == 1) {
		buffer = [];
		offset = this.bytesRead;
		len = arguments[0];
	} else {
		buffer = arguments[0];
		offset = arguments[1];
		len = arguments[2];
	}
	var i = 0;

	for (i = 0; i < len && offset < this.BUFFER.length; i++) {
		buffer[i] = this.BUFFER[offset + i];
	}
	this.bytesRead += i;
	if (arguments.length > 1) {
		return i;
	} else {
		return buffer;
	}
};
Archive.Stream.prototype.skip = function(n) {
	if (n <= 0) {
		return 0;
	}
	var left = n;
	while (left > 0) {
		var res = this
				.read((left < this.BUFFER_SIZE ? left : this.BUFFER_SIZE));
		if (res.length == 0) {
			break;
		}
		left -= res.length;
	}
	return n - left;

};
Archive.Stream.prototype.reset = function() {
	this.bytesRead = 0;
};
Archive.Stream.prototype.size = function() {
	return this.BUFFER.length;
};