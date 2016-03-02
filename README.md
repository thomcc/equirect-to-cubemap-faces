# Equirect map to cubemap faces

Function that convert an equirectangular/latlong map into an array of cubemap faces (like you would use to send to OpenGL).

## Usage

Works in the browser or as a commonjs module. Provides a single function `equirectToCubemapFaces(image, faceSize)`. The face size is optional, and defaults to the nearest power of two to image.width/4 (this is totally arbitrary). The `image` argument can be an img element, a canvas, or an ImageData.

Usage example: [see on codepen]()

function loadImage(src) {
	return new Promise(function(resolve, reject) {
		var i = new Image();
		i.onload = function() { resolve(i); }
		i.onerror = reject;
		i.src = src;
	});
}

loadImage(myImageURL)
.then(function(i) {
	var cs = equirectToCubemapFaces(i);
	cs.forEach(function(c) {
		document.body.appendChild(c);
	});
});

TODO: support for running this outside the browser (the function that does the bulk of the work already supports this...).

## License


