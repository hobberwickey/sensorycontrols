import { ContextBlocks } from "building-blocks";

const gen_id = () => {
	return (Math.random() * 1000000) | 0;
};

export const DefaultTriangle = () => {
	return [
		{
			input: [
				[0, 0],
				[1, 0],
				[0.5, 1],
			],
			output: [
				[0, 0],
				[1, 0],
				[0.5, 1],
			],
		},
	];
};

export const DefaultQuad = () => {
	return [
		{
			input: [
				[0, 0],
				[1, 0],
				[1, 1],
			],
			output: [
				[0, 0],
				[1, 0],
				[1, 1],
			],
		},
		{
			input: [
				[0, 0],
				[1, 1],
				[0, 1],
			],
			output: [
				[0, 0],
				[1, 1],
				[0, 1],
			],
		},
	];
};

let quadMap = [
	[0, 0],
	[1, null],
	[2, 1],
	[null, 2],
];

export class Shape extends ContextBlocks {
	constructor(defaults) {
		let type = defaults?.type || "quad";
		let tris =
			defaults?.tris || (type === "quad" ? DefaultQuad() : DefaultTriangle());

		super({
			id: defaults?.id || gen_id(),
			type: defaults?.type || "quad",
			path: (defaults?.type || "quad") + "s",
			label: defaults?.label || "",
			opacity: defaults?.opacity || new Array(6).fill(0),
			tris: tris,
		});
	}

	setLabel(label) {
		this.label = label;
	}

	setPoint(idx, layer, x, y) {
		if (this.type === "tri") {
			this.tris[0][layer][idx][0] = x;
			this.tris[0][layer][idx][1] = y;
		}

		if (this.type === "quad") {
			let mapping0 = quadMap[idx];
			let mapping1 = quadMap[idx];

			if (mapping0 !== null) {
				this.tris[0][layer][mapping0][0] = x;
				this.tris[0][layer][mapping0][1] = y;
			}

			if (mapping1 !== null) {
				this.tris[1][layer][mapping1][0] = x;
				this.tris[1][layer][mapping1][1] = y;
			}
		}

		this.tris = [...this.tris];
	}
}
