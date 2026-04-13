export const gen_id = () => {
	return (Math.random() * 1000000) | 0;
};

export const gen_slug = (str) => {
	str = str.replace(/^\s+|\s+$/g, ""); // trim
	str = str.toLowerCase();

	// remove accents, swap ñ for n, etc
	var from = "àáäâèéëêìíïîòóöôùúüûñç·_,:;";
	var to = "aaaaeeeeiiiioooouuuunc------";
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
	}

	console.log("STR", str);

	str = str
		.replace(/[^a-z0-9 -\/]/g, "") // remove invalid chars
		.replace(/\s+/g, "_") // collapse whitespace and replace by -
		.replace(/_+/g, "_"); // collapse dashes

	return str;
};

export const capitalize = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};
