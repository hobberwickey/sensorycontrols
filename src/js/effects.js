export const Effects = [
	{
		id: "color_opacity",
		path: "default",
		removable: false,
		label: "Chroma Key",
		effect_x: "Hue",
		effect_y: "Sensitivity",
		defaults: [0, 0],
		shader: `
	    precision mediump float;
	    varying vec2 v_texcoord;
	    uniform sampler2D u_texture;

	    float PI = 3.14159265358;

	    uniform vec2 u_dimensions; 
	    uniform mediump float u_opacity;
	    uniform vec2 u_effect;

	    vec3 rgb2hsv(vec3 c)
	    {
	      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	      float d = q.x - min(q.w, q.y);
	      float e = 1.0e-10;
	      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
	    }

	    void main() {
	      vec4 color = texture2D(u_texture, v_texcoord);
	      vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));

	      float hue_target = u_effect[0];
	      float hue_dist = min(abs(hsv[0]-hue_target), 1.0 - abs(hsv[0]-hue_target));
				float hue_opacity = min(cos(hue_dist - PI) * 300.0 + 300.0, 1.0) + (1.0 - u_effect[1]);

	      gl_FragColor = vec4(color[0], color[1], color[2], hue_opacity * color[3]);
	    }
	  `,
	},
	{
		id: "brightness_opacity",
		path: "default",
		removable: false,
		label: "Luma Key",
		effect_x: "Brightness",
		effect_y: "Sensitivity",
		defaults: [0, 0],
		shader: `
	    precision mediump float;
	    varying vec2 v_texcoord;
	    uniform sampler2D u_texture;

	    float PI = 3.14159265358;

	    uniform vec2 u_dimensions; 
	    uniform mediump float u_opacity;
	    uniform vec2 u_effect;

	    vec3 rgb2hsl( in vec3 c ){
			  float h = 0.0;
				float s = 0.0;
				float l = 0.0;
				float r = c.r;
				float g = c.g;
				float b = c.b;
				float cMin = min( r, min( g, b ) );
				float cMax = max( r, max( g, b ) );

				l = ( cMax + cMin ) / 2.0;
				if ( cMax > cMin ) {
					float cDelta = cMax - cMin;
			        
			        //s = l < .05 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) ); Original
					s = l < .0 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) );
			        
					if ( r == cMax ) {
						h = ( g - b ) / cDelta;
					} else if ( g == cMax ) {
						h = 2.0 + ( b - r ) / cDelta;
					} else {
						h = 4.0 + ( r - g ) / cDelta;
					}

					if ( h < 0.0) {
						h += 6.0;
					}
					h = h / 6.0;
				}
				return vec3( h, s, l );
			}

	    void main() {
	      vec4 color = texture2D(u_texture, v_texcoord);
	      vec3 hsl = rgb2hsl(vec3(color[0], color[1], color[2]));

	      
				float brightness_target = u_effect[0];
	      float brightness_dist = abs(hsl[2]-brightness_target);
				float brightness_opacity = min(cos(brightness_dist - PI) * 300.0 + 300.0, 1.0) + (1.0 - u_effect[1]);

	      gl_FragColor = vec4(color[0], color[1], color[2], brightness_opacity * color[3]);
	    }
	  `,
	},
	{
		id: "cosine_palette",
		path: "default",
		removable: false,
		label: "Cosine Palette",
		effect_x: "Intensity",
		effect_y: "Shift",
		defaults: [0, 0],
		shader: `
	    #ifdef GL_ES
    		precision mediump float;
  		#endif
	    
	    varying vec2 v_texcoord;
	    uniform sampler2D u_texture;

	    uniform vec2 u_dimensions; 
	    uniform float u_opacity;
	    uniform vec2 u_effect;

	    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) 
	    {
	      return a + b*cos( 6.28318*(c*t+d) );
	    }
	    
	    vec3 rgb2hsv(vec3 c)
	    {
	      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	      float d = q.x - min(q.w, q.y);
	      float e = 1.0e-10;
	      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
	    }

	    void main() {
	      vec4 color = texture2D(u_texture, v_texcoord);
	      vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));
	      vec3 effect = pal(hsv[2] + u_effect[1], vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
	      vec3 weighted = vec3(
	        color[0] * (1.0 - u_effect[0]) + effect[0] * u_effect[0],
	        color[1] * (1.0 - u_effect[0]) + effect[1] * u_effect[0],
	        color[2] * (1.0 - u_effect[0]) + effect[2] * u_effect[0]
	      );

	      gl_FragColor = vec4(weighted, color[3]);
	    }
	  `,
	},
	{
		id: "pixelate",
		path: "default",
		removable: false,
		label: "Pixelate",
		effect_x: "Pixel Size",
		effect_y: "Pallete Depth",
		defaults: [0, 0],
		shader: `
			#ifdef GL_ES
    		precision mediump float;
  		#endif

		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		    float pixelateX = u_dimensions[0] * floor(max(u_effect[0] * 30.0, 1.0));
		    float pixelateY = u_dimensions[1] * floor(max(u_effect[1] * 30.0, 1.0));
		    vec2 pixel_coords = vec2(
		      v_texcoord[0] - (v_texcoord[0] - floor(v_texcoord[0]/pixelateX) * pixelateX),
		      v_texcoord[1] - (v_texcoord[1] - floor(v_texcoord[1]/pixelateY) * pixelateY)
		    );

		    gl_FragColor = texture2D(u_texture, pixel_coords);
		  }
		`,
	},
	{
		id: "prism",
		path: "default",
		removable: false,
		label: "Prism",
		effect_x: "Horizontal",
		effect_y: "Vertical",
		defaults: [0, 0],
		shader: `
			precision mediump float;

		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		    vec2 prism_values = vec2(floor(u_effect[0] * 9.0) + 1.0, floor(u_effect[1] * 9.0) + 1.0);
		    vec2 prism_coords = vec2(fract(v_texcoord[0] * prism_values[0]), fract(v_texcoord[1] * prism_values[1]));

		    gl_FragColor = texture2D(u_texture, prism_coords);
		  }
		`,
	},
	{
		id: "kaleidoscope",
		path: "default",
		removable: false,
		label: "Kaleidoscope",
		effect_x: "Horizontal",
		effect_y: "Vertical",
		defaults: [0, 0],
		shader: `
			precision mediump float;
			
		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		    vec2 prism_values = vec2(floor(u_effect[0] * 9.0) + 1.0, floor(u_effect[1] * 9.0) + 1.0);

				float xFlip = -1.0;
				if (mod(floor(v_texcoord[0] * prism_values[0]), 2.0) == 0.0) {
					xFlip = 1.0;
				}

				float yFlip = -1.0;
				if (mod(floor(v_texcoord[1] * prism_values[1]), 2.0) == 0.0) {
					yFlip = 1.0;
				}

		    vec2 prism_coords = vec2(fract(v_texcoord[0] * prism_values[0] * xFlip), fract(v_texcoord[1] * prism_values[1] * yFlip));

		    gl_FragColor = texture2D(u_texture, prism_coords);
		  }
		`,
	},
	{
		id: "zoom",
		path: "default",
		removable: false,
		label: "Zoom",
		effect_x: "X-Zoom",
		effect_y: "Y-Zoom",
		defaults: [0, 0],
		shader: `
			#ifdef GL_ES
    		precision mediump float;
  		#endif

		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		  	float x_intensity = (1.0 - u_effect[0]);
		  	float y_intensity = (1.0 - u_effect[1]);


		    vec2 prism_coords = vec2(
		    	(v_texcoord[0] * x_intensity) + (u_effect[0] / 2.0), 
		    	(v_texcoord[1] * y_intensity) + (u_effect[1] / 2.0)
		    );

		    gl_FragColor = texture2D(u_texture, prism_coords);
		  }
		`,
	},
	{
		id: "shift",
		path: "default",
		removable: false,
		label: "Shift",
		effect_x: "X-Shift",
		effect_y: "Y-Shift",
		defaults: [0.0, 0.0],
		shader: `
			#ifdef GL_ES
    		precision mediump float;
  		#endif
  		
		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		    vec2 shift_coords = vec2(
		    	v_texcoord[0] - u_effect[0], 
		    	v_texcoord[1] - u_effect[1]
		    );

				// if (shift_coords[0] > 1.0) {
				// 	shift_coords[0] = shift_coords[0] - 1.0;
				// }

				// if (shift_coords[1] > 1.0) {
				// 	shift_coords[1] = shift_coords[1] - 1.0;
				// }
				
				if (shift_coords[0] < 0.0) {
					shift_coords[0] = 1.0 + shift_coords[0];
				}

				if (shift_coords[1] < 0.0) {
					shift_coords[1] = 1.0 + shift_coords[1];
				}

		    gl_FragColor = texture2D(u_texture, shift_coords);
		  }
		`,
	},
	{
		id: "color_adjust",
		path: "default",
		removable: false,
		label: "Color Adjust",
		effect_x: "Desaturate",
		effect_y: "Bit Depth",
		defaults: [0, 0],
		shader: `
			precision mediump float;
		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform mediump float u_opacity;
		  uniform vec2 u_effect;

		  vec3 rgb2hsl( in vec3 c ){
			  float h = 0.0;
				float s = 0.0;
				float l = 0.0;
				float r = c.r;
				float g = c.g;
				float b = c.b;
				float cMin = min( r, min( g, b ) );
				float cMax = max( r, max( g, b ) );

				l = ( cMax + cMin ) / 2.0;
				if ( cMax > cMin ) {
					float cDelta = cMax - cMin;
			        
					s = l < .0 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) );
			        
					if ( r == cMax ) {
						h = ( g - b ) / cDelta;
					} else if ( g == cMax ) {
						h = 2.0 + ( b - r ) / cDelta;
					} else {
						h = 4.0 + ( r - g ) / cDelta;
					}

					if ( h < 0.0) {
						h += 6.0;
					}
					h = h / 6.0;
				}
				return vec3( h, s, l );
			}

			float hue2rgb(float p, float q, float t) {
			  if (t < 0.0) {
			    t += 1.0;
			  }
			  if (t > 1.0) {
			    t -= 1.0;
			  }
			  if (t < 1.0 / 6.0) {
			    return p + (q - p) * 6.0 * t;
			  }
			  if (t < 1.0 / 2.0) {
			    return q;
			  }
			  if (t < 2.0 / 3.0) {
			    return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
			  }

			  return p;
			}

			vec3 hsl2rgb( vec3 c){
				float r = 0.0;
				float g = 0.0;
				float b = 0.0;

				if (c[1] == 0.0) {
					r = g = b = c[2];
				} else {
					float q = c[2] < 0.5 ? c[2] * (1.0 + c[1]) : c[2] + c[1] - c[2] * c[1];
					float p = 2.0 * c[2] - q;

					r = hue2rgb(p, q, c[0] + 1.0 / 3.0);
					g = hue2rgb(p, q, c[0]);
					b = hue2rgb(p, q, c[0] - 1.0 / 3.0);
				}

				return vec3(r, g, b);
			}

			float rShift(float n, float s) {
				return float(floor(n / pow(2.0, s))); 
			}

			float lShift(float n, float s) {
				return float(floor(n * pow(2.0, s)));
			}

			vec3 bitReduction(vec3 c, float s) {
				float r = rShift(c[0] * 255.0, s) / rShift(255.0, s);
				float g = rShift(c[1] * 255.0, s) / rShift(255.0, s);
				float b = rShift(c[2] * 255.0, s) / rShift(255.0, s);

				return vec3(r, g, b);
			}

	    void main() {
	      vec4 color = texture2D(u_texture, v_texcoord);
	      vec3 hsl = rgb2hsl(vec3(color[0], color[1], color[2]));
				vec3 desaturated = hsl2rgb(vec3(hsl[0], hsl[1] * (1.0 - u_effect[0]), hsl[2]));

				float reduction = floor(u_effect[1] * 7.0);
				vec3 reduced = bitReduction(desaturated, reduction);

		    gl_FragColor = vec4(reduced[0], reduced[1], reduced[2], color[3]);
		  }
		`,
	},
];
