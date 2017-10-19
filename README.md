# Equirect map to cubemap faces

Function that convert an equirectangular/latlong map into an array of cubemap faces (like you would use to send to OpenGL).

## Usage

Works in the browser or as a commonjs module. Provides a single function `equirectToCubemapFaces(image, faceSize, options)`. The face size is optional, and defaults to the nearest power of two to image.width/4 (this is totally arbitrary). The `image` argument can be an img element, a canvas, or an ImageData.

The options argument is optional, and supports the following parameters:

- `option.interpolation`: Either `"nearest"` or `"bilinear"`. Defaults to `"bilinear"`. Specifies whether to use nearest-neighbor interpolation (e.g. pixelated) or bilinear interpolation (e.g. smooth) when generating the cubemap faces.
	- Note that if bilinear interpolation is used, we perform the blending in linear space (e.g. we assume sRGB input). Someday this may be configurable.
- `option.flipTheta`: Provided for legacy compatibility, defaults to false. Previous versions of the library had a math error that caused the Y axis to be flipped in many cases (or really, the theta axis of the coordinate system used). For compatibility I've provided an option to recreate this behavior, which isn't really correct but might be useful in some scenarios depending on your shaders. If you set it to true, you opt into this behavior.

The result of this call is an array containing the faces the faces in the following order: `+x, -x, +y, -y, +z, -z`. Depending on your coordinate system this is probably right, left, top, bottom, front, back.

Usage example: [see on codepen](http://codepen.io/thomcc/pen/YqXQoo/)

```js
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
```

There are two additional functions exposed on the `equirectToCubemapFaces` function object.


- `equirectToCubemapFaces.transformSingleFace(inPixels, faceIdx, facePixels, options)`: Computes a single cubemap face.
    - `faceIdx` should be 0, 1, 2, 3, 4, or 5. Cooresponds to a face in the documented order, e.g. `+x, -x, +y, -y, +z, -z`.
    - `facePixels` should be an ImageData object where we should store the result.
    - `inPixels` should also be an ImageData object containing the source pixels.
    - `options` are the same options that are accepted by `equirectToCubemapFaces`. They're optional.


- `equirectToCubemapFaces.transformToCubeFaces(inPixels, facePixArray, options)`: Computes an array of cubemap faces. Just calls `transformSingleFace` in a loop for each facePixArray.
    - `inPixels`: Input image as an ImageData.
    - `facePixArray`: Array of 6 ImageData objects where the results should be stored.
    - `options`: Same options as `equirectToCubemapFaces`.

Another (much more involved) example, this one computing each face without too much jank.

```javascript
// boilerplate functions you probably already have around.
function makeCanvas(width, height) {
	let canvas = document.createElement("canvas");
	canvas.width = i.naturalWidth || i.width;
	canvas.height = i.naturalHeight || i.height;
	return canvas;
}

function loadImageIntoCanvas(src) {
	return new Promise(function(resolve, reject) {
		let i = new Image();
		i.onload = function() {
			let canvas = makeCanvas(i.width, i.height);
			let ctx = canvas.getContext('2d');
			ctx.drawImage(i, 0, 0);
			resolve(canvas);
		}
		i.onerror = reject;
		i.src = src;
	});
}

// Adds all the faces to the page without blocking the event loop for more than
// the amount of time it takes to compute a single face.
// Calls onComputedCubemapFace(faceIndex, faceImageData) at each step, and
// resolves to an array of the imageDatas.
async function computeCubemapFacesAsync(imageURL, desiredFaceSize, onComputedCubemapFace) {
	let inCanvas = await loadImageIntoCanvas(imageURL);
	let inCtx = inCanvas.getContext("2d");
	let imageData = inCtx.getImageData(0, 0, inCanvas.width, inCanvas.height);
	let result = [];
	for (let faceIndex = 0; faceIndex < 6; ++faceIndex) {
		let facePixels = new ImageData(desiredFaceSize, desiredFaceSize);
		equirectToCubemapFaces.transformSingleFace(inPixels, faceIndex, facePixels)
		onComputedCubemapFace(faceIndex, facePixels);
		result.push(facePixels);
		// wait about 16ms
		await new Promise(resolve => requestAnimationFrame(resolve));
	}
	return result;
}
```

## License

The MIT License (MIT)

Copyright (c) 2016 Thom Chiovoloni

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
