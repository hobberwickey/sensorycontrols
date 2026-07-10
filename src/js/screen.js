import { Effects } from "./effects.js";
import { ScriptTemplate } from "./script-template.js";

import { ImageTypes } from "./consts.js";

import { Effect } from "./effect.js";
import { Script } from "./script.js";

const shaderMethods = {
  pal: `
    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) 
    {
      return a + b*cos( 6.28318*(c*t+d) );
    }
  `,

  rgb2hsv: `
    vec3 rgb2hsv(vec3 c)
    {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
  `,
};

const vertexShaderSrc = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;

  uniform float u_flipY;

  varying vec2 v_texcoord;
  
  void main() {
    gl_Position = vec4(a_position * vec2(1, u_flipY), 0.0, 1.0);
    v_texcoord = a_texcoord;
  }
`;

const fragmentShader = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D u_texture;

  uniform vec2 u_dimensions;
  uniform mediump float u_opacity;
  uniform vec2 u_effect;

  // For quads
  uniform float u_quad;
  uniform vec2 u_translate;
  uniform vec2 u_scale;
  
  uniform vec2 u_vertex_a;
  uniform vec2 u_vertex_b;
  uniform vec2 u_vertex_c;
  uniform vec2 u_vertex_d;

  
  // Credit to https://www.shadertoy.com/view/lsBSDm for the invBilinear function
  float cross2d( in vec2 a, in vec2 b ) { 
    return a.x*b.y - a.y*b.x; 
  }

  vec2 invBilinear( in vec2 p, in vec2 a, in vec2 b, in vec2 c, in vec2 d ) {
    vec2 res = vec2(-1.0);

    vec2 e = b-a;
    vec2 f = d-a;
    vec2 g = a-b+c-d;
    vec2 h = p-a;
        
    float k2 = cross2d( g, f );
    float k1 = cross2d( e, f ) + cross2d( h, g );
    float k0 = cross2d( h, e );
    
    if( abs(k2)<0.001 ) {
        res = vec2( (h.x*k1+f.x*k0)/(e.x*k1-g.x*k0), -k0/k1 );
    } else {
      float w = k1*k1 - 4.0*k0*k2;
      if ( w<0.0 ) return vec2(-1.0);
      w = sqrt( w );

      float ik2 = 0.5/k2;
      float v = (-k1 - w)*ik2;
      float u = (h.x - f.x*v)/(e.x + g.x*v);
      
      if( u<0.0 || u>1.0 || v<0.0 || v>1.0 ) {
        v = (-k1 + w)*ik2;
        u = (h.x - f.x*v)/(e.x + g.x*v);
      }
      res = vec2( u, v );
    }
    
    return res;
  }

  void main() {
    vec2 coords;

    if (u_quad == 1.0) {
      vec2 lerped = invBilinear(v_texcoord, u_vertex_a, u_vertex_b, u_vertex_c, u_vertex_d);
      vec2 scaled = vec2(lerped[0] * u_scale[0], lerped[1] * u_scale[1]);
      vec2 translated = vec2(scaled[0] + u_translate[0], scaled[1] + u_translate[1]);

      coords = translated;
    } else {
      coords = v_texcoord;
    }

    
    vec4 color = texture2D(u_texture, coords);
    gl_FragColor = vec4(color[0], color[1], color[2], u_opacity * color[3]);
  }
`;

export default class Screen {
  constructor(state, ctx, videos, options) {
    this.options = {
      width: 1280,
      height: 720,
      ...options,
    };

    // this.pending_state = state;
    this.state = state;
    this.videos = videos;
    this.gl = ctx;

    this.registry = { elapsed: 1 };

    this.epoch = Date.now();
    this.bpm = 0;
    this.beat = [0, 0];
    this.timing = [0, 0];

    this.clock = null;
    this.defaultClock = null;
    this.pulseCount = 0;
    this.beatStart = null;
    this.beatTick = false;
    this.resetBeat = false;

    this.scripts = [];
    this.effects = [];

    this.textures = [];
    this.glAttrs = new Array(6).fill(null);

    this.attrs = {
      main: null,
      effects: [],
    };

    this.isPlaying = false;

    this.videos.forEach((vid) => {
      vid.addEventListener("loadedmetadata", (e) => {
        setTimeout(() => {
          this.updateContext(e.target);
          vid.play();
        }, 100);
      });
    });

    this.createContext();
    this.updateSlots();
  }

  // setEffectOrder() {
  //   let effects = Effects.map((e) => e.id);
  //   let used = [...this.state.effects].filter((e) => !!e);
  //   let unused = effects.reduce((a, c) => {
  //     if (!used.includes(c)) {
  //       a.push(c);
  //     }

  //     return a;
  //   }, []);
  // }

  play() {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.step();
  }

  stop() {
    this.isPlaying = false;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  pause() {
    this.isPlaying = false;
  }

  step() {
    if (!this.isPlaying) {
      return;
    }

    let len = this.videos.length - 1;
    let state = JSON.parse(JSON.stringify(this.state));
    let beat = this.beatTick ? this.beat : null;

    state.elapsed = Date.now() - this.epoch;
    state.bpm = this.bpm;
    state.beat = beat;
    // state.timing = this.timing;
    state.elements = this.videos;

    for (let i = 0; i < this.scripts.length; i++) {
      let { fn, script: target } = this.scripts[i];

      let values = target.values;
      let disabled = target.disabled;

      if (!disabled) {
        try {
          fn(state, values[0], values[1], target.id, this.registry);
        } catch (e) {
          console.log(e);
        }
      }
    }

    this.beatTick = false;
    this.registry.elapsed = state.elapsed;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.drawFrame(state);

    window.requestAnimationFrame(this.step.bind(this));
  }

  drawFrame(state) {
    let effects = this.effects;

    let { videos, shapes, slots } = state;

    // Get the context
    let gl = this.gl;
    // Get the attributes
    let attrs = this.attrs;
    let videosLen = this.videos.length - 1;
    // let activeBuffer = 1;
    let activeBuffers = new Array(this.videos.length).fill(0);

    for (var j = videosLen; j >= 0; j--) {
      let video = videos[j];
      let videoEl = this.videos[j];
      let texture = this.textures[j];

      // Skip if video isn't playing
      if (!video || (video.currentTime === 0 && !videoEl.still)) {
        continue;
      }
      this.updateTexture(gl, texture, videoEl);
    }

    // First draw the texture to the first frame buffer
    for (var j = videosLen; j >= 0; j--) {
      let video = videos[j];
      let vals = [0, 0];
      let videoEl = this.videos[j];
      let texture = this.textures[j];

      // Skip if video isn't playing
      if (!video || (video.currentTime === 0 && !videoEl.still)) {
        continue;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture.src);
      gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[0]);
      gl.viewport(
        0,
        0,
        videoEl.still?.width || videoEl.videoWidth,
        videoEl.still?.height || videoEl.videoHeight,
      );
      gl.useProgram(attrs.main.program);

      this.drawShapes(
        gl,
        videoEl,
        j,
        attrs.main,
        shapes,
        [0, 0],
        -1,
        true,
        state.elapsed,
      );
    }

    for (let i = 0; i < effects.length; i++) {
      let { fx } = effects[i];
      let target = null;

      for (let j = 0; j < state.effects.length; j++) {
        if (state.effects[j].id === fx.id) {
          target = state.effects[j];
          break;
        }
      }

      if (!target) {
        continue;
      }

      if (gl.isProgram(fx.program)) {
        gl.useProgram(fx.program);
      } else {
        console.log("Deleted");
        continue;
      }

      for (let j = videosLen; j >= 0; j--) {
        let video = videos[j];

        let videoEl = this.videos[j];
        let texture = this.textures[j];
        let vals = target.values[j];
        // Skip if this effect isn't being used
        if (vals[0] === 0 && vals[1] === 0) {
          continue;
        }

        // Skip if video isn't playing
        if (!video || (video.currentTime === 0 && !videoEl.still)) {
          continue;
        }

        let activeBuffer = activeBuffers[j];
        let drawBuffer = (activeBuffer + 1) % 2;

        gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[activeBuffer]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[drawBuffer]);
        gl.viewport(
          0,
          0,
          videoEl.still?.width || videoEl.videoWidth,
          videoEl.still?.height || videoEl.videoHeight,
        );
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.drawShapes(
          gl,
          videoEl,
          j,
          fx,
          shapes,
          vals,
          -1,
          true,
          state.elapsed,
        );

        activeBuffers[j] = drawBuffer;
      }
    }

    for (var j = videosLen; j >= 0; j--) {
      let video = videos[j];
      let vals = [0, 0];
      let videoEl = this.videos[j];
      let texture = this.textures[j];

      // Skip if video isn't playing
      if (!video || (video.currentTime === 0 && !video.still)) {
        continue;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[activeBuffers[j]]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.options.width, this.options.height);
      // gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
      gl.useProgram(attrs.main.program);
      this.drawShapes(
        gl,
        videoEl,
        j,
        attrs.main,
        shapes,
        [0, 0],
        1,
        false,
        state.elapsed,
      );
    }
  }

  drawShapes(
    gl,
    video,
    idx,
    attrs,
    shapes,
    values,
    flip,
    ignoreOpacity,
    elapsed,
  ) {
    gl.uniform2fv(attrs.uniforms.effect, values);
    gl.uniform1f(attrs.uniforms.flip, flip);
    gl.uniform1f(attrs.uniforms.elapsed, elapsed / 1000);
    gl.uniform2fv(attrs.uniforms.dimensions, [
      1 / (video.still?.width || video.videoWidth),
      1 / (video.still?.height || video.videoWidth),
    ]);

    for (var i = 0; i < shapes.length; i++) {
      let opacity = shapes[i].opacity[idx];

      if (opacity === 0) {
        continue;
      }

      let tris = shapes[i].tris;

      if (flip === 1 && shapes[i].type === "quad") {
        let vert_a = [tris[0].output[0][0], tris[0].output[0][1]];
        let vert_b = [tris[0].output[1][0], tris[0].output[1][1]];
        let vert_c = [tris[0].output[2][0], tris[0].output[2][1]];
        let vert_d = [tris[1].output[2][0], tris[1].output[2][1]];

        let translate = [tris[0].input[0][0], tris[0].input[0][1]];
        let scale = [
          tris[0].input[1][0] - tris[0].input[0][0],
          tris[0].input[2][1] - tris[0].input[1][1],
        ];

        gl.uniform1f(attrs.uniforms.quad, 1);
        gl.uniform2fv(attrs.uniforms.vert_a, vert_a);
        gl.uniform2fv(attrs.uniforms.vert_b, vert_b);
        gl.uniform2fv(attrs.uniforms.vert_c, vert_c);
        gl.uniform2fv(attrs.uniforms.vert_d, vert_d);

        gl.uniform2fv(attrs.uniforms.translate, translate);
        gl.uniform2fv(attrs.uniforms.scale, scale);
      } else {
        gl.uniform1f(attrs.uniforms.quad, 0);
      }

      for (var j = 0; j < tris.length; j++) {
        // If we're rendering an effect to a frame buffer,
        // use the same points for the input and output
        let pnts = tris[j].input;
        let oPnts = tris[j].input;
        // If we're rendering the final output use the output points
        if (flip === 1) {
          if (shapes[i].type === "quad") {
            pnts = tris[j].output;
          }

          oPnts = tris[j].output;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, attrs.buffers.position);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            oPnts[0][0] * 2 - 1,
            oPnts[0][1] * -2 + 1,
            oPnts[1][0] * 2 - 1,
            oPnts[1][1] * -2 + 1,
            oPnts[2][0] * 2 - 1,
            oPnts[2][1] * -2 + 1,
          ]),
          gl.DYNAMIC_DRAW,
        );

        gl.vertexAttribPointer(
          attrs.locations.position,
          2,
          gl.FLOAT,
          false,
          0,
          0,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, attrs.buffers.texture);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            pnts[0][0],
            pnts[0][1],
            pnts[1][0],
            pnts[1][1],
            pnts[2][0],
            pnts[2][1],
          ]),
          gl.DYNAMIC_DRAW,
        );

        gl.vertexAttribPointer(
          attrs.locations.texture,
          2,
          gl.FLOAT,
          false,
          0,
          0,
        );

        gl.uniform1f(attrs.uniforms.opacity, ignoreOpacity ? 1 : opacity);
        gl.uniform1i(attrs.uniforms.sampler, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }
  }

  createShader(gl, type, source) {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }

    gl.deleteShader(shader);
  }

  createProgram(id, gl, vShaderSrc, fShaderSrc) {
    let vShader = this.createShader(gl, gl.VERTEX_SHADER, vShaderSrc);
    let fShader = this.createShader(gl, gl.FRAGMENT_SHADER, fShaderSrc);

    let program = gl.createProgram();

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    let success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (success) {
      let positionLocation = gl.getAttribLocation(program, "a_position");
      let positionBuffer = gl.createBuffer();
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      let textureLocation = gl.getAttribLocation(program, "a_texcoord");
      let textureBuffer = gl.createBuffer();
      gl.enableVertexAttribArray(textureLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
      gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 0, 0);

      let attrs = {
        id: id,
        program: program,
        locations: {
          position: positionLocation,
          texture: textureLocation,
        },
        buffers: {
          position: positionBuffer,
          texture: textureBuffer,
        },
        uniforms: {
          sampler: gl.getUniformLocation(program, "u_texture"),
          flip: gl.getUniformLocation(program, "u_flipY"),
          opacity: gl.getUniformLocation(program, "u_opacity"),
          effect: gl.getUniformLocation(program, "u_effect"),
          dimensions: gl.getUniformLocation(program, "u_dimensions"),
          elapsed: gl.getUniformLocation(program, "u_elapsed"),

          quad: gl.getUniformLocation(program, "u_quad"),
          translate: gl.getUniformLocation(program, "u_translate"),
          scale: gl.getUniformLocation(program, "u_scale"),
          vert_a: gl.getUniformLocation(program, "u_vertex_a"),
          vert_b: gl.getUniformLocation(program, "u_vertex_b"),
          vert_c: gl.getUniformLocation(program, "u_vertex_c"),
          vert_d: gl.getUniformLocation(program, "u_vertex_d"),
        },
      };

      return attrs;
    } else {
      gl.deleteProgram(program);
      return null;
    }
  }

  createContext() {
    this.attrs.main = this.createProgram(
      "__main__",
      this.gl,
      vertexShaderSrc,
      fragmentShader,
    );

    this.textures = new Array(6).fill(null).map((t) => {
      return this.initTexture(this.gl);
    });

    if (this.attrs.main !== null) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // let effects = this.state.effects;
      for (var i = 0; i < this.state.effects.length; i++) {
        let effect = this.state.effects[i];

        this.attrs.effects.push(
          this.createProgram(effect.id, this.gl, vertexShaderSrc, effect.code),
        );
      }
    }
  }

  updateContext(video) {
    this.gl.viewport(0, 0, this.options.width, this.options.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  initTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel,
    );

    // Turn off mips and set wrapping to clamp to edge so it
    // will work regardless of the dimensions of the video.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    return {
      src: texture,
      attrs: {
        textures: [],
        buffers: [],
      },
    };
  }

  updateTexture(gl, texture, video) {
    if (!video || (video.currentTime === 0 && !video.still)) {
      return;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    const { attrs } = texture;

    if (attrs.textures.length < 2 && attrs.buffers.length < 2) {
      for (let i = 0; i < 2; i++) {
        const bufferTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, bufferTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          video.still || video,
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        let frameBuffer = this.initFrameBuffer(gl, bufferTexture);

        attrs.textures.push(bufferTexture);
        attrs.buffers.push(frameBuffer);
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, texture.src);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      video.still || video,
    );

    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  initFrameBuffer(gl, texture) {
    let frameBuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );

    return frameBuffer;
  }

  loadVideo(idx, file, loading_time = 0) {
    this.videos[idx].onplay = () => {
      this.videos[idx].currentTime = loading_time;

      // if (!!loading_time) {
      //   setTimeout(() => {
      //     this.videos[idx].currentTime = loading_time + 1;
      //   }, 100);
      // }
    };

    if (ImageTypes.includes(file.type)) {
      let img = new Image();
      img.onload = () => {
        let gl = this.gl;
        let texture = this.textures[idx];

        this.videos[idx].still = img;
        // this.updateTexture(gl, texture, img);
      };
      let fr = new FileReader();
      fr.onload = function () {
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    } else {
      this.videos[idx].src = URL.createObjectURL(file);
    }
  }

  removeVideo(idx) {
    let video = this.videos[idx];

    this.textures[idx] = null;
    this.textures[idx] = this.initTexture(this.gl);

    if (!!video) {
      delete video.still;

      if (!video.stream) {
        video.pause();
        video.removeAttribute("src");
        video.removeAttribute("srcObject");
        video.load();
      } else {
        video.stream.getTracks().forEach((track) => {
          if (track.readyState == "live") {
            track.stop();
          }
        });

        video.poster = null;
        video.src = null;
        video.srcObject = null;
        video.load();

        delete video.stream;
      }

      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }

  async setMedia(videoIdx, deviceId) {
    let videos = document.querySelectorAll(".videos video");
    let vid = videos[videoIdx];

    let media = await navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        return [...devices].filter((d) => {
          return d.kind === "videoinput";
        });
      });

    let device = [...media].find((m) => {
      return m.deviceId === deviceId;
    });

    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: {
            exact: device.deviceId,
          },
        },
      });

      vid.srcObject = stream;
      this.videos[videoIdx] = vid;
      this.videos[videoIdx].stream = stream;
    } catch (err) {
      console.log("Failed to load webcam:", err);
    }
  }

  async removeMedia(videoIdx) {}

  updateSlots() {
    let { effects, scripts, slots } = this.state;

    this.scripts = slots
      .filter((slot) => {
        return slot?.target instanceof Script;
      })
      .map((slot) => {
        let { code } = slot.target;

        let fn = new Function(
          "state",
          "effect_x",
          "effect_y",
          "script_id",
          "registry",
          ScriptTemplate(code),
        );

        let obj = this.state.scripts.find((s) => s.id === slot.target.id);

        return {
          script: obj,
          fn: fn,
        };
      });

    this.effects = [
      ...slots
        .filter((slot) => {
          return slot?.target instanceof Effect;
        })
        .map((slot) => {
          return slot.target;
        }),
      ...effects.filter((effect) => {
        return !slots.find((slot) => slot?.target?.id === effect.id);
      }),
    ].map((e) => {
      let obj = this.state.effects.find((f) => f.id === e.id);

      return {
        effect: obj,
        fx: this.attrs.effects.find((fx) => fx.id === e.id),
      };
    });

    // console.log(this.effects.map((e) => e.fx.id));

    slots.map((slot, idx) => {
      if (slot?.type !== "script") {
        delete this.registry[idx];
      }
    });
  }

  createEffect(effect) {
    if (!effect.code) {
      return { error: "No Code" };
    }

    let existing = this.effects.findIndex((fx) => {
      return fx.id === effect.id;
    });

    if (existing !== -1) {
      return this.updateEffect(effect, idx);
    }

    let program = this.createProgram(
      effect.id,
      this.gl,
      vertexShaderSrc,
      effect.code,
    );

    if (program !== null) {
      this.attrs.effects.push(program);
    }

    this.updateSlots();
  }

  updateEffect(effect) {
    if (!effect.code) {
      return { error: "No Code" };
    }

    let existing = this.effects.findIndex((fx) => {
      return fx.id === effect.id;
    });

    if (existing !== -1) {
      return;
      // return this.updateEffect(effect, idx);
    }

    let program = this.createProgram(
      effect.id,
      this.gl,
      vertexShaderSrc,
      effect.code,
    );

    if (program !== null) {
      let oldIdx = this.attrs.effects.findIndex((f) => {
        return f.id === effect.id;
      });

      if (oldIdx !== -1) {
        let oldProgram = this.attrs.effects[oldIdx].program;

        this.attrs.effects[oldIdx] = program;
        this.effects.map((f) => {
          if (f.fx.id === effect.id) {
            f.fx = program;
          }
        });

        // console.log("Old Program:", oldProgram, "New Program:", program);

        this.gl.deleteProgram(oldProgram);
      } else {
        console.log("Couldn't find existing effect", effect.id);
      }
    }

    this.updateSlots();
  }

  removeEffect(effect) {
    let idx = this.attrs.effects.findIndex((fx) => {
      return fx.id === effect.id;
    });

    let fx = this.attrs.effects[idx];

    this.updateSlots();
    this.attrs.effects.splice(idx, 1);
    this.gl.deleteProgram(fx.program);
  }

  // setClock(clock, bpm) {
  //   if (clock === "default") {
  //     this.clock = setTimeout(
  //       () => {
  //         this.handleBeat({ data: [248] });
  //       },
  //       (60 / bpm) * 1000,
  //     );

  //     return;
  //   }

  //   if (!!navigator.requestMIDIAccess) {
  //     navigator.requestMIDIAccess().then(
  //       (midiAccess) => {
  //         for (const entry of midiAccess.inputs) {
  //           if (entry[1].name === clock) {
  //             this.clock = entry[1];

  //             entry[1].onmidimessage = this.handleBeat.bind(this);
  //           }
  //         }
  //       },
  //       (msg) => {
  //         console.error(`Failed to get MIDI access - ${msg}`);
  //       },
  //     );
  //   } else {
  //     console.log("No Midi Access");
  //   }
  // }

  // handleBeat(e) {
  //   if (e.data[0] === 248) {
  //     this.pulseCount = (this.pulseCount + 1) % 6;

  //     ////////// Tracking the count //////////
  //     if (this.pulseCount === 0) {
  //       if (this.resetBeat) {
  //         this.beat = [1, 1];
  //         this.timing = [Date.now(), Date.now()];
  //         this.resetBeat = false;
  //       } else {
  //         let next4th = this.beat[0];
  //         let next16th = (this.beat[1] + 1) % 5 || 1;
  //         this.timing[1] = Date.now();

  //         if (next16th === 1) {
  //           next4th = (next4th + 1) % 5 || 1;
  //           this.timing[0] = Date.now();
  //         }

  //         this.beat = [next4th, next16th];
  //         this.beatTick = true;
  //       }
  //     }
  //     ////////// End Tracking counting //////////

  //     ////////// Tracking the BPM //////////
  //     if (this.beatStart === null) {
  //       this.beatStart = Date.now();
  //     }

  //     if (this.pulseCount === 0) {
  //       let diff = Date.now() - this.beatStart;
  //       let bpm = 60 / (diff / 250);

  //       this.bpm = bpm;
  //       this.beatStart = Date.now();
  //     }
  //     ////////// End BPM tracking //////////
  //   }
  // }

  // setOne() {
  //   let duration = 125 * (this.bpm / 60);

  //   if (Date.now() - this.timing[1] < duration) {
  //     this.beat = [1, 1];
  //   } else {
  //     this.resetBeat = true;
  //   }
  // }
}
