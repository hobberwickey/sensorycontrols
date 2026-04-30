// TODO: implement PIP instead of the child window.
// Update, doesn't seem to work with a WebGL context

const target = document.getElementById("target");
const source = document.createElement("canvas");
const ctx = source.getContext("2d");
ctx.font = "50px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
anim();

const stream = source.captureStream();
target.srcObject = stream;

const btn = document.getElementById("btn");
if (target.requestPictureInPicture) {
	btn.onclick = (e) => target.requestPictureInPicture();
} else {
	btn.disabled = true;
}

function anim() {
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, source.width, source.height);
	ctx.fillStyle = "black";
	ctx.fillText(
		new Date().toTimeString().split(" ")[0],
		source.width / 2,
		source.height / 2,
	);
	requestAnimationFrame(anim);
}
