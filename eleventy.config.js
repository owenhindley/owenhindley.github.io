
module.exports = async function(eleventyConfig) {
	eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
};
