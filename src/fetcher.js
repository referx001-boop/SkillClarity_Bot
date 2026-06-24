const axios = require("axios");

const postedJobIds = new Set();

// Only accept English jobs
function isEnglish(text) {
  if (!text) return true;
  const germanWords = [
    "und",
    "der",
    "die",
    "das",
    "für",
    "mit",
    "von",
    "auf",
    "ist",
    "bei",
    "zur",
    "zum",
    "des",
    "dem",
    "ein",
    "eine",
    "nicht",
    "sich",
    "werden",
    "wurde",
    "durch",
  ];
  const words = text.toLowerCase().split(/\s+/);
  const germanCount = words.filter((w) => germanWords.includes(w)).length;
  return germanCount < 2;
}

async function fetchRemotiveJobs() {
  try {
    const res = await axios.get("https://remotive.com/api/remote-jobs", {
      params: { limit: 100 },
      timeout: 10000,
    });

    const jobs = res.data.jobs || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

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
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    return jobs
      .filter((job) => {
        const posted = job.created_at * 1000;
        const english = isEnglish(job.title) && isEnglish(job.description);
        const isRemote =
          job.remote === true ||
          (job.location || "").toLowerCase().includes("remote");
        return (
          posted >= cutoff &&
          english &&
          isRemote &&
          !postedJobIds.has(`arbeitnow-${job.slug}`)
        );
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
      params: { limit: 100 },
      timeout: 10000,
    });

    const jobs = res.data.jobs || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

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
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

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

async function fetchWeWorkRemotelyJobs() {
  try {
    const res = await axios.get("https://weworkremotely.com/remote-jobs.json", {
      timeout: 10000,
    });

    const jobs = res.data || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    return jobs
      .filter((job) => {
        const posted = new Date(job.created_at).getTime();
        return posted >= cutoff && !postedJobIds.has(`wwr-${job.id}`);
      })
      .map((job) => ({
        id: `wwr-${job.id}`,
        title: job.title,
        company: job.company,
        location: "Remote",
        salary: null,
        tags: job.category ? [job.category] : [],
        description: job.description?.slice(0, 300) || "",
        url: `https://weworkremotely.com${job.url}`,
        source: "We Work Remotely",
        postedAt: job.created_at,
      }));
  } catch (err) {
    console.error("[WeWorkRemotely] Fetch error:", err.message);
    return [];
  }
}

async function fetchRemoteOKJobs() {
  try {
    const res = await axios.get("https://remoteok.com/api", {
      timeout: 10000,
      headers: {
        "User-Agent": "SkillClarity Jobs Bot",
      },
    });

    const jobs = (res.data || []).filter((j) => j.id);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    return jobs
      .filter((job) => {
        const posted = job.epoch * 1000;
        return posted >= cutoff && !postedJobIds.has(`remoteok-${job.id}`);
      })
      .map((job) => ({
        id: `remoteok-${job.id}`,
        title: job.position,
        company: job.company,
        location: "Remote",
        salary: job.salary || null,
        tags: job.tags || [],
        description: job.description?.slice(0, 300) || "",
        url: job.url,
        source: "RemoteOK",
        postedAt: new Date(job.epoch * 1000).toISOString(),
      }));
  } catch (err) {
    console.error("[RemoteOK] Fetch error:", err.message);
    return [];
  }
}

async function fetchJobspressJobs() {
  try {
    const res = await axios.get(
      "https://jobspress.io/api/jobs?remote=true&limit=50",
      { timeout: 10000 },
    );

    const jobs = res.data.jobs || res.data || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    return jobs
      .filter((job) => {
        const posted = new Date(job.created_at || job.postedAt).getTime();
        return posted >= cutoff && !postedJobIds.has(`jobspress-${job.id}`);
      })
      .map((job) => ({
        id: `jobspress-${job.id}`,
        title: job.title,
        company: job.company || "Unknown",
        location: "Remote",
        salary: job.salary || null,
        tags: job.tags || [],
        description: job.description?.slice(0, 300) || "",
        url: job.url || job.apply_url,
        source: "JobsPress",
        postedAt: job.created_at || job.postedAt,
      }));
  } catch (err) {
    console.error("[JobsPress] Fetch error:", err.message);
    return [];
  }
}

async function fetchAllJobs() {
  const [remotive, arbeitnow, himalayas, themuse, wwr, remoteok, jobspress] =
    await Promise.all([
      fetchRemotiveJobs(),
      fetchArbeitnowJobs(),
      fetchHimalayasJobs(),
      fetchTheMuseJobs(),
      fetchWeWorkRemotelyJobs(),
      fetchRemoteOKJobs(),
      fetchJobspressJobs(),
    ]);

  const allJobs = [
    ...remotive,
    ...arbeitnow,
    ...himalayas,
    ...themuse,
    ...wwr,
    ...remoteok,
    ...jobspress,
  ];

  allJobs.forEach((job) => postedJobIds.add(job.id));

  if (postedJobIds.size > 5000) {
    const entries = [...postedJobIds];
    entries.slice(0, 1000).forEach((id) => postedJobIds.delete(id));
  }

  return allJobs;
}

module.exports = { fetchAllJobs };
