function formatJobMessage(job, categoryLabel) {
  const salary = job.salary ? `\n💰 *Salary:* ${job.salary}` : "";
  const tags =
    job.tags.length > 0
      ? `\n🏷 ${job.tags.slice(0, 4).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}`
      : "";

  return (
    `🚨 *New ${categoryLabel} Job*\n\n` +
    `*${escapeMarkdown(job.title)}*\n` +
    `🏢 ${escapeMarkdown(job.company)}\n` +
    `📍 ${escapeMarkdown(job.location)}` +
    salary +
    tags +
    `\n\n🔗 [Apply Now](${job.url})\n` +
    `_via ${job.source} • just posted_`
  );
}

function escapeMarkdown(text) {
  if (!text) return "";
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

module.exports = { formatJobMessage };
