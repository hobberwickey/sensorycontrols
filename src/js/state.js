import { ContextBlocks } from "building-blocks";
import { Effects } from "./effects";

import { Script } from "./script";
import { Effect } from "./effect";
import { Slot } from "./slot";
import { Video } from "./video";
import { Shape } from "./shape";

import { gen_id, capitalize } from "./utils";
import { storage } from "./storage.js";

const sync_chain = [
	"sync_start",
	"sync_ready",
	"sync_state",
	"sync_videos",
	"sync_video",
	"sync_media",
	"sync_end",
];

/**
 * Class for storing and syncing the application state across
 * all instances of the state object including in other windows
 * through the use of a SharedWorker object
 */
export class State extends ContextBlocks {
	constructor(primary) {
		super({
			loading: null,
			files: new Array(6).fill(null),
			selected: {
				video: null,
				slot: null,
			},
			slots: new Array(12).fill().map((_, idx) => new Slot(idx)),
			scripts: new Array(12).fill().map((_, idx) => new Script(idx)),
			effects: [],
			videos: new Array(6).fill().map((_, idx) => new Video(idx)),
			shapes: [],

			/** Metronome **/
			beat: [0, 0],
			bpm: 120,
		});

		// There should only ever be one primary instance of the state
		this.primary = primary || false;

		// For syncing
		this.loading_time = 0;
		this.loading_index = 0;

		// Set these to null initially
		this.worker = null;
		this.port = null;

		// Shouldn't receive any updates until it's synced
		this.syncing = true;

		// Should be unlocked initially
		this.locked = false;

		// If we're in the shared worker, leave the worker and port
		// set to null. Otherwise register this state with the
		// shared worker
		if (typeof window !== "undefined") {
			this.worker = new SharedWorker("./js/bridge.js");
			this.port = this.worker.port;

			this.port.addEventListener("message", (e) => {
				this.locked = true;

				if (typeof e.data !== "object") {
					let data = JSON.parse(e.data);
					let { action } = data;

					if (sync_chain.includes(action)) {
						return this.handleSync(data);
					} else {
						this.handleUpdate(data);
					}
				} else {
					this.files = this.files.toSpliced(this.loading, 1, e.data);
				}

				this.locked = false;
			});

			this.port.start();
			this.port.postMessage(
				JSON.stringify({
					action: "sync_start",
					data: { primary: this.primary },
				}),
			);
		} else {
			// This is in the worker
			this.syncing = false;
		}

		// If the files have changed, broadcast the new file
		// so long as the loading slot has been set
		this.listen("files", (files, oldFiles) => {
			if (this.loading !== null && !this.locked && !!this.port) {
				this.port.postMessage(files[this.loading]);
				this.loading = null;
			} else {
				let newMediaIdx = files.findIndex((file, idx) => {
					return (
						file !== null &&
						file.kind === "videoinput" &&
						file.deviceId !== oldFiles[idx]?.deviceId
					);
				});

				this.post(
					"update_media",
					{ media: files[newMediaIdx] },
					{ idx: newMediaIdx },
				);
			}
		});

		// Set the loading slot to prepare for a video
		// being loaded
		this.listen("loading", (loading) => {
			this.post("update_state", { loading });
		});

		// Update whatever is selected
		this.listen("selected", (selected) => {
			this.post("update_state", { selected });
		});

		this.listen("shapes", (shapes) => {
			this.post("update_shapes", { shapes });
		});

		this.listen("effects", (effects) => {
			this.post("update_effects", { effects });
		});

		this.listen("bpm", (bpm) => {
			this.post("update_metronome", { bpm });
		});

		this.listen("beat", (beat) => {
			this.post("update_metronome", { beat });
		});

		// Add events to the script objects
		this.scripts.map((script, idx) => {
			this.addScriptEvents(script, idx);
		});

		// Add events to the effect object
		this.effects.map((effect, idx) => {
			this.addEffectEvents(effect, idx);
		});

		// Add events to the video objects
		this.videos.map((video, idx) => {
			this.addVideoEvents(video, idx);
		});

		// Add events to the initial shape objects
		this.shapes.map((shape, idx) => {
			this.addShapeEvents(shape);
		});

		// Add events to the slot objects
		this.slots.map((slot, idx) => {
			this.addSlotEvents(slot, idx);
		});
	}

	// Only for the primary instance, after the sync_end
	// message is recieved, load everything from storage
	// and then send the sync_ready message
	async init() {
		// Load up all the Effects
		let customEffects = await storage.get("effects");
		[...Effects, ...customEffects].map((effect) => {
			this.addEffect(effect);
		});

		this.post("sync_ready");
	}

	// Broadcasts updates to the shared worker
	post(action, updates, data) {
		if (this.locked || !this.port) {
			return;
		}

		this.port.postMessage(
			JSON.stringify({
				action,
				updates,
				data,
			}),
		);
	}

	// Adds a shape, and attaches events
	addEffect(e) {
		let idx = this.effects.length;
		let effect = new Effect({ id: e.id }, e);

		this.addEffectEvents(effect, idx);
		this.effects = [...this.effects, effect];

		return effect;
	}

	// Adds a shape, and attaches events
	addShape(type) {
		let shape = new Shape({
			label: `${capitalize(type)} ${this.shapes.length + 1}`,
			opacity: this.videos.map((v) => v.opacity),
			type,
		});
		let idx = this.shapes.length;

		this.addShapeEvents(shape);
		this.shapes = [...this.shapes, shape];

		return shape;
	}

	// Remove Shape
	removeShape(shape) {
		this.shapes = this.shapes.filter((s) => s.id !== shape.id);
	}

	// Add broadcast events to a shape
	addShapeEvents(shape) {
		shape.listen("label", (label) => {
			this.post("update_shape", { label }, { id: shape.id });
		});

		shape.listen("opacity", (opacity) => {
			this.post("update_shape", { opacity }, { id: shape.id });
		});

		shape.listen("tris", (tris) => {
			this.post("update_shape", { tris }, { id: shape.id });
		});
	}

	// Adds broadcast events to a video
	addVideoEvents(video, idx) {
		video.listen("label", (label) => {
			this.post("update_video", { label }, { idx });
		});

		video.listen("opacity", (opacity) => {
			this.post("update_video", { opacity }, { idx });
		});
	}

	// Adds broadcast events to an effect
	addEffectEvents(effect, idx) {
		effect.listen("label", (label) => {
			this.post("update_effect", { label }, { idx, id: effect.id });
		});

		effect.listen("code", (code) => {
			this.post("update_effect", { code }, { idx, id: effect.id });
		});

		effect.listen("values", (values) => {
			this.post("update_effect", { values }, { idx, id: effect.id });
		});
	}

	// Adds broadcast events to a script
	addScriptEvents(script, idx) {
		script.listen("id", (id) => {
			this.post("update_script", { id }, { idx });
		});

		script.listen("label", (label) => {
			this.post("update_script", { label }, { idx });
		});

		script.listen("code", (code) => {
			this.post("update_script", { code }, { idx });
		});

		script.listen("values", (values) => {
			this.post("update_script", { values }, { idx });
		});

		script.listen("disabled", (disabled) =>
			this.post("update_script", { disabled }, { idx }),
		);
	}

	// Adds broadcast events to a slot
	addSlotEvents(slot, idx) {
		slot.listen("target", (target) => {
			this.post("update_slot", { target }, { idx });
		});
	}

	// Updates this state's values from an update event
	handleUpdate(msg) {
		if (this.syncing) {
			return;
		}

		let { action, updates, data } = msg;

		if (action === "update_shapes") {
			return this.handleShapeUpdates(msg);
		}

		if (action === "update_effects") {
			return this.handleEffectUpdates(msg);
		}

		let target = null;
		if (action === "update_state") {
			target = this;
		}

		if (action === "update_script") {
			target = this.scripts[data.idx];
		}

		if (action === "update_effect") {
			target = this.effects.find((e) => e.id === data.id);
		}

		if (action === "update_video") {
			target = this.videos[data.idx];
		}

		if (action === "update_shape") {
			target = this.shapes.find((s) => s.id === data.id);
		}

		if (action === "update_slot") {
			target = this.slots[data.idx];
		}

		if (action === "update_media") {
			target = this;
		}

		if (action === "update_metronome") {
			target = this;
		}

		for (let x in updates) {
			// Special case for updating the slot target, since that
			// should be a class instance
			if (action === "update_slot" && x === "target") {
				if (updates[x].type === "effect") {
					target[x] = this.effects.find((e) => e.id === updates[x].id);
				}

				if (updates[x].type === "script") {
					target[x] = this.scripts[data.idx];
				}
			} else if (action === "update_media") {
				target.files = this.files.toSpliced(data.idx, 1, updates.media);
			} else {
				target[x] = updates[x];
			}
		}
	}

	handleShapeUpdates(msg) {
		let { action, updates, data } = msg;
		let { shapes } = updates;

		let deletes = this.shapes.filter(
			(s) => !shapes.find((sh) => sh.id === s.id),
		);

		let additions = shapes
			.filter((s) => !this.shapes.find((sh) => sh.id === s.id))
			.map((s) => {
				let shape = new Shape(s);
				this.addShapeEvents(shape);
				return shape;
			});

		this.shapes = [
			...this.shapes.filter((s) => !deletes.find((sh) => sh.id == s.id)),
			...additions,
		];
	}

	handleEffectUpdates(msg) {
		let { action, updates, data } = msg;
		let { effects } = updates;

		let deletes = this.effects.filter(
			(e) => !effects.find((ef) => ef.id === e.id),
		);

		let additions = effects
			.filter((e) => !this.effects.find((ef) => ef.id === e.id))
			.map((e) => {
				let effect = new Effect({ id: e.id }, e);
				this.addEffectEvents(effect);
				return effect;
			});

		this.effects = [
			...this.effects.filter((e) => !deletes.find((ef) => ef.id == e.id)),
			...additions,
		];
	}

	handleSync(msg) {
		let { action, updates, data } = msg;

		if (action === "sync_start") {
			this.locked = false;
			this.post("sync_state");
			this.locked = true;
		}

		if (action === "sync_state") {
			this.handleStateSync(msg);
			this.locked = false;
			this.post("sync_videos", { idx: 0 });
			this.locked = true;
		}

		if (action === "sync_videos") {
			this.loading_index = this.loading_index + 1;

			if (this.loading_index < 6) {
				this.locked = false;
				this.post("sync_videos", { idx: this.loading_index });
				this.locked = true;
			} else {
				this.locked = false;
				this.post("sync_end");
				this.locked = true;
			}
		}

		if (action === "sync_video") {
			this.loading = updates.loading;
			this.loading_time = updates.loading_time;
			// TODO: do something with the loading_time
		}

		if (action === "sync_media") {
			this.files = this.files.toSpliced(data.idx, 1, updates.media);
		}

		if (action === "sync_end") {
			this.loading_index = 0;
			this.loading_time = 0;
			this.loading = null;
			this.locked = false;
			this.syncing = false;

			if (this.primary) {
				this.init();
			}
		}
	}

	handleStateSync(msg) {
		let { action, updates, data } = msg;

		let {
			loading,
			selected,
			scripts,
			effects,
			videos,
			shapes,
			slots,
			bpm,
			beat,
		} = updates;

		this.loading = loading;
		this.selected = { ...selected };
		this.bpm = bpm;
		this.beat = beat;

		this.videos = videos.map((v, idx) => {
			let video = this.videos[idx];

			video.label = v.label;
			video.opacity = v.opacity;
			video.code = v.code;

			return video;
		});

		this.shapes = shapes.map((s, idx) => {
			let shape = this.shapes.find((p) => p.id === s.id);

			if (!shape) {
				shape = new Shape(s);
				this.addShapeEvents(shape);
			}

			shape.id = s.id;
			shape.type = s.type;
			shape.label = s.label;
			shape.opacity = s.opacity;
			shape.tris = s.tris;

			return shape;
		});

		this.scripts = scripts.map((s, idx) => {
			let script = this.scripts[idx];

			script.type = s.type;
			script.label = s.label;
			script.disabled = s.disabled;
			script.values = s.values;
			script.code = s.code;

			return script;
		});

		this.effects = effects.map((e, idx) => {
			let effect = this.effects.find((fx) => fx.id === e.id);

			if (!!effect) {
				effect.type = e.type;
				effect.label = e.label;
				effect.values = e.values;
				effect.code = e.code;
			} else {
				effect = this.addEffect(e);
			}

			return effect;
		});

		this.slots = slots.map((s, idx) => {
			let slot = this.slots[idx];

			if (s.target === null) {
				slot.target = null;
			}

			if (s.target?.type === "script") {
				slot.target = this.scripts.find((script) => script.id === s.target?.id);
			}

			if (s.target?.type === "effect") {
				slot.target = this.effects.find((effect) => effect.id === s.target?.id);
			}

			return slot;
		});
	}
}
