import { ContextBlocks } from "building-blocks";

const keys = ["scripts", "effects", "shaders", "projects"];

class StorageManager extends ContextBlocks {
	constructor() {
		super({
			scripts: [],
			effects: [],
			shaders: [],
			projects: [],
		});

		this.store = null;
		this.queue = [];

		if (typeof window === "undefined") {
			return;
		}

		const request = window.indexedDB.open("SensoryControls", 3);
		request.onerror = (event) => {
			console.warn("Error opening IndexDB", event);
		};
		request.onsuccess = (event) => {
			this.store = event.target.result;
			this.init();
		};

		request.onupgradeneeded = (event) => {
			this.store = event.target.result;

			let keys = ["scripts", "effects", "shaders", "projects"];

			keys.map((key) => {
				let objectStore = this.store.createObjectStore(key, { keyPath: "id" });
			});

			this.init();
		};
	}

	async init() {
		this.scripts = await this.get("scripts");
		this.effects = await this.get("effects");
		this.shaders = await this.get("shaders");
		this.projects = await this.get("projects");

		this.resolveQueue();
	}

	async resolveQueue() {
		this.queue = this.queue.filter((fn) => {
			fn();
			return false;
		});
	}

	async get(key) {
		if (!keys.includes(key)) {
			return console.warn("Unknown storage key:", key);
		}

		if (!this.store) {
			let response = new Promise((res, rej) => {
				this.queue.push(async () => {
					let objs = await this.get(key);
					res(objs);
				});
			});

			return response;
		}

		const request = this.store
			.transaction([key], "readwrite")
			.objectStore(key)
			.getAll();

		return new Promise((res, rej) => {
			request.onsuccess = (event) => {
				res(event.target.result);
				// event.target.result === customer.ssn;
			};
		});
	}

	async getItem(key, id) {
		const request = this.store
			.transaction([key], "readwrite")
			.objectStore(key)
			.get(id);

		return new Promise((res, rej) => {
			request.onsuccess = (event) => {
				res(event.target.result);
			};
		});
	}

	async upsertItem(key, obj) {
		const request = this.store
			.transaction([key], "readwrite")
			.objectStore(key)
			.put(obj);

		return new Promise(async (res, rej) => {
			request.onsuccess = async (event) => {
				this[key] = await this.get(key);
				res(obj);
			};
		});
	}

	async removeItem(key, obj) {
		const request = this.store
			.transaction([key], "readwrite")
			.objectStore(key)
			.delete(obj.id);

		return new Promise(async (res, rej) => {
			request.onsuccess = async (event) => {
				this[key] = await this.get(key);
				res();
			};
		});
	}
}

export const storage = new StorageManager();
