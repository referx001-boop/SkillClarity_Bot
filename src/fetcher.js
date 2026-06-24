const axios = require("axios");

const postedJobIds = new Set();

async function fetchRemotiveJobs() {
  try {
    const res = await axios.get("https://remotive.com/api/remote-jobs", {
      params: { limit: 50 },
      timeout: 10000,
    });

    const jobs = res.data.jobs || [];
    const cutoff = Date.now() - 6 * 60 * 60 * 1000; // 6 hours ago

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
    const cutoff = Date.now() - 6 * 60 * 60 * 1000; // 6 hours ago

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

async function fetchHimalayasJobs() {
  try {
    const res = await axios.get("https://himalayas.app/jobs/api", {
      params: { limit: 50 },
      timeout: 10000,
    });

    const jobs = res.data.jobs || [];
    const cutoff = Date.now() - 6 * 60 * 60 * 1000; // 6 hours ago

    return jobs
      .filter((job) => {
        const posted = new Date(job.createdAt).getTime();
        return posted >= cutoff && !postedJobIds.has(`himalayas-${job.id}`);
      })
      .map((job) => ({
        id: `himalayas-${job.id}`,
        title: job.title,
        company: job.companyName,
        location: "Remote",
        salary: job.salaryCurrency
          ? `${job.salaryMin} - ${job.salaryMax} ${job.salaryCurrency}`
          : null,
        tags: job.categories || [],
        description: job.description?.slice(0, 300) || "",
        url: job.applicationLink || `https://himalayas.app/jobs/${job.slug}`,
        source: "Himalayas",
        postedAt: job.createdAt,
      }));
  } catch (err) {
    console.error("[Himalayas] Fetch error:", err.message);
    return [];
  }
}

async function fetchTheMuseJobs() {
  try {
    const res = await axios.get("https://www.themuse.com/api/public/jobs", {
      params: { page: 0, descended: true },
      timeout: 10000,
    });

    const jobs = res.data.results || [];
    const cutoff = Date.now() - 6 * 60 * 60 * 1000; // 6 hours ago

    return jobs
      .filter((job) => {
        const posted = new Date(job.publication_date).getTime();
        return posted >= cutoff && !postedJobIds.has(`muse-${job.id}`);
      })
      .map((job) => ({
        id: `muse-${job.id}`,
        title: job.name,
        company: job.company?.name || "Unknown",
        location: job.locations?.map((l) => l.name).join(", ") || "Remote",
        salary: null,
        tags: job.categories?.map((c) => c.name) || [],
        description: job.contents?.slice(0, 300) || "",
        url: job.refs?.landing_page || "",
        source: "The Muse",
        postedAt: job.publication_date,
      }));
  } catch (err) {
    console.error("[TheMuse] Fetch error:", err.message);
    return [];
  }
}

async function fetchAllJobs() {
  const [remotive, arbeitnow, himalayas, themuse] = await Promise.all([
    fetchRemotiveJobs(),
    fetchArbeitnowJobs(),
    fetchHimalayasJobs(),
    fetchTheMuseJobs(),
  ]);

  const allJobs = [...remotive, ...arbeitnow, ...himalayas, ...themuse];

  allJobs.forEach((job) => postedJobIds.add(job.id));

  if (postedJobIds.size > 2000) {
    const entries = [...postedJobIds];
    entries.slice(0, 500).forEach((id) => postedJobIds.delete(id));
  }

  return allJobs;
}

module.exports = { fetchAllJobs };