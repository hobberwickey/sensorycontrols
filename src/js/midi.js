import { ContextBlocks } from "building-blocks";

import app from "../app.js";

const notes = {
	video: 10,
	slot: 11,
	statuses: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
	values: [
		24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
		43, 44, 45, 46, 47,
	],
	opacity: [48, 49, 50, 51, 52, 53],
};

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
			app.setValues(idx, velocity / 127);
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

		this.locked = false;

		this.knobs = null;
		this.sliders = null;
		this.rotaries = null;

		const onMIDISuccess = (midiAccess) => {
			for (const entry of midiAccess.inputs) {
				this.inputs = [...this.inputs, entry[1]];

				if (entry[1].name === "Sensory Controller") {
					this.input = entry[1];

					entry[1].onmidimessage = (e) => {
						let note = e.data[1];
						let velocity = e.data[2];

						console.log(note, velocity);

						this.locked = true;

						if (!!this.knobs) {
							this.knobs.onMsg(note, velocity);
						}

						if (!!this.sliders) {
							this.sliders.onMsg(note, velocity);
						}

						if (!!this.rotaries) {
							this.rotaries.onMsg(note, velocity);
						}

						this.locked = false;
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

			app.state.listen(
				"selected",
				(selected, previous) => {
					if (selected.video !== previous.video) {
						this.sendMsg(notes.video, selected.video);
					}

					if (selected.slot !== previous.slot) {
						this.sendMsg(notes.slot, selected.slot);
					}
				},
				"midi-handler-selected",
			);

			app.state.videos.map((video, idx) => {
				video.listen(
					"opacity",
					(opacity) => {
						this.sendMsg(notes.opacity[idx], (opacity * 127) | 0);
					},
					"midi-handler",
				);
			});

			app.state.scripts.map((script, idx) => {
				script.listen(
					"values",
					(values) => {
						app.state.slots.map((slot, idx) => {
							if (!this.locked && slot.target?.id === script.id) {
								this.sendMsg(notes.values[idx * 2], (values[0] * 127) | 0);
								this.sendMsg(notes.values[idx * 2 + 1], (values[1] * 127) | 0);
							}
						});
					},
					"midi-handler",
				);

				script.listen(
					"disabled",
					(disabled) => {
						app.state.slots.map((slot, idx) => {
							if (slot.target?.id === script.id) {
								this.sendMsg(notes.statuses[idx], +disabled);
							}
						});
					},
					"midi-handler",
				);
			});

			app.state.listen(
				"effects",
				(effects) => {
					effects.map((effect) => {
						effect.listen(
							"values",
							(values) => {
								let vidIdx = app.state.selected.video;

								if (vidIdx === null) {
									return;
								}

								app.state.slots.map((slot, idx) => {
									if (!this.locked && slot.target?.id === effect.id) {
										this.sendMsg(
											notes.values[idx * 2],
											(values[vidIdx][0] * 127) | 0,
										);
										this.sendMsg(
											notes.values[idx * 2 + 1],
											(values[vidIdx][1] * 127) | 0,
										);
									}
								});
							},
							"midi-handler",
						);

						effect.listen(
							"disabled",
							(disabled) => {
								app.state.slots.map((slot, idx) => {
									if (slot.target?.id === effect.id) {
										this.sendMsg(notes.statuses[idx], +disabled);
									}
								});
							},
							"midi-handler",
						);
					});
				},
				"midi-handler-effects",
			);
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

	sendMsg(note, value) {
		this.output.send([0xb0, note, value]);
	}
}
