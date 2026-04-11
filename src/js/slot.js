import { ContextBlocks } from "building-blocks";

export class Slot extends ContextBlocks {
	constructor(idx) {
		super({
			id: `${idx}`,
			target: null,
		});
	}
}
