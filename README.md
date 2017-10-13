# Equirect map to cubemap faces

Function that convert an equirectangular/latlong map into an array of cubemap faces (like you would use to send to OpenGL).

## Usage

Works in the browser or as a commonjs module. Provides a single function `equirectToCubemapFaces(image, faceSize, options)`. The face size is optional, and defaults to the nearest power of two to image.width/4 (this is totally arbitrary). The `image` argument can be an img element, a canvas, or an ImageData.

The options are optional,  and only support a single option, which is only provided for legacy compatibility.

- `option.flipTheta`: Defaults to false. Previous versions of the library had a math error that caused the Y axis to be flipped in many cases (or really, the theta axis of the coordinate system used). For compatibility I've provided an option to recreate this behavior, which isn't really correct but might be useful in some scenarios depending on your shaders. If you set it to true, you opt into this behavior.

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

TODO: support for running this outside the browser (the function that does the bulk of the work already supports this...).

## License

The MIT License (MIT)

Copyright (c) 2016 Thom Chiovoloni

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
