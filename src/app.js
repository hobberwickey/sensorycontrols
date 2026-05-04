import { ContextBlocks } from "building-blocks";
import { State } from "./js/state.js";
import { MIDI } from "./js/midi.js";
import { Effects } from "./js/effects.js";
import { Effect } from "./js/effect.js";
import { Script } from "./js/script.js";

import { storage } from "./js/storage.js";
import { gen_id } from "./js/utils.js";

class App extends ContextBlocks {
	constructor() {
		super({
			id: gen_id(),
			name: "New Project",
			saved: false,
			state: new State(true),
			midi: new MIDI(),
		});

		this.screen = null;
		// this.init();
	}

	updateSelected(type, idx) {
		this.state.selected = { ...this.state.selected, [type]: idx };
	}

	loadVideo(idx, file, fileHandle) {
		this.state.loading = idx;
		this.state.files = this.state.files.toSpliced(idx, 1, file);
		this.state.videos[idx].handle = fileHandle;
		this.state.videos[idx].loaded = true;
	}

	updateVideoMedia(idx, source) {
		this.state.files = this.state.files.toSpliced(idx, 1, source);
		this.state.videos[idx].loaded = true;
	}

	removeVideo(idx) {
		this.state.loading = idx;
		this.state.files[idx] = null;
		this.state.files = [...this.state.files];

		this.state.videos[idx].loaded = false;
	}

	updateOpacity(idx, value) {
		let { shapes, videos } = this.state;

		videos[idx].opacity = value;
		for (let i = 0; i < shapes.length; i++) {
			shapes[i].opacity[idx] = value;
			shapes[i].opacity = [...shapes[i].opacity];
		}

		if (this.state.selected.video !== idx) {
			this.updateSelected("video", idx);
		}
	}

	/**
	 * Sets the X or Y value for the selected effect/script/video
	 * @param {Number} idx   0 for X, 1 for Y
	 * @param {Float} value 	Must be 0-1
	 */
	setValues(idx, value) {
		let { video, slot } = this.state?.selected;

		if (slot === null || video === null) {
			return;
		}

		let { target } = this.state.slots[slot];

		if (target instanceof Effect) {
			target.values[video][idx] = value;
		}

		if (target instanceof Script) {
			target.values[idx] = value;
		}

		target.values = [...target.values];
	}

	/**
	 * Sets all effects on this video to 0
	 * @param  {Number} idx [description]
	 */
	clearValues(idx) {
		this.state.effects.map((e) => {
			e.values[idx][0] = 0;
			e.values[idx][1] = 0;

			e.values = [...e.values];
		});
	}

	setSlot(idx, effect) {
		let slots = this.state.slots;

		let old = slots[idx].target;

		if (effect === null) {
			slots[idx].target = null;
		} else if (effect === "__script") {
			slots[idx].target = this.state.scripts[idx];
			slots[idx].target.values = [0, 0];
		} else {
			slots[idx].target =
				this.state.effects.find((e) => e.id === effect) || null;
			slots[idx].target.values = new Array(6).fill(null).map((v) => [0, 0]);
		}

		if (old !== null && old !== slots[idx].target) {
			if (old.type === "effect") {
				old.values = new Array(6).fill(null).map((v) => [0, 0]);
			} else {
				old.values = [0, 0];
			}
		}

		this.state.slots = [...this.state.slots];
	}

	updateSlot(idx, updates) {
		let slot = this.state.slots[idx];
		let target = slot.target;

		if (!target) {
			return;
		}

		for (let x in updates) {
			target[x] = updates[x];
		}

		this.state.slots = [...this.state.slots];
	}

	updateEffect(effect) {
		let existingIdx = this.state.effects.findIndex((e) => e.id === effect.id);

		if (existingIdx === -1) {
			this.state.addEffect(effect);
		} else {
			let old = this.state.effects[existingIdx];

			if (old.label !== effect.label) {
				old.label = effect.label;
			}

			if (old.code !== effect.shader) {
				old.code = effect.shader;
			}

			if (old.active !== effect.active) {
				old.active = effect.active;
			}

			if (old.disabled !== effect.disabled) {
				old.disabled = effect.disabled;
			}
		}
	}

	removeEffect(effect) {
		let existingIdx = this.state.effects.findIndex((e) => e.id === effect.id);
		let existing = this.state.effects[existingIdx];

		this.state.slots.map((slot, idx) => {
			if (slot.target === existing) {
				this.setSlot(idx, null);
			}
		});

		this.state.effects = this.state.effects.toSpliced(existingIdx, 1);
	}

	async saveProject() {
		let existing = await storage.getItem("projects", this.id);

		// If existing open the confirmation dialog

		let project = {
			id: this.id,
			name: this.name,
			shapes: this.state.shapes.map((s) => {
				return JSON.parse(JSON.stringify(s));
			}),
			videos: this.state.videos.map((v) => {
				return {
					id: v.id,
					handle: v.handle,
					label: v.label,
					opacity: v.opacity,
					code: v.code,
				};
			}),
			effects: this.state.effects.map((e) => {
				return JSON.parse(JSON.stringify(e));
			}),
			scripts: this.state.scripts.map((s) => {
				return JSON.parse(JSON.stringify(s));
			}),
			slots: this.state.slots.map((s) => {
				return {
					target_type: s?.target?.type || null,
					target_id: s?.target?.id || null,
				};
			}),
		};

		storage.upsertItem("projects", project);

		this.saved = true;
	}

	async loadProject(project) {
		if (!project) {
			return;
		}

		this.id = project.id;
		this.name = project.name;

		this.state.shapes = [];
		project.shapes.map((shape, idx) => {
			let s = app.state.addShape(shape.type);

			s.id = shape.id;
			s.label = shape.label;
			s.opacity = shape.opacity;
			s.tris = shape.tris;
		});

		project.videos.map(async (video, idx) => {
			let v = this.state.videos[idx];
			let file = null;

			if (video.handle !== null) {
				if ((await video.handle.queryPermission()) === "granted") {
					file = await video.handle.getFile();
				}

				if ((await video.handle.requestPermission()) === "granted") {
					file = await video.handle.getFile();
				}
			}

			v.id = video.id;
			v.handle = null;
			v.opacity = 0;
			v.code = video.code;

			this.updateOpacity(idx, video.opacity);
			if (file !== null) {
				this.loadVideo(idx, file, video.handle);
			}
		});

		project.scripts.map((script, idx) => {
			let s = this.state.scripts[idx];

			s.id = script.id;
			s.label = script.label;
			s.disabled = script.disabled;
			s.values = script.values;
			s.code = script.code;
			code: script.code;
		});

		project.effects.map((effect, idx) => {
			let e = this.state.effects[idx];

			e.id = effect.id;
			e.label = effect.label;
			e.values = effect.values;
			e.code = effect.code;
		});

		project.slots.map((slot, idx) => {
			let s = this.state.slots[idx];

			s.target = null;
			if (slot.target_type === "effect") {
				s.target = this.state.effects.find((e) => e.id === slot.target_id);
			}

			if (slot.target_type === "script") {
				s.target = this.state.scripts.find((s) => s.id === slot.target_id);
			}
		});

		this.saved = true;
	}

	async deleteProject(project) {
		storage.removeItem("projects", project);
	}
}

let app = new App();

export default app;
