/**
 * 
 */

function Archive() {
	this.nextId = 0;
	this.files = new Array();
}
Archive.prototype.parse = function(method, url, callback) {
	var xhr = new XMLHttpRequest();
	var files = this.files;
	xhr.onreadystatechange = function() {
		if (xhr.readyState == xhr.DONE) {
			
			if (xhr.status == 200 && xhr.response) {
				var start = new Date();
				var stream = new Archive.Stream(xhr.response);
				var size = stream.size();
				response = null;
				var archive = new Archive.method[method](stream);
				var entry;
				while ((entry = archive.getNextEntry()) != null) {
					files.push({
						fileName : entry.header.name,
						header : entry,
						blobData : archive.getFileData()
					});
					entry = null;
				}
				archive = null;
				stream = null;
				var end = new Date();
				var total = end - start;
				console.log("Parsing: " + total + " ms ("
						+ parseInt(1000 / total * size / 1024)
						+ " KB\/s)");
				callback();
			} else {
				console.log("Failed to download:" + xhr.status + " "
						+ xhr.statusText);
				callback("Failed to download:" + xhr.status + " "
						+ xhr.statusText);
			}
		}
	};
	// Open the request for the provided url
	xhr.open("GET", url, true);

	// Set the responseType to 'arraybuffer' for ArrayBuffer response
	xhr.responseType = "arraybuffer";

	xhr.send();
};
Archive.prototype.iterator = function() {
	var count = this.files.length;
	var files = this.files;
	return {
		next : function() {
			if ((count--) === 0)
				throw "stop-iteration";
			return files[count];
		},
		hasNext : function() {
			if (count === 0)
				return false;
			return true;
		}
	};
};
Archive.prototype.forEach = function(block, context) {
	
	var iterator = this.iterator();
	var next;
	while (true) {
		try {
			next = iterator.next();
		} catch (exception) {
			console.log(exception);
			if (exception === "stop-iteration")
				break;
			if (exception === "skip-iteration")
				continue;
			throw exception;
		}
		block.call(context, next);
	}
};
Archive.prototype.getFileData = function(name) {
	for ( var i = 0; i < this.files.length; i++) {
		if (name == this.files[i].fileName)
			return this.files[i].blobData;
	}
	return null;
};
Archive.method = {};
