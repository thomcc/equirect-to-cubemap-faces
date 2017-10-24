var equirectToCubemapFaces = (function() {
	'use strict';

	var min = Math.min, max = Math.max;
	var pow = Math.pow, atan2 = Math.atan2, sqrt = Math.sqrt, log = Math.log;
	var floor = Math.floor, round = Math.round;
	var PI = +Math.PI;

	function clamp(v, lo, hi) {
		return min(hi, max(lo, v));
	}

	// These are approximations that assume gamma is 2.0. Not ideal, but close enough.
	function srgbToLinear(v) {
		var component = (+v * (1.0 / 255.0));
		return component * component;
	}

	function linearToSRGB(v) {
		return (sqrt(v) * 255.0) | 0;
	}

	function nearestPowerOfTwo(n) {
		return 1 << round(log(n)/log(2))
	}
	var DEFAULT_OPTIONS = {
		flipTheta: false,
		interpolation: "bilinear"
	};

	function transformSingleFace(inPixels, faceIdx, facePixels, opts) {
		if (!opts) {
			opts = DEFAULT_OPTIONS;
		}
		var thetaFlip = opts.flipTheta ? -1 : 1;
		var edge = facePixels.width|0;

		var inWidth = inPixels.width|0;
		var inHeight = inPixels.height|0;
		var inData = inPixels.data;

		var smoothNearest = (opts.interpolation === "nearest");

		var faceData = facePixels.data;
		var faceWidth = facePixels.width|0;
		var faceHeight = facePixels.height|0;
		var face = faceIdx | 0;

		var iFaceWidth2 = 2.0 / faceWidth;
		var iFaceHeight2 = 2.0 / faceHeight;

		for (var j = 0; j < faceHeight; ++j) {
			for (var i = 0; i < faceWidth; ++i) {
				var a = iFaceWidth2 * i;
				var b = iFaceHeight2 * j;
				var outPos = (i + j * edge) << 2;
				var x = 0.0, y = 0.0, z = 0.0;
				// @@NOTE: Tried using explicit matrices for this and didn't see any
				// speedup over the (IMO more understandable) switch. (Probably because these
				// branches should be correctly predicted almost every time).
				switch (face) {
					case 0: x = 1.0 - a; y = 1.0;     z = 1.0 - b; break; // right  (+x)
					case 1: x = a - 1.0; y = -1.0;    z = 1.0 - b; break; // left   (-x)
					case 2: x = b - 1.0; y = a - 1.0; z = 1.0;     break; // top    (+y)
					case 3: x = 1.0 - b; y = a - 1.0; z = -1.0;    break; // bottom (-y)
					case 4: x = 1.0;     y = a - 1.0; z = 1.0 - b; break; // front  (+z)
					case 5: x = -1.0;    y = 1.0 - a; z = 1.0 - b; break; // back   (-z)
				}

				var theta = thetaFlip * atan2(y, x);
				var rad = sqrt(x*x+y*y);
				var phi = atan2(z, rad);

				var uf = 2.0 * (inWidth / 4) * (theta + PI) / PI;
				var vf = 2.0 * (inWidth / 4) * (PI/2 - phi) / PI;
				var ui = floor(uf)|0, vi = floor(vf)|0;

				if (smoothNearest) {
					var inPos = ((ui % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) << 2;
					faceData[outPos + 0] = inData[inPos + 0] | 0;
					faceData[outPos + 1] = inData[inPos + 1] | 0;
					faceData[outPos + 2] = inData[inPos + 2] | 0;
					faceData[outPos + 3] = inData[inPos + 3] | 0;
				} else {
					// bilinear blend
					var u2 = ui+1, v2 = vi+1;
					var mu = uf-ui, nu = vf-vi;

					var pA = ((ui % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) << 2;
					var pB = ((u2 % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) << 2;
					var pC = ((ui % inWidth) + inWidth * clamp(v2, 0, inHeight-1)) << 2;
					var pD = ((u2 % inWidth) + inWidth * clamp(v2, 0, inHeight-1)) << 2;
					var aA = (inData[pA+3]|0)*(1.0 / 255.0)
					var aB = (inData[pB+3]|0)*(1.0 / 255.0)
					var aC = (inData[pC+3]|0)*(1.0 / 255.0)
					var aD = (inData[pD+3]|0)*(1.0 / 255.0)
					// Do the bilinear blend in linear space.
					var rA = srgbToLinear(inData[pA+0]|0) * aA, gA = srgbToLinear(inData[pA+1]|0) * aA, bA = srgbToLinear(inData[pA+2]|0) * aA;
					var rB = srgbToLinear(inData[pB+0]|0) * aB, gB = srgbToLinear(inData[pB+1]|0) * aB, bB = srgbToLinear(inData[pB+2]|0) * aB;
					var rC = srgbToLinear(inData[pC+0]|0) * aC, gC = srgbToLinear(inData[pC+1]|0) * aC, bC = srgbToLinear(inData[pC+2]|0) * aC;
					var rD = srgbToLinear(inData[pD+0]|0) * aD, gD = srgbToLinear(inData[pD+1]|0) * aD, bD = srgbToLinear(inData[pD+2]|0) * aD;

					var r = (rA*(1.0-mu)*(1.0-nu) + rB*mu*(1.0-nu) + rC*(1.0-mu)*nu + rD*mu*nu);
					var g = (gA*(1.0-mu)*(1.0-nu) + gB*mu*(1.0-nu) + gC*(1.0-mu)*nu + gD*mu*nu);
					var b = (bA*(1.0-mu)*(1.0-nu) + bB*mu*(1.0-nu) + bC*(1.0-mu)*nu + bD*mu*nu);
					var a = (aA*(1.0-mu)*(1.0-nu) + aB*mu*(1.0-nu) + aC*(1.0-mu)*nu + aD*mu*nu);
					var ia = 1.0 / a;
					faceData[outPos+0] = linearToSRGB(r * ia)|0;
					faceData[outPos+1] = linearToSRGB(g * ia)|0;
					faceData[outPos+2] = linearToSRGB(b * ia)|0;
					faceData[outPos+3] = (a * 255.0)|0;
				}
			}
		}
		return facePixels;
	}

	function transformToCubeFaces(inPixels, facePixArray, options) {
		if (facePixArray.length !== 6) {
			throw new Error("facePixArray length must be 6!");
		}
		if (!options) {
			options = DEFAULT_OPTIONS;
		}
		for (var face = 0; face < 6; ++face) {
			transformSingleFace(inPixels, face, facePixArray[face], options);
		}
		return facePixArray;
	}

	function imageGetPixels(image) {
		if (image.data) {
			return image;
		}
		var canvas = image, ctx = null;
		if (canvas.tagName !== 'CANVAS') {
			canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth || image.width;
			canvas.height = image.naturalHeight || image.height;
			ctx = canvas.getContext('2d');
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
		}
		else {
			ctx = canvas.getContext('2d');
		}
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	function equirectToCubemapFaces(image, faceSize, options) {
		var inPixels = imageGetPixels(image);

		if (!faceSize) {
			faceSize = nearestPowerOfTwo(image.width/4)|0;
		}

		if (typeof faceSize !== 'number') {
			throw new Error("faceSize needed to be a number or missing");
		}

		var faces = [];
		for (var i = 0; i < 6; ++i) {
			var c = document.createElement('canvas');
			c.width = faceSize;
			c.height = faceSize;
			faces.push(c);
		}

		transformToCubeFaces(inPixels, faces.map(function(canv) {
			return canv.getContext('2d').createImageData(canv.width, canv.height);
		}), options)
		.forEach(function(imageData, i) {
			faces[i].getContext('2d').putImageData(imageData, 0, 0);
		});
		return faces;
	}

	equirectToCubemapFaces.transformSingleFace = transformSingleFace;
	equirectToCubemapFaces.transformToCubeFaces = transformToCubeFaces;

	return equirectToCubemapFaces;
}());

if (typeof module !== 'undefined' && module.exports) {
	module.exports = equirectToCubemapFaces;
}
