import { ContextBlocks } from "building-blocks";

const gen_id = () => {
	return (Math.random() * 1000000) | 0;
};

// 'handle' is for storing a FileSystemFileHandle obj, so that
// the videos can be saved with the projects and loaded again
// later. Pretty cool

export class Video extends ContextBlocks {
	constructor(idx, defaults) {
		super({
			id: gen_id(),
			type: defaults?.type || "video",
			handle: null, // Depricated, all file handles will be stored so just use the playlist
			repeat: true,
			label: defaults?.label || `Video ${idx + 1}`,
			opacity: defaults?.opacity || 0,
			code: defaults?.code || ``,
			current: null,
			position: 0,
			playlist: [],
		});
	}
}
