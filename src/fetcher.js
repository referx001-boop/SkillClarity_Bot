const axios = require("axios");

const postedJobIds = new Set();

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
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
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
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
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
      params: { limit: 20 },
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
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
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
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

async function fetchRemoteOKJobs() {
  try {
    const res = await axios.get("https://remoteok.com/api", {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

async function fetchJobicyJobs() {
  try {
    const res = await axios.get("https://jobicy.com/api/v2/remote-jobs", {
      params: { count: 50 },
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const jobs = res.data.jobs || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    return jobs
      .filter((job) => {
        const posted = new Date(job.pubDate).getTime();
        return posted >= cutoff && !postedJobIds.has(`jobicy-${job.id}`);
      })
      .map((job) => ({
        id: `jobicy-${job.id}`,
        title: job.jobTitle,
        company: job.companyName,
        location: "Remote",
        salary: job.annualSalaryMin
          ? `${job.annualSalaryMin} - ${job.annualSalaryMax} ${job.salaryCurrency}`
          : null,
        tags: job.jobIndustry || [],
        description: job.jobExcerpt?.slice(0, 300) || "",
        url: job.url,
        source: "Jobicy",
        postedAt: job.pubDate,
      }));
  } catch (err) {
    console.error("[Jobicy] Fetch error:", err.message);
    return [];
  }
}

async function fetchAllJobs() {
  // Clear cache once it hits 500 so jobs recirculate
  if (postedJobIds.size > 500) {
    postedJobIds.clear();
    console.log("[Cache] Cleared posted jobs cache");
  }

  const [remotive, arbeitnow, himalayas, themuse, remoteok, jobicy] =
    await Promise.all([
      fetchRemotiveJobs(),
      fetchArbeitnowJobs(),
      fetchHimalayasJobs(),
      fetchTheMuseJobs(),
      fetchRemoteOKJobs(),
      fetchJobicyJobs(),
    ]);

  const allJobs = [
    ...remotive,
    ...arbeitnow,
    ...himalayas,
    ...themuse,
    ...remoteok,
    ...jobicy,
  ];

  allJobs.forEach((job) => postedJobIds.add(job.id));

  console.log(
    `[Sources] Remotive:${remotive.length} Arbeitnow:${arbeitnow.length} Himalayas:${himalayas.length} TheMuse:${themuse.length} RemoteOK:${remoteok.length} Jobicy:${jobicy.length}`,
  );

  return allJobs;
}

module.exports = { fetchAllJobs };
