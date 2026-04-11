/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/bridge.js":
/*!***********************!*\
  !*** ./src/bridge.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _js_state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./js/state */ \"./src/js/state.js\");\n\nconst ports = [];\nconst state = new _js_state__WEBPACK_IMPORTED_MODULE_0__.State(ports);\nonconnect = function (e) {\n  let port = e.ports[0];\n  port.push(port);\n  console.log(\"PORTS:\", ports);\n  port.addEventListener(\"message\", function (e) {\n    console.log(e);\n    let message = e.data[0];\n  });\n  port.start();\n};\n\n//# sourceURL=webpack://sensorycontrols/./src/bridge.js?");

/***/ }),

/***/ "./src/js/effect.js":
/*!**************************!*\
  !*** ./src/js/effect.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Effect: () => (/* binding */ Effect)\n/* harmony export */ });\n/* harmony import */ var building_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! building-blocks */ \"./node_modules/building-blocks/index.js\");\n\nclass Effect extends building_blocks__WEBPACK_IMPORTED_MODULE_0__.ContextBlocks {\n  constructor(effect) {\n    super({\n      id: effect.id,\n      type: \"effect\",\n      label: effect.label,\n      code: ``\n    });\n  }\n}\n\n//# sourceURL=webpack://sensorycontrols/./src/js/effect.js?");

/***/ }),

/***/ "./src/js/effects.js":
/*!***************************!*\
  !*** ./src/js/effects.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Effects: () => (/* binding */ Effects)\n/* harmony export */ });\nconst Effects = [{\n  id: \"color_opacity\",\n  label: \"Chroma Key\",\n  effect_x: \"Hue\",\n  effect_y: \"Sensitivity\",\n  defaults: [0, 0],\n  shader: `\n\t    precision mediump float;\n\t    varying vec2 v_texcoord;\n\t    uniform sampler2D u_texture;\n\n\t    float PI = 3.14159265358;\n\n\t    uniform vec2 u_dimensions; \n\t    uniform mediump float u_opacity;\n\t    uniform vec2 u_effect;\n\n\t    vec3 rgb2hsv(vec3 c)\n\t    {\n\t      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n\t      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n\t      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n\t      float d = q.x - min(q.w, q.y);\n\t      float e = 1.0e-10;\n\t      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n\t    }\n\n\t    void main() {\n\t      vec4 color = texture2D(u_texture, v_texcoord);\n\t      vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));\n\n\t      float hue_target = u_effect[0];\n\t      float hue_dist = min(abs(hsv[0]-hue_target), 1.0 - abs(hsv[0]-hue_target));\n\t\t\t\tfloat hue_opacity = min(cos(hue_dist - PI) * 300.0 + 300.0, 1.0) + (1.0 - u_effect[1]);\n\n\t      gl_FragColor = vec4(color[0], color[1], color[2], hue_opacity * color[3]);\n\t    }\n\t  `\n}, {\n  id: \"brightness_opacity\",\n  label: \"Luma Key\",\n  effect_x: \"Brightness\",\n  effect_y: \"Sensitivity\",\n  defaults: [0, 0],\n  shader: `\n\t    precision mediump float;\n\t    varying vec2 v_texcoord;\n\t    uniform sampler2D u_texture;\n\n\t    float PI = 3.14159265358;\n\n\t    uniform vec2 u_dimensions; \n\t    uniform mediump float u_opacity;\n\t    uniform vec2 u_effect;\n\n\t    vec3 rgb2hsl( in vec3 c ){\n\t\t\t  float h = 0.0;\n\t\t\t\tfloat s = 0.0;\n\t\t\t\tfloat l = 0.0;\n\t\t\t\tfloat r = c.r;\n\t\t\t\tfloat g = c.g;\n\t\t\t\tfloat b = c.b;\n\t\t\t\tfloat cMin = min( r, min( g, b ) );\n\t\t\t\tfloat cMax = max( r, max( g, b ) );\n\n\t\t\t\tl = ( cMax + cMin ) / 2.0;\n\t\t\t\tif ( cMax > cMin ) {\n\t\t\t\t\tfloat cDelta = cMax - cMin;\n\t\t\t        \n\t\t\t        //s = l < .05 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) ); Original\n\t\t\t\t\ts = l < .0 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) );\n\t\t\t        \n\t\t\t\t\tif ( r == cMax ) {\n\t\t\t\t\t\th = ( g - b ) / cDelta;\n\t\t\t\t\t} else if ( g == cMax ) {\n\t\t\t\t\t\th = 2.0 + ( b - r ) / cDelta;\n\t\t\t\t\t} else {\n\t\t\t\t\t\th = 4.0 + ( r - g ) / cDelta;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ( h < 0.0) {\n\t\t\t\t\t\th += 6.0;\n\t\t\t\t\t}\n\t\t\t\t\th = h / 6.0;\n\t\t\t\t}\n\t\t\t\treturn vec3( h, s, l );\n\t\t\t}\n\n\t    void main() {\n\t      vec4 color = texture2D(u_texture, v_texcoord);\n\t      vec3 hsl = rgb2hsl(vec3(color[0], color[1], color[2]));\n\n\t      \n\t\t\t\tfloat brightness_target = u_effect[0];\n\t      float brightness_dist = abs(hsl[2]-brightness_target);\n\t\t\t\tfloat brightness_opacity = min(cos(brightness_dist - PI) * 300.0 + 300.0, 1.0) + (1.0 - u_effect[1]);\n\n\t      gl_FragColor = vec4(color[0], color[1], color[2], brightness_opacity * color[3]);\n\t    }\n\t  `\n}, {\n  id: \"cosine_palette\",\n  label: \"Cosine Palette\",\n  effect_x: \"Intensity\",\n  effect_y: \"Shift\",\n  defaults: [0, 0],\n  shader: `\n\t    #ifdef GL_ES\n    \t\tprecision mediump float;\n  \t\t#endif\n\t    \n\t    varying vec2 v_texcoord;\n\t    uniform sampler2D u_texture;\n\n\t    uniform vec2 u_dimensions; \n\t    uniform float u_opacity;\n\t    uniform vec2 u_effect;\n\n\t    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) \n\t    {\n\t      return a + b*cos( 6.28318*(c*t+d) );\n\t    }\n\t    \n\t    vec3 rgb2hsv(vec3 c)\n\t    {\n\t      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n\t      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n\t      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n\t      float d = q.x - min(q.w, q.y);\n\t      float e = 1.0e-10;\n\t      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n\t    }\n\n\t    void main() {\n\t      vec4 color = texture2D(u_texture, v_texcoord);\n\t      vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));\n\t      vec3 effect = pal(hsv[2] + u_effect[1], vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );\n\t      vec3 weighted = vec3(\n\t        color[0] * (1.0 - u_effect[0]) + effect[0] * u_effect[0],\n\t        color[1] * (1.0 - u_effect[0]) + effect[1] * u_effect[0],\n\t        color[2] * (1.0 - u_effect[0]) + effect[2] * u_effect[0]\n\t      );\n\n\t      gl_FragColor = vec4(weighted, color[3]);\n\t    }\n\t  `\n}, {\n  id: \"pixelate\",\n  label: \"Pixelate\",\n  effect_x: \"Pixel Size\",\n  effect_y: \"Pallete Depth\",\n  defaults: [0, 0],\n  shader: `\n\t\t\t#ifdef GL_ES\n    \t\tprecision mediump float;\n  \t\t#endif\n\n\t\t  varying vec2 v_texcoord;\n\t\t  uniform sampler2D u_texture;\n\n\t\t  uniform vec2 u_dimensions; \n\t\t  uniform float u_opacity;\n\t\t  uniform vec2 u_effect;\n\n\t\t  void main() {\n\t\t    float pixelateX = u_dimensions[0] * floor(max(u_effect[0] * 30.0, 1.0));\n\t\t    float pixelateY = u_dimensions[1] * floor(max(u_effect[1] * 30.0, 1.0));\n\t\t    vec2 pixel_coords = vec2(\n\t\t      v_texcoord[0] - (v_texcoord[0] - floor(v_texcoord[0]/pixelateX) * pixelateX),\n\t\t      v_texcoord[1] - (v_texcoord[1] - floor(v_texcoord[1]/pixelateY) * pixelateY)\n\t\t    );\n\n\t\t    gl_FragColor = texture2D(u_texture, pixel_coords);\n\t\t  }\n\t\t`\n}, {\n  id: \"prism\",\n  label: \"Prism\",\n  effect_x: \"Horizontal\",\n  effect_y: \"Vertical\",\n  defaults: [0, 0],\n  shader: `\n\t\t\tprecision mediump float;\n\n\t\t  varying vec2 v_texcoord;\n\t\t  uniform sampler2D u_texture;\n\n\t\t  uniform vec2 u_dimensions; \n\t\t  uniform float u_opacity;\n\t\t  uniform vec2 u_effect;\n\n\t\t  void main() {\n\t\t    vec2 prism_values = vec2(floor(u_effect[0] * 9.0) + 1.0, floor(u_effect[1] * 9.0) + 1.0);\n\t\t    vec2 prism_coords = vec2(fract(v_texcoord[0] * prism_values[0]), fract(v_texcoord[1] * prism_values[1]));\n\n\t\t    gl_FragColor = texture2D(u_texture, prism_coords);\n\t\t  }\n\t\t`\n}, {\n  id: \"kaleidoscope\",\n  label: \"Kaleidoscope\",\n  effect_x: \"Horizontal\",\n  effect_y: \"Vertical\",\n  defaults: [0, 0],\n  shader: `\n\t\t\tprecision mediump float;\n\t\t\t\n\t\t  varying vec2 v_texcoord;\n\t\t  uniform sampler2D u_texture;\n\n\t\t  uniform vec2 u_dimensions; \n\t\t  uniform float u_opacity;\n\t\t  uniform vec2 u_effect;\n\n\t\t  void main() {\n\t\t    vec2 prism_values = vec2(floor(u_effect[0] * 9.0) + 1.0, floor(u_effect[1] * 9.0) + 1.0);\n\n\t\t\t\tfloat xFlip = -1.0;\n\t\t\t\tif (mod(floor(v_texcoord[0] * prism_values[0]), 2.0) == 0.0) {\n\t\t\t\t\txFlip = 1.0;\n\t\t\t\t}\n\n\t\t\t\tfloat yFlip = -1.0;\n\t\t\t\tif (mod(floor(v_texcoord[1] * prism_values[1]), 2.0) == 0.0) {\n\t\t\t\t\tyFlip = 1.0;\n\t\t\t\t}\n\n\t\t    vec2 prism_coords = vec2(fract(v_texcoord[0] * prism_values[0] * xFlip), fract(v_texcoord[1] * prism_values[1] * yFlip));\n\n\t\t    gl_FragColor = texture2D(u_texture, prism_coords);\n\t\t  }\n\t\t`\n}, {\n  id: \"zoom\",\n  label: \"Zoom\",\n  effect_x: \"X-Zoom\",\n  effect_y: \"Y-Zoom\",\n  defaults: [0, 0],\n  shader: `\n\t\t\t#ifdef GL_ES\n    \t\tprecision mediump float;\n  \t\t#endif\n\n\t\t  varying vec2 v_texcoord;\n\t\t  uniform sampler2D u_texture;\n\n\t\t  uniform vec2 u_dimensions; \n\t\t  uniform float u_opacity;\n\t\t  uniform vec2 u_effect;\n\n\t\t  void main() {\n\t\t  \tfloat x_intensity = (1.0 - u_effect[0]);\n\t\t  \tfloat y_intensity = (1.0 - u_effect[1]);\n\n\n\t\t    vec2 prism_coords = vec2(\n\t\t    \t(v_texcoord[0] * x_intensity) + (u_effect[0] / 2.0), \n\t\t    \t(v_texcoord[1] * y_intensity) + (u_effect[1] / 2.0)\n\t\t    );\n\n\t\t    gl_FragColor = texture2D(u_texture, prism_coords);\n\t\t  }\n\t\t`\n}, {\n  id: \"shift\",\n  label: \"Shift\",\n  effect_x: \"X-Shift\",\n  effect_y: \"Y-Shift\",\n  defaults: [0.0, 0.0],\n  shader: `\n\t\t\t#ifdef GL_ES\n    \t\tprecision mediump float;\n  \t\t#endif\n  \t\t\n\t\t  varying vec2 v_texcoord;\n\t\t  uniform sampler2D u_texture;\n\n\t\t  uniform vec2 u_dimensions; \n\t\t  uniform float u_opacity;\n\t\t  uniform vec2 u_effect;\n\n\t\t  void main() {\n\t\t    vec2 shift_coords = vec2(\n\t\t    \tv_texcoord[0] - u_effect[0], \n\t\t    \tv_texcoord[1] - u_effect[1]\n\t\t    );\n\n\t\t\t\t// if (shift_coords[0] > 1.0) {\n\t\t\t\t// \tshift_coords[0] = shift_coords[0] - 1.0;\n\t\t\t\t// }\n\n\t\t\t\t// if (shift_coords[1] > 1.0) {\n\t\t\t\t// \tshift_coords[1] = shift_coords[1] - 1.0;\n\t\t\t\t// }\n\t\t\t\t\n\t\t\t\tif (shift_coords[0] < 0.0) {\n\t\t\t\t\tshift_coords[0] = 1.0 + shift_coords[0];\n\t\t\t\t}\n\n\t\t\t\tif (shift_coords[1] < 0.0) {\n\t\t\t\t\tshift_coords[1] = 1.0 + shift_coords[1];\n\t\t\t\t}\n\n\t\t    gl_FragColor = texture2D(u_texture, shift_coords);\n\t\t  }\n\t\t`\n}, {\n  id: \"color_adjust\",\n  label: \"Color Adjust\",\n  effect_x: \"Desaturate\",\n  effect_y: \"Bit Depth\",\n  defaults: [0, 0],\n  shader: `\n\t\t\tprecision mediump float;\n\t\t  varying vec2 v_texcoord;\n\t\t  uniform sampler2D u_texture;\n\n\t\t  uniform vec2 u_dimensions; \n\t\t  uniform mediump float u_opacity;\n\t\t  uniform vec2 u_effect;\n\n\t\t  vec3 rgb2hsl( in vec3 c ){\n\t\t\t  float h = 0.0;\n\t\t\t\tfloat s = 0.0;\n\t\t\t\tfloat l = 0.0;\n\t\t\t\tfloat r = c.r;\n\t\t\t\tfloat g = c.g;\n\t\t\t\tfloat b = c.b;\n\t\t\t\tfloat cMin = min( r, min( g, b ) );\n\t\t\t\tfloat cMax = max( r, max( g, b ) );\n\n\t\t\t\tl = ( cMax + cMin ) / 2.0;\n\t\t\t\tif ( cMax > cMin ) {\n\t\t\t\t\tfloat cDelta = cMax - cMin;\n\t\t\t        \n\t\t\t\t\ts = l < .0 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) );\n\t\t\t        \n\t\t\t\t\tif ( r == cMax ) {\n\t\t\t\t\t\th = ( g - b ) / cDelta;\n\t\t\t\t\t} else if ( g == cMax ) {\n\t\t\t\t\t\th = 2.0 + ( b - r ) / cDelta;\n\t\t\t\t\t} else {\n\t\t\t\t\t\th = 4.0 + ( r - g ) / cDelta;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ( h < 0.0) {\n\t\t\t\t\t\th += 6.0;\n\t\t\t\t\t}\n\t\t\t\t\th = h / 6.0;\n\t\t\t\t}\n\t\t\t\treturn vec3( h, s, l );\n\t\t\t}\n\n\t\t\tfloat hue2rgb(float p, float q, float t) {\n\t\t\t  if (t < 0.0) {\n\t\t\t    t += 1.0;\n\t\t\t  }\n\t\t\t  if (t > 1.0) {\n\t\t\t    t -= 1.0;\n\t\t\t  }\n\t\t\t  if (t < 1.0 / 6.0) {\n\t\t\t    return p + (q - p) * 6.0 * t;\n\t\t\t  }\n\t\t\t  if (t < 1.0 / 2.0) {\n\t\t\t    return q;\n\t\t\t  }\n\t\t\t  if (t < 2.0 / 3.0) {\n\t\t\t    return p + (q - p) * (2.0 / 3.0 - t) * 6.0;\n\t\t\t  }\n\n\t\t\t  return p;\n\t\t\t}\n\n\t\t\tvec3 hsl2rgb( vec3 c){\n\t\t\t\tfloat r = 0.0;\n\t\t\t\tfloat g = 0.0;\n\t\t\t\tfloat b = 0.0;\n\n\t\t\t\tif (c[1] == 0.0) {\n\t\t\t\t\tr = g = b = c[2];\n\t\t\t\t} else {\n\t\t\t\t\tfloat q = c[2] < 0.5 ? c[2] * (1.0 + c[1]) : c[2] + c[1] - c[2] * c[1];\n\t\t\t\t\tfloat p = 2.0 * c[2] - q;\n\n\t\t\t\t\tr = hue2rgb(p, q, c[0] + 1.0 / 3.0);\n\t\t\t\t\tg = hue2rgb(p, q, c[0]);\n\t\t\t\t\tb = hue2rgb(p, q, c[0] - 1.0 / 3.0);\n\t\t\t\t}\n\n\t\t\t\treturn vec3(r, g, b);\n\t\t\t}\n\n\t\t\tfloat rShift(float n, float s) {\n\t\t\t\treturn float(floor(n / pow(2.0, s))); \n\t\t\t}\n\n\t\t\tfloat lShift(float n, float s) {\n\t\t\t\treturn float(floor(n * pow(2.0, s)));\n\t\t\t}\n\n\t\t\tvec3 bitReduction(vec3 c, float s) {\n\t\t\t\tfloat r = rShift(c[0] * 255.0, s) / rShift(255.0, s);\n\t\t\t\tfloat g = rShift(c[1] * 255.0, s) / rShift(255.0, s);\n\t\t\t\tfloat b = rShift(c[2] * 255.0, s) / rShift(255.0, s);\n\n\t\t\t\treturn vec3(r, g, b);\n\t\t\t}\n\n\t    void main() {\n\t      vec4 color = texture2D(u_texture, v_texcoord);\n\t      vec3 hsl = rgb2hsl(vec3(color[0], color[1], color[2]));\n\t\t\t\tvec3 desaturated = hsl2rgb(vec3(hsl[0], hsl[1] * (1.0 - u_effect[0]), hsl[2]));\n\n\t\t\t\tfloat reduction = floor(u_effect[1] * 7.0);\n\t\t\t\tvec3 reduced = bitReduction(desaturated, reduction);\n\n\t\t    gl_FragColor = vec4(reduced[0], reduced[1], reduced[2], color[3]);\n\t\t  }\n\t\t`\n}];\n\n//# sourceURL=webpack://sensorycontrols/./src/js/effects.js?");

/***/ }),

/***/ "./src/js/script.js":
/*!**************************!*\
  !*** ./src/js/script.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Script: () => (/* binding */ Script)\n/* harmony export */ });\n/* harmony import */ var building_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! building-blocks */ \"./node_modules/building-blocks/index.js\");\n\nclass Script extends building_blocks__WEBPACK_IMPORTED_MODULE_0__.ContextBlocks {\n  constructor(idx) {\n    super({\n      id: `${idx}`,\n      type: \"script\",\n      label: `Script ${idx + 1}`,\n      disabled: false,\n      code: ``\n    });\n  }\n}\n\n//# sourceURL=webpack://sensorycontrols/./src/js/script.js?");

/***/ }),

/***/ "./src/js/shape.js":
/*!*************************!*\
  !*** ./src/js/shape.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DefaultQuad: () => (/* binding */ DefaultQuad),\n/* harmony export */   DefaultTriangle: () => (/* binding */ DefaultTriangle),\n/* harmony export */   Shape: () => (/* binding */ Shape)\n/* harmony export */ });\n/* harmony import */ var building_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! building-blocks */ \"./node_modules/building-blocks/index.js\");\n\nconst gen_id = () => {\n  return Math.random() * 1000000 | 0;\n};\nconst DefaultTriangle = () => {\n  return [{\n    input: [[0.4, 0.4], [0.6, 0.4], [0.5, 0.6]],\n    output: [[0.4, 0.4], [0.6, 0.4], [0.5, 0.6]]\n  }];\n};\nconst DefaultQuad = () => {\n  return [{\n    input: [[0, 0], [1, 0], [1, 1]],\n    output: [[0, 0], [1, 0], [1, 1]]\n  }, {\n    input: [[0, 0], [1, 1], [0, 1]],\n    output: [[0, 0], [1, 1], [0, 1]]\n  }];\n};\nlet quadMap = [[0, 0], [1, null], [2, 1], [null, 2]];\nclass Shape extends building_blocks__WEBPACK_IMPORTED_MODULE_0__.ContextBlocks {\n  constructor(label, type) {\n    super({\n      id: gen_id(),\n      type: \"quad\",\n      label: label,\n      opacity: new Array(6).fill(0),\n      tris: type === \"quad\" ? DefaultQuad() : DefaultTriangle()\n    });\n  }\n  setLabel(label) {\n    this.label = label;\n  }\n  setPoint(idx, layer, x, y) {\n    if (this.type === \"tri\") {\n      this.tris[0][layer][idx][0] = x;\n      this.tris[0][layer][idx][1] = y;\n    }\n    if (this.type === \"quad\") {\n      let mapping0 = quadMap[idx];\n      let mapping1 = quadMap[idx];\n      if (mapping0 !== null) {\n        this.tris[0][layer][mapping0][0] = x;\n        this.tris[0][layer][mapping0][1] = y;\n      }\n      if (mapping1 !== null) {\n        this.tris[1][layer][mapping1][0] = x;\n        this.tris[1][layer][mapping1][1] = y;\n      }\n    }\n    this.tris = [...this.tris];\n  }\n}\n\n//# sourceURL=webpack://sensorycontrols/./src/js/shape.js?");

/***/ }),

/***/ "./src/js/slot.js":
/*!************************!*\
  !*** ./src/js/slot.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Slot: () => (/* binding */ Slot)\n/* harmony export */ });\n/* harmony import */ var building_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! building-blocks */ \"./node_modules/building-blocks/index.js\");\n\nclass Slot extends building_blocks__WEBPACK_IMPORTED_MODULE_0__.ContextBlocks {\n  constructor(idx) {\n    super({\n      id: `${idx}`,\n      target: null,\n      values: new Array(6).fill().map((_, idx) => {\n        return [0, 0];\n      })\n    });\n  }\n}\n\n//# sourceURL=webpack://sensorycontrols/./src/js/slot.js?");

/***/ }),

/***/ "./src/js/state.js":
/*!*************************!*\
  !*** ./src/js/state.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   State: () => (/* binding */ State)\n/* harmony export */ });\n/* harmony import */ var building_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! building-blocks */ \"./node_modules/building-blocks/index.js\");\n/* harmony import */ var _effects__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effects */ \"./src/js/effects.js\");\n/* harmony import */ var _script__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./script */ \"./src/js/script.js\");\n/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./effect */ \"./src/js/effect.js\");\n/* harmony import */ var _slot__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./slot */ \"./src/js/slot.js\");\n/* harmony import */ var _video__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./video */ \"./src/js/video.js\");\n/* harmony import */ var _shape__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./shape */ \"./src/js/shape.js\");\n/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./utils */ \"./src/js/utils.js\");\n\n\n\n\n\n\n\n\nlet parent = window.parent;\nclass State extends building_blocks__WEBPACK_IMPORTED_MODULE_0__.ContextBlocks {\n  constructor() {\n    super({\n      loading: null,\n      files: new Array(6).fill(null),\n      selected: {\n        video: null,\n        slot: null\n      },\n      slots: new Array(12).fill().map((_, idx) => new _slot__WEBPACK_IMPORTED_MODULE_4__.Slot(idx)),\n      scripts: new Array(12).fill().map((_, idx) => new _script__WEBPACK_IMPORTED_MODULE_2__.Script(idx)),\n      effects: _effects__WEBPACK_IMPORTED_MODULE_1__.Effects.map(e => new _effect__WEBPACK_IMPORTED_MODULE_3__.Effect(e)),\n      videos: new Array(6).fill().map((_, idx) => new _video__WEBPACK_IMPORTED_MODULE_5__.Video(idx)),\n      shapes: [new _shape__WEBPACK_IMPORTED_MODULE_6__.Shape(\"Quad 1\", \"quad\")]\n    });\n    console.log(parent);\n    if (!parent) {\n      this.worker = new SharedWorker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u(\"src_bridge_js-src_js_state_js\"), __webpack_require__.b));\n      this.port = this.worker.port;\n    }\n    console.log(\"PORT\", this.worker);\n    this.listen(\"files\", files => {\n      if (!!this.loading) {\n        this.port.postMessage(files(this.loading));\n        this.loading = null;\n      }\n    });\n    this.listen(\"loading\", loading => {\n      this.post(\"update_state\", {\n        loading\n      });\n    });\n    this.listen(\"loading\", selected => {\n      this.post(\"update_state\", {\n        selected\n      });\n    });\n    this.scripts.map(script => {\n      script.listen(\"label\", label => {\n        this.post(\"update_script\", {\n          label\n        });\n      });\n      script.listen(\"code\", code => {\n        this.post(\"update_script\", {\n          code\n        });\n      });\n      script.listen(\"disabled\", disabled => {\n        this.post(\"update_script\", {\n          disabled\n        });\n      });\n    });\n    this.scripts.map((script, idx) => {\n      script.listen(\"label\", label => {\n        this.post(\"update_script\", {\n          label\n        }, {\n          idx\n        });\n      });\n      script.listen(\"code\", code => {\n        this.post(\"update_script\", {\n          code\n        }, {\n          idx\n        });\n      });\n      script.listen(\"disabled\", disabled => this.post(\"update_script\", {\n        disabled\n      }, {\n        idx\n      }));\n    });\n    this.effects.map((effect, idx) => {\n      effect.listen(\"label\", label => {\n        this.post(\"update_effect\", {\n          label\n        }, {\n          idx\n        });\n      });\n      effect.listen(\"code\", code => {\n        this.post(\"update_effect\", {\n          code\n        }, {\n          idx\n        });\n      });\n    });\n    this.videos.map((video, idx) => {\n      video.listen(\"label\", label => {\n        this.post(\"update_effect\", {\n          label\n        }, {\n          idx\n        });\n      });\n      video.listen(\"opacity\", opacity => {\n        this.post(\"update_effect\", {\n          opacity\n        }, {\n          idx\n        });\n      });\n      video.listen(\"code\", code => {\n        this.post(\"update_effect\", {\n          code\n        }, {\n          idx\n        });\n      });\n    });\n    this.shapes.map((shape, idx) => {\n      this.addShapeEvents(shape, idx);\n    });\n  }\n  post(action, updates, data) {\n    this.port.postMessage(JSON.stringify({\n      action,\n      updates: {\n        updates\n      },\n      data: {\n        data\n      }\n    }));\n  }\n  addShape(label, type) {\n    let shape = new _shape__WEBPACK_IMPORTED_MODULE_6__.Shape(label, type);\n    let idx = this.shapes.length;\n    this.addShapeEvents(shape, idx);\n    this.shapes.push(shape);\n    this.post(\"add_shape\", {\n      shape\n    }, {\n      idx\n    });\n  }\n  addShapeEvents(shape, idx) {\n    shape.listen(\"label\", label => {\n      this.post(\"update_shape\", {\n        label\n      }, {\n        idx\n      });\n    });\n    shape.listen(\"opacity\", opacity => {\n      this.post(\"update_shape\", {\n        opacity\n      }, {\n        idx\n      });\n    });\n    shape.listen(\"tris\", tris => {\n      this.post(\"update_shape\", {\n        tris\n      }, {\n        idx\n      });\n    });\n  }\n}\n\n//# sourceURL=webpack://sensorycontrols/./src/js/state.js?");

/***/ }),

/***/ "./src/js/utils.js":
/*!*************************!*\
  !*** ./src/js/utils.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   gen_id: () => (/* binding */ gen_id)\n/* harmony export */ });\nconst gen_id = () => {\n  return Math.random() * 1000000 | 0;\n};\n\n//# sourceURL=webpack://sensorycontrols/./src/js/utils.js?");

/***/ }),

/***/ "./src/js/video.js":
/*!*************************!*\
  !*** ./src/js/video.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Video: () => (/* binding */ Video)\n/* harmony export */ });\n/* harmony import */ var building_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! building-blocks */ \"./node_modules/building-blocks/index.js\");\n\nconst gen_id = () => {\n  return Math.random() * 1000000 | 0;\n};\nclass Video extends building_blocks__WEBPACK_IMPORTED_MODULE_0__.ContextBlocks {\n  constructor(idx) {\n    super({\n      id: gen_id(),\n      label: `Video ${idx + 1}`,\n      opacity: 0,\n      code: ``\n    });\n  }\n}\n\n//# sourceURL=webpack://sensorycontrols/./src/js/video.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_building-blocks_index_js"], () => (__webpack_require__("./src/bridge.js")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "js/" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl + "../";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = self.location + "/../../";
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"src_bridge_js-src_js_state_js": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunksensorycontrols"] = self["webpackChunksensorycontrols"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e("vendors-node_modules_building-blocks_index_js").then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;