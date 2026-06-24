const axios = require("axios");

// Track posted jobs to avoid duplicates
const postedJobIds = new Set();

async function fetchRemotiveJobs() {
  try {
    const res = await axios.get("https://remotive.com/api/remote-jobs", {
      params: { limit: 50 },
      timeout: 10000,
    });

    const jobs = res.data.jobs || [];
    const cutoff = Date.now() - 20 * 60 * 60 * 1000; // 20 minutes ago

    return jobs
      .filter((job) => {
        const posted = new Date(job.publication_date).getTime();
        return posted >= cutoff && !postedJobIds.has(`remotive-${job.id}`);
      })
      .map((job) => ({
        id: `remotive-${job.id}`,
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || "Remote",
        salary: job.salary || null,
        tags: job.tags || [],
        description: job.description?.slice(0, 300) || "",
        url: job.url,
        source: "Remotive",
        postedAt: job.publication_date,
      }));
  } catch (err) {
    console.error("[Remotive] Fetch error:", err.message);
    return [];
  }
}

async function fetchArbeitnowJobs() {
  try {
    const res = await axios.get("https://www.arbeitnow.com/api/job-board-api", {
      timeout: 10000,
    });

    const jobs = res.data.data || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    return jobs
      .filter((job) => {
        const posted = job.created_at * 1000;
        return posted >= cutoff && !postedJobIds.has(`arbeitnow-${job.slug}`);
      })
      .map((job) => ({
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.location || "Remote",
        salary: null,
        tags: job.tags || [],
        description: job.description?.slice(0, 300) || "",
        url: job.url,
        source: "Arbeitnow",
        postedAt: new Date(job.created_at * 1000).toISOString(),
      }));
  } catch (err) {
    console.error("[Arbeitnow] Fetch error:", err.message);
    return [];
  }
}

async function fetchAllJobs() {
  const [remotive, arbeitnow] = await Promise.all([
    fetchRemotiveJobs(),
    fetchArbeitnowJobs(),
  ]);

  const allJobs = [...remotive, ...arbeitnow];

  // Mark all as posted
  allJobs.forEach((job) => postedJobIds.add(job.id));

  // Keep set from growing too large
  if (postedJobIds.size > 2000) {
    const entries = [...postedJobIds];
    entries.slice(0, 500).forEach((id) => postedJobIds.delete(id));
  }

  return allJobs;
}

module.exports = { fetchAllJobs };
