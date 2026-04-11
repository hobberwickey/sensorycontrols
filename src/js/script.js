import { ContextBlocks } from "building-blocks";

export class Script extends ContextBlocks {
	constructor(idx, defaults) {
		super({
			id: `${idx}`,
			type: "script",
			label: defaults?.label || `Script ${idx + 1}`,
			disabled: defaults?.disabled || false,
			values: defaults?.values || [0, 0],
			code: defaults?.code || ``,
		});
	}
}
