import { ContextBlocks } from "building-blocks";

export class Effect extends ContextBlocks {
	constructor(effect, defaults) {
		super({
			id: effect.id,
			path: defaults.path || "",
			type: "effect",
			disabled: defaults.disabled || false,
			active: defaults.active || false,
			label: defaults?.label || effect.label,
			values: defaults?.values || new Array(6).fill(null).map((v) => [0, 0]),
			code: defaults?.shader || defaults.code || ``,
		});
	}
}
