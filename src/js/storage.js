import { ContextBlocks } from "building-blocks";

const keys = ["scripts", "effects", "shaders", "projects"];

class StorageManager extends ContextBlocks {
	constructor() {
		super({
			scripts: [],
			effects: [],
			shaders: [],
			projects: [],
			ready: false,
		});

		this.store = null;

		const request = window.indexedDB.open("SensoryControls", 3);
		request.onerror = (event) => {
			console.warn("Error opening IndexDB", event);
		};
		request.onsuccess = (event) => {
			this.store = event.target.result;
			this.ready = true;
			this.init();
		};

		request.onupgradeneeded = (event) => {
			this.store = event.target.result;

			let keys = ["scripts", "effects", "shaders", "projects"];

			keys.map((key) => {
				let objectStore = this.store.createObjectStore(key, { keyPath: "id" });
			});

			this.ready = true;
			this.init();
		};
	}

	async init() {
		this.scripts = await this.get("scripts");
		this.effects = await this.get("effects");
		this.shaders = await this.get("shaders");
		this.projects = await this.get("projects");
	}

	async get(key) {
		if (!keys.includes(key)) {
			return console.warn("Unknown storage key:", key);
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
				res();
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
