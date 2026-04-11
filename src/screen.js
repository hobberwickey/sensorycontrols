import { ContextBlocks } from "building-blocks";

import OutputScreen from "./components/output-screen.html";

class App extends ContextBlocks {
	constructor() {
		super({
			name: "Sensory Controls",
		});
	}
}

window.addEventListener("load", () => {
	let app = new App();
	let screen = document.createElement("output-screen");

	screen.width = 1280;
	screen.height = 720;

	document.body.appendChild(screen);

	// screen.width = 1280;
	// screen.height = 720;

	screen.className = "fullscreen";

	window.addEventListener("beforeunload", () => {
		console.log(screen.videos);
	});
});
