import { ContextBlocks } from "building-blocks";

import app from "../app.js";

export class Knobs extends ContextBlocks {
	constructor(input, output) {
		super({
			notes: [10, 11, 12, 13, 14, 15],
		});

		this.input = input;
		this.output = output;
	}

	onMsg(note, velocity) {
		let idx = this.notes.indexOf(note);
		if (idx !== -1) {
			app.updateOpacity(idx, velocity / 127);
		}
	}

	sendMsg(idx, value) {
		console.log(idx, value);
	}
}

export class Rotaries extends ContextBlocks {
	constructor(input, output) {
		super({
			notes: [31, 30],
		});

		this.input = input;
		this.output = output;
	}

	onMsg(note, velocity) {
		let idx = this.notes.indexOf(note);
		let indexes = [
			[0, 1, 2, 3, 4, 5],
			[6, 7, 8, 9, 10, 11],
		];

		if (idx !== -1) {
			let values = indexes[idx];
			let currentValue = app.state.selected.slot;
			let currentIndex = values.indexOf(currentValue);

			let nextIndex;
			if (velocity === 0) {
				nextIndex =
					currentIndex === -1
						? values[0]
						: values[currentIndex + 1] ?? values[0];
			} else {
				nextIndex =
					currentIndex === -1
						? values[0]
						: values[currentIndex - 1] ?? values[5];
			}

			app.updateSelected("slot", nextIndex);
		}
	}

	sendMsg(idx, value) {
		console.log(idx, value);
	}
}

export class Sliders extends ContextBlocks {
	constructor(input, output) {
		super({
			notes: [40, 41],
		});

		this.input = input;
		this.output = output;
	}

	onMsg(note, velocity) {
		let idx = this.notes.indexOf(note);

		if (idx !== -1) {
			console.log(idx, velocity / 127);
			// app.setValues(idx, velocity / 127);
		}
	}

	sendMsg(idx, value) {
		console.log(idx, value);
	}
}

export class MIDI extends ContextBlocks {
	constructor() {
		super({
			inputs: [],
			outputs: [],
			input: null,
			output: null,
		});

		this.knobs = null;
		this.sliders = null;
		this.rotaries = null;

		const onMIDISuccess = (midiAccess) => {
			for (const entry of midiAccess.inputs) {
				console.log(entry[1].name);

				this.inputs = [...this.inputs, entry[1]];

				if (entry[1].name === "Sensory Controller") {
					this.input = entry[1];

					entry[1].onmidimessage = (e) => {
						let note = e.data[1];
						let velocity = e.data[2];

						console.log(note, velocity);

						if (!!this.knobs) {
							this.knobs.onMsg(note, velocity);
						}

						if (!!this.sliders) {
							this.sliders.onMsg(note, velocity);
						}

						if (!!this.rotaries) {
							this.rotaries.onMsg(note, velocity);
						}
					};
				}
			}

			for (const entry of midiAccess.outputs) {
				this.outputs = [...this.outputs, entry[1]];

				if (entry[1].name === "Sensory Controller") {
					this.output = entry[1];
				}
			}

			this.knobs = new Knobs(this.input, this.output);
			this.rotaries = new Rotaries(this.input, this.output);
			this.sliders = new Sliders(this.input, this.output);

			app.state.listen("selected", (selected) => {
				// Stub
			});

			app.state.videos.map((video, idx) => {
				video.listen("opacity", (opacity) => {
					if (!!this.knobs) {
						this.knobs.sendMsg(idx, opacity * 127);
					}
				});
			});

			app.state.effects.map((effect, idx) => {
				effect.listen("values", (values) => {
					if (!!this.sliders) {
						this.sliders.sendMsg(idx, 0, values[0]);
						this.sliders.sendMsg(idx, 1, values[1]);
					}
				});
			});

			// this.leds = new LEDs(
			//   this.state,
			//   this.config,
			//   this.midiOutput,
			//   this.midiInput,
			// );

			// this.sliders = new Sliders(
			//   this.state,
			//   this.config,
			//   this.midiOutput,
			//   this.midiInput,
			// );

			// this.midiAccess = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
		};

		const onMIDIFailure = (msg) => {
			console.error(`Failed to get MIDI access - ${msg}`);
		};

		if (!!navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
		} else {
			console.log("No Midi Access");
		}
	}
}
