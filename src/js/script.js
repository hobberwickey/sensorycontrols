import { ContextBlocks } from "building-blocks";

export class Script extends ContextBlocks {
	constructor(idx, defaults) {
		super({
			id: `${idx}`,
			path: defaults?.path || "",
			type: "script",
			label: defaults?.label || `Script ${idx + 1}`,
			disabled: defaults?.disabled || false,
			assignment: null,
			values: defaults?.values || [0, 0],
			code: defaults?.code || ``,
		});
	}
}
