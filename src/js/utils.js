export const gen_id = () => {
	return (Math.random() * 1000000) | 0;
};

export const capitalize = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};
