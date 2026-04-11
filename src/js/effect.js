import { ContextBlocks } from "building-blocks";

export class Effect extends ContextBlocks {
	constructor(effect, defaults) {
		super({
			id: effect.id,
			type: "effect",
			label: defaults?.label || effect.label,
			values: defaults?.values || new Array(6).fill(null).map((v) => [0, 0]),
			code: defaults?.code || ``,
		});
	}
}
