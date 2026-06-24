function formatJobMessage(job, categoryLabel) {
  const title = cleanText(job.title);
  const company = cleanText(job.company);
  const location = cleanText(job.location);
  const salary = job.salary ? `\n💰 Salary: ${cleanText(job.salary)}` : "";
  const tags =
    job.tags && job.tags.length > 0
      ? `\n🏷 ${job.tags.slice(0, 4).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}`
      : "";

  return (
    `🚨 *New ${categoryLabel} Job*\n\n` +
    `*${title}*\n` +
    `🏢 ${company}\n` +
    `📍 ${location}` +
    salary +
    tags +
    `\n\n🔗 [Apply Now](${job.url})\n` +
    `_via ${job.source} • just posted_`
  );
}

function cleanText(text) {
  if (!text) return "";
  // Remove special markdown characters that break formatting
  return text
    .replace(/[\\]/g, "")
    .replace(/[_*[\]()~`>#+\-=|{}.!]/g, (match) => {
      // Keep hyphens in normal text, escape only markdown special chars
      if (match === "-") return match;
      return "";
    })
    .trim();
}

module.exports = { formatJobMessage };