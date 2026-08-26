module.exports = (eleventyConfig) => {
	// Copy static assets
	eleventyConfig.addPassthroughCopy("assets");
	eleventyConfig.addPassthroughCopy("favicon.ico");
	eleventyConfig.addPassthroughCopy("google65f94dc9a9e4440f.html");

	// These are not pages: the README is repo documentation and the Google
	// verification file is served verbatim by the passthrough copy above.
	eleventyConfig.ignores.add("README.md");
	eleventyConfig.ignores.add("google65f94dc9a9e4440f.html");

	// Add collections for posts
	eleventyConfig.addCollection("posts", (collectionApi) => {
		const posts = collectionApi.getFilteredByGlob("_posts/*.md");
		// Extract date from filename for Jekyll-style posts
		posts.forEach((post) => {
			const match = post.inputPath.match(/_posts\/(\d{4})-(\d{2})-(\d{2})-/);
			if (match) {
				post.date = new Date(match[1], match[2] - 1, match[3]);
			}
		});
		return posts.sort((a, b) => b.date - a.date);
	});

	// Add collection for navigation pages
	eleventyConfig.addCollection("navPages", (collectionApi) => {
		return collectionApi
			.getAll()
			.filter((item) => item.data.linkText)
			.sort((a, b) => (a.data.order || 999) - (b.data.order || 999));
	});

	// Every page that belongs in the sitemap, newest content first.
	eleventyConfig.addCollection("sitemapPages", (collectionApi) => {
		return collectionApi
			.getAll()
			.filter((item) => item.url && !item.data.noindex && !item.data.excludeFromSitemap)
			.sort((a, b) => a.url.localeCompare(b.url));
	});

	// Add date filter for posts
	eleventyConfig.addFilter("date", (date, format) => {
		const d = new Date(date);
		if (format === "long") {
			return d.toLocaleDateString("en-GB", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		}
		return d.toISOString();
	});

	// Build a meta description from a page's own content when it doesn't
	// declare a metaDescription of its own.
	eleventyConfig.addFilter("excerpt", (content) => {
		if (!content) return "";
		const text = String(content)
			.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
			// Drop the page furniture that every layout renders above the body
			// copy, so the description starts at the actual prose.
			.replace(/<div class="header">[\s\S]*?<\/div>/i, " ")
			.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, " ")
			.replace(/<em datetime[^>]*>[\s\S]*?<\/em>/gi, " ")
			.replace(/<[^>]+>/g, " ")
			.replace(/&nbsp;/g, " ")
			.replace(/&amp;/g, "&")
			.replace(/&#39;/g, "'")
			.replace(/&quot;/g, '"')
			.replace(/\s+/g, " ")
			// Stripping inline tags leaves gaps before punctuation.
			.replace(/\s+([,.:;!?%])/g, "$1")
			.replace(/([£$])\s+/g, "$1")
			.trim();
		if (text.length <= 155) return text;
		const clipped = text.slice(0, 155);
		const lastSpace = clipped.lastIndexOf(" ");
		return `${clipped.slice(0, lastSpace > 100 ? lastSpace : 155).trim()}…`;
	});

	// Add escape filter
	eleventyConfig.addFilter("escape", (text) => {
		if (!text) return "";
		return text.replace(/[&<>"']/g, (m) => {
			return {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			}[m];
		});
	});

	// Site data
	eleventyConfig.addGlobalData("site", {
		title: "This & That Indian Cafe, Manchester",
		description: "Home of Rice & Three Curries",
		baseurl: "",
		url: "https://www.thisandthatcafe.co.uk",
		facebook_page: "ThisAndThatManchester",
		phone_number: "0161 832 4971",
		address: "3 Soap St, The Northern Quarter, Manchester M4 1EW",
		env: "production",
	});

	return {
		dir: {
			input: ".",
			output: "_site",
			includes: "_includes",
			layouts: "_layouts",
			data: "_data",
		},
		templateFormats: ["md", "njk", "html"],
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
	};
};
