module.exports = function(eleventyConfig) {
	eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

	// every award and nomination from the articles' `awards` front matter, for the About page:
	// newest first, and within a year winners before nominations
	eleventyConfig.addCollection("awards", (collectionApi) => {
		const isNomination = (a) => /^(nominated|finalist)/i.test(a.title);
		return collectionApi.getFilteredByTag("article")
			.flatMap((article) => (article.data.awards || []).map((award) => ({
				...award,
				project: article.data.title,
				projectUrl: article.url,
			})))
			.sort((a, b) => String(b.when).localeCompare(String(a.when)) || isNomination(a) - isNomination(b));
	});
};
