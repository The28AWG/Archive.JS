/**
 * 
 */
function Archive(method, data) {
	var start = new Date();

	this.files = [];
	var stream = Archive.stream4(data);
	var size = stream.size;
	delete data;
	var archive = Archive.method[method](stream);
	var entry;
	var c = 0;
	while ((entry = archive.getNextEntry()) != null) {
		console.log(c++);
		console.log(entry.header.name);
		this.files.push({
			name : entry.header.name,
			entry : entry,
			data : archive.getFileData()
		});
		entry = null;
	}
	delete archive;
	delete stream;
	var end = new Date();
	var  total = end - start;
	console.log("Parsing: " +
    total + " ms (" +
    parseInt(1000 / total *
    		size / 1024) + " KB\/s)");
}

Archive.stream4 = function(data) {
	var BUFFER_SIZE = 2048;
	var bytesRead = 0;
	// data = Archive.Utils.UTF8.encode(data);
	console.log(data);
	var BUFFER = new Uint8Array(data);
	function read() {
		var buffer = null;
		var offset = null;
		var len = null;
		if (arguments.length == 0) {
			buffer = [];
			offset = bytesRead;
			len = 1;
		} else if (arguments.length == 1) {
			buffer = [];
			offset = bytesRead;
			len = arguments[0];
		} else {
			buffer = arguments[0];
			offset = arguments[1];
			len = arguments[2];
		}
		console.log('buffer = ' + buffer + ', offset = ' + offset + ', len = '
				+ len);
		var i = 0;

		for (i = 0; i < len && offset < BUFFER.length; i++) {
			buffer[i] = BUFFER[offset + i];
		}
		bytesRead += i;
		if (arguments.length > 1) {
			return i;
		} else {
			return buffer;
		}
	}

	return {
		read : read,
		skip : function(n) {

			console.log('START >> skip()');
			if (n <= 0) {
				return 0;
			}
			var left = n;
			while (left > 0) {
				var res = read((left < BUFFER_SIZE ? left : BUFFER_SIZE));
				if (res.length == 0) {
					break;
				}
				left -= res.length;
			}
			console.log('END >> skip(): ' + (n - left));
			return n - left;

		},
		reset : function() {
			bytesRead = 0;
		},size : BUFFER.length
	};
};

Archive.method = {};