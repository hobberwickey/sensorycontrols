import { ContextBlocks } from "building-blocks";

export class MIDI extends ContextBlocks {
	constructor() {
		super({
			notes: {
				buttons: {
					48: 0,
					53: 1,
					50: 2,
					51: 3,
					49: 4,
					52: 5,
				},
				knobs: {
					43: 0,
					44: 1,
				},
				sliders: {
					input: {
						56: 2,
						54: 1,
						55: 0,
					},
					output: {
						45: 0,
						46: 1,
						47: 2,
					},
				},
			},
		});
	}
}
