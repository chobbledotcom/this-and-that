module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("google65f94dc9a9e4440f.html");
  eleventyConfig.addPassthroughCopy("tripadvisor-iframe.html");

  // Add collections for posts
  eleventyConfig.addCollection("posts", function(collectionApi) {
    const posts = collectionApi.getFilteredByGlob("_posts/*.md");
    // Extract date from filename for Jekyll-style posts
    posts.forEach(post => {
      const match = post.inputPath.match(/_posts\/(\d{4})-(\d{2})-(\d{2})-/);
      if (match) {
        post.date = new Date(match[1], match[2] - 1, match[3]);
      }
    });
    return posts.sort((a, b) => b.date - a.date);
  });

  // Add collection for navigation pages
  eleventyConfig.addCollection("navPages", function(collectionApi) {
    return collectionApi.getAll()
      .filter(item => item.data.linkText)
      .sort((a, b) => (a.data.order || 999) - (b.data.order || 999));
  });

  // Add date filter for posts
  eleventyConfig.addFilter("date", (date, format) => {
    const d = new Date(date);
    if (format === "long") {
      return d.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return d.toISOString();
  });

  // Add escape filter
  eleventyConfig.addFilter("escape", (text) => {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function(m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m];
    });
  });

  // Site data
  eleventyConfig.addGlobalData("site", {
    title: "This & That Indian Cafe, Manchester",
    description: "Home of Rice & Three Curries",
    baseurl: "",
    url: "https://thisandthatcafe.co.uk",
    facebook_page: "ThisAndThatManchester",
    phone_number: "0161 832 4971",
    address: "3 Soap St, The Northern Quarter, Manchester M4 1EW",
    env: "production"
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};