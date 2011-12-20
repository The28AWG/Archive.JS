/**
 * 
 */
if (!Archive) {
	throw "Archive not defined";
}
(function() {
	Archive.Utils = {
		UTF8 : {
			encode : function(string) {
				// string = string.replace(/\r\n/g,"\n");
				var utftext = "";
				for ( var n = 0; n < string.length; n++) {
					var c = string.charCodeAt(n);
					if (c < 128) {
						utftext += String.fromCharCode(c);
					} else if ((c > 127) && (c < 2048)) {
						utftext += String.fromCharCode((c >> 6) | 192);
						utftext += String.fromCharCode((c & 63) | 128);
					} else {
						utftext += String.fromCharCode((c >> 12) | 224);
						utftext += String.fromCharCode(((c >> 6) & 63) | 128);
						utftext += String.fromCharCode((c & 63) | 128);
					}
				}
				return utftext;
			},
			decode : function(utftext) {
				var string = "";
				var i = 0;
				var c = c1 = c2 = 0;
				while (i < utftext.length) {
					c = utftext.charCodeAt(i);
					if (c < 128) {
						string += String.fromCharCode(c);
						i++;
					} else if ((c > 191) && (c < 224)) {
						c2 = utftext.charCodeAt(i + 1);
						string += String.fromCharCode(((c & 31) << 6)
								| (c2 & 63));
						i += 2;
					} else {
						c2 = utftext.charCodeAt(i + 1);
						c3 = utftext.charCodeAt(i + 2);
						string += String.fromCharCode(((c & 15) << 12)
								| ((c2 & 63) << 6) | (c3 & 63));
						i += 3;
					}
				}
				return string;
			}
		}
	};
	Archive.method["TAR"] = function(stream) {
		var constant = {
			NAMELEN : 100,
			MODELEN : 8,
			UIDLEN : 8,
			GIDLEN : 8,
			SIZELEN : 12,
			MODTIMELEN : 12,
			CHKSUMLEN : 8,
			// public static final byte
			LF_OLDNORM : '0',

			/*
			 * File Types
			 */
			// public static final byte
			LF_NORMAL : '0',
			// public static final byte
			LF_LINK : '1',
			// public static final byte
			LF_SYMLINK : '2',
			// public static final byte
			LF_CHR : '3',
			// public static final byte
			LF_BLK : '4',
			// public static final byte
			LF_DIR : '5',
			// public static final byte
			LF_FIFO : '6',
			// public static final byte
			LF_CONTIG : '7',

			/*
			 * Ustar header
			 */

			MAGICLEN : 8,
			/**
			 * The magic tag representing a POSIX tar archive.
			 */
			// public static final String
			TMAGIC : "ustar",

			/**
			 * The magic tag representing a GNU tar archive.
			 */
			// public static final String
			GNU_TMAGIC : "ustar  ",

			UNAMELEN : 32,
			GNAMELEN : 32,
			DEVLEN : 8,
			DATA_BLOCK : 512,
			HEADER_BLOCK : 512
		};
		var header = null;

		function parseName(header, offset, length) {
			var result = [];

			var end = offset + length;
			for ( var i = offset; i < end; ++i) {
				if (header[i] == 0)
					break;
				result.push(String.fromCharCode(header[i]));
			}

			return Archive.Utils.UTF8.decode(result.join(''));
		}
		function parseOctal(header, offset, length) {
			var result = 0;
			var stillPadding = true;

			var end = offset + length;
			for ( var i = offset; i < end; ++i) {
				if (header[i] == 0)
					break;
				if (header[i] == ' '.charCodeAt(0)
						|| header[i] == '0'.charCodeAt(0)) {
					if (stillPadding)
						continue;

					if (header[i] == ' '.charCodeAt(0))
						break;
				}

				stillPadding = false;

				result = (result << 3) + (header[i] - '0'.charCodeAt(0));

			}

			return result;
		}
		function parseTarHeader(bh) {
			header = {};
			var offset = 0;
			header.name = parseName(bh, offset, constant.NAMELEN);
			offset += constant.NAMELEN;
			console.log('parseTarHeader(): header.name=' + header.name);

			header.mode = parseOctal(bh, offset, constant.MODELEN);
			offset += constant.MODELEN;
			console.log('parseTarHeader(): header.mode=' + header.mode);

			header.userId = parseOctal(bh, offset, constant.UIDLEN);
			offset += constant.UIDLEN;
			console.log('parseTarHeader(): header.userId=' + header.userId);

			header.groupId = parseOctal(bh, offset, constant.GIDLEN);
			offset += constant.GIDLEN;
			console.log('parseTarHeader(): header.groupId=' + header.groupId);

			header.size = parseOctal(bh, offset, constant.SIZELEN);
			offset += constant.SIZELEN;
			console.log('parseTarHeader(): header.size=' + header.size);

			header.modTime = parseOctal(bh, offset, constant.MODTIMELEN);
			offset += constant.MODTIMELEN;
			console.log('parseTarHeader(): header.modTime=' + header.modTime);

			header.checkSum = parseOctal(bh, offset, constant.CHKSUMLEN);
			offset += constant.CHKSUMLEN;
			console.log('parseTarHeader(): header.checkSum=' + header.checkSum);

			header.linkFlag = String.fromCharCode(bh[offset++]);
			console.log('parseTarHeader(): header.linkFlag=' + header.linkFlag);

			header.linkName = parseName(bh, offset, constant.NAMELEN);
			offset += constant.NAMELEN;
			console.log('parseTarHeader(): header.linkName=' + header.linkName);

			header.magic = parseName(bh, offset, constant.MAGICLEN);
			offset += constant.MAGICLEN;
			console.log('parseTarHeader(): header.magic=' + header.magic);

			header.userName = parseName(bh, offset, constant.UNAMELEN);
			offset += constant.UNAMELEN;
			console.log('parseTarHeader(): header.userName=' + header.userName);

			header.groupName = parseName(bh, offset, constant.GNAMELEN);
			offset += constant.GNAMELEN;
			console.log('parseTarHeader(): header.groupName='
					+ header.groupName);

			header.devMajor = parseOctal(bh, offset, constant.DEVLEN);
			offset += constant.DEVLEN;
			console.log('parseTarHeader(): header.devMajor=' + header.devMajor);

			header.devMinor = parseOctal(bh, offset, constant.DEVLEN);
			console.log('parseTarHeader(): header.devMinor=' + header.devMinor);
			var data = new Array();
			for ( var i = offset; i < bh.length; i++) {
				data.push(String.fromCharCode(bh[i]));
			}

			console.log((512 - data.length) == offset);
		}
		function skipPad(skipSize) {

			console.log('START >> skipPad(): skipSize=' + skipSize);
			if (skipSize > 0) {
				var extra = skipSize % constant.DATA_BLOCK;

				if (extra > 0) {
					var bs = 0;
					while (bs < constant.DATA_BLOCK - extra) {
						var res = stream.skip(constant.DATA_BLOCK - extra - bs);
						if (res == 0)
							break;
						bs += res;
					}
					console.log('LOG >> skipPad(): bs=' + bs + ' extra:'
							+ extra);
				}
			}
			console.log('END >> skipPad(): skipSize=' + skipSize);
		}
		return {
			getNextEntry : function() {
				var bh = new Array();
				var theader = new Array();
				var tr = 0;
				// Read full header
				while (tr < constant.HEADER_BLOCK) {
					theader = stream.read(constant.HEADER_BLOCK - tr);
					if (theader.length == 0) {
						break;
					}
					bh = bh.concat(theader);
					tr += theader.length;
					theader = [];
				}

				// Check if record is null
				var eof = true;
				for (b in bh) {
					if (b != 0) {
						eof = false;
						break;
					}
				}
				if (eof) {

					console.log('eof=' + eof);
					return null;
				}
				console.log('getNextEntry(): parseTarHeader()');
				parseTarHeader(bh);
				skipPad(constant.HEADER_BLOCK);
				// console.log('bh: ' + bh);
				if (header.name == '') {
					console.log('header.name == \'\'');
					return null;
				}

				var isDirectory = function() {
					if (header != null) {
						if (header.linkFlag == constant.LF_DIR)
							return true;

						if (header.name.lastIndexOf('/') == header.name.len)
							return true;
					}

					return false;
				};
				return {
					header : header,
					isDirectory : isDirectory()
				};
			},
			getFileData : function(asBytes) {
				var bh = new Array();
				var tdata = new Array();
				var tr = 0;
				// Read full header
				while (tr < header.size) {
					tdata = stream.read(header.size - tr);
					if (tdata.length == 0) {
						break;
					}
					bh = bh.concat(tdata);
					tr += tdata.length;
					tdata = [];
				}
				console.log('tr: ' + tr);
				function toData(byte) {
					var data = new Array();
					for ( var i = 0; i < byte.length; i++) {
						data.push(String.fromCharCode(byte[i]));
					}
					return data.join('');
				}
				skipPad(header.size);
				header = null;
				return asBytes ? bh : Archive.Utils.UTF8.decode(toData(bh));
			}
		};
	};
})();
