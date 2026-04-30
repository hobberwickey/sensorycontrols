export const vertext_shader = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;

  uniform float u_flipY;

  varying vec2 v_texcoord;
  
  void main() {
    gl_Position = vec4(a_position * vec2(1, u_flipY), 0.0, 1.0);
    v_texcoord = a_texcoord;
  }
`;

export const gen_id = () => {
	return (Math.random() * 1000000) | 0;
};

export const gen_slug = (str) => {
	str = str.replace(/^\s+|\s+$/g, ""); // trim
	str = str.toLowerCase();

	// remove accents, swap ñ for n, etc
	var from = "àáäâèéëêìíïîòóöôùúüûñç·_,:;";
	var to = "aaaaeeeeiiiioooouuuunc------";
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
	}

	console.log("STR", str);

	str = str
		.replace(/[^a-z0-9 -\/]/g, "") // remove invalid chars
		.replace(/\s+/g, "_") // collapse whitespace and replace by -
		.replace(/_+/g, "_"); // collapse dashes

	return str;
};

export const capitalize = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const validate_shader = (fragment_shader) => {
	let canvas = document.createElement("canvas");
	let gl = canvas.getContext("webgl");
	let shader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(shader, fragment_shader);
	gl.compileShader(shader);

	let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return null;
	} else {
		return gl.getShaderInfoLog(shader);
	}
};
