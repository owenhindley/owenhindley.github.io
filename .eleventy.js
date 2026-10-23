module.exports = function(eleventyConfig) {
	eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

	// every award and nomination from the articles' `awards` front matter, for the About page:
	// newest first, and within a year winners before finalists and nominations.
	// `nomination` (title mentions "Nominated" or "Nomination") splits them into the page's two tabs
	eleventyConfig.addCollection("awards", (collectionApi) => {
		const isRunnerUp = (a) => /^(nominated|finalist)/i.test(a.title);
		return collectionApi.getFilteredByTag("article")
			.flatMap((article) => (article.data.awards || []).map((award) => ({
				...award,
				nomination: /nominat(ed|ion)/i.test(award.title),
				project: article.data.title,
				projectUrl: article.url,
			})))
			.sort((a, b) => String(b.when).localeCompare(String(a.when)) || isRunnerUp(a) - isRunnerUp(b));
	});
};
