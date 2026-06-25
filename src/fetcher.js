const axios = require("axios");
const Parser = require("rss-parser");

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
});

const postedJobIds = new Set();

const CUTOFF_HOURS = 24;
const fs = require("fs");

const CACHE_FILE = "/tmp/posted_job_ids.json";
const postedJobIds = new Set();

// Load persisted IDs on startup
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
      data.forEach((id) => postedJobIds.add(id));
      console.log(`[Cache] Loaded ${postedJobIds.size} posted job IDs`);
    }
  } catch (err) {
    console.error("[Cache] Load error:", err.message);
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify([...postedJobIds]));
  } catch (err) {
    console.error("[Cache] Save error:", err.message);
  }
}

loadCache();

function getCutoff() {
  return Date.now() - CUTOFF_HOURS * 60 * 60 * 1000;
}

function isEnglish(text) {
  if (!text) return true;
  const germanWords = [
    "und", "der", "die", "das", "für", "mit", "von", "auf", "ist", "bei",
    "zur", "zum", "des", "dem", "ein", "eine", "nicht", "sich", "werden",
    "wurde", "durch",
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
    const cutoff = getCutoff();

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

async function fetchRemotiveRSSJobs() {
  try {
    const feed = await rssParser.parseURL("https://remotive.com/remote-jobs/feed");
    const cutoff = getCutoff();

    return feed.items
      .filter((item) => {
        const posted = new Date(item.pubDate).getTime();
        const id = `remotive-rss-${encodeURIComponent(item.link)}`;
        return posted >= cutoff && !postedJobIds.has(id);
      })
      .map((item) => {
        const [companyRaw, ...titleParts] = (item.title || "").split(" - ");
        const title = titleParts.join(" - ").trim() || item.title;
        const company = companyRaw.trim();

        return {
          id: `remotive-rss-${encodeURIComponent(item.link)}`,
          title,
          company,
          location: "Remote",
          salary: null,
          tags: item.categories || [],
          description: (item.contentSnippet || "").slice(0, 300),
          url: item.link,
          source: "Remotive",
          postedAt: item.pubDate,
        };
      });
  } catch (err) {
    console.error("[Remotive RSS] Fetch error:", err.message);
    return [];
  }
}

async function fetchWWRJobs() {
  try {
    const feed = await rssParser.parseURL("https://weworkremotely.com/remote-jobs.rss");
    const cutoff = getCutoff();

    return feed.items
      .filter((item) => {
        const posted = new Date(item.pubDate).getTime();
        const id = `wwr-${encodeURIComponent(item.link)}`;
        return posted >= cutoff && !postedJobIds.has(id);
      })
      .map((item) => {
        const [companyRaw, ...titleParts] = (item.title || "").split(":");
        const title = titleParts.join(":").trim() || item.title;
        const company = companyRaw.trim();
        const regionMatch = (item.content || "").match(/\[([^\]]+)\]/);
        const location = regionMatch ? regionMatch[1] : "Remote";

        return {
          id: `wwr-${encodeURIComponent(item.link)}`,
          title,
          company,
          location,
          salary: null,
          tags: item.categories || [],
          description: (item.contentSnippet || "").slice(0, 300),
          url: item.link,
          source: "We Work Remotely",
          postedAt: item.pubDate,
        };
      });
  } catch (err) {
    console.error("[WWR] Fetch error:", err.message);
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
    const cutoff = getCutoff();

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
    const cutoff = getCutoff();

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

async function fetchAdzunaJobs() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error("[Adzuna] Missing ADZUNA_APP_ID or ADZUNA_APP_KEY");
    return [];
  }

  const cutoff = getCutoff();
  const countries = ["gb", "us", "ca"];

  const requests = countries.map((country) =>
    axios
      .get(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`, {
        params: {
          app_id: appId,
          app_key: appKey,
          results_per_page: 50,
          what: "remote developer engineer designer",
          where: "remote",
          sort_by: "date",
          content_type: "application/json",
        },
        timeout: 10000,
      })
      .then((res) => res.data.results || [])
      .catch((err) => {
        console.error(`[Adzuna/${country.toUpperCase()}] Fetch error:`, err.message);
        return [];
      })
  );

  const results = await Promise.all(requests);
  const allResults = results.flat();

  return allResults
    .filter((job) => {
      const posted = new Date(job.created).getTime();
      return posted >= cutoff && !postedJobIds.has(`adzuna-${job.id}`);
    })
    .map((job) => ({
      id: `adzuna-${job.id}`,
      title: job.title,
      company: job.company?.display_name || "Unknown",
      location: job.location?.display_name || "Remote",
      salary:
        job.salary_min && job.salary_max
          ? `${Math.round(job.salary_min).toLocaleString()} - ${Math.round(job.salary_max).toLocaleString()} ${job.salary_currency_code || "USD"}`
          : null,
      tags: job.category?.tag ? [job.category.tag] : [],
      description: (job.description || "").slice(0, 300),
      url: job.redirect_url,
      source: "Adzuna",
      postedAt: job.created,
    }));
}

async function fetchAllJobs() {
  if (postedJobIds.size > 1000) {
    const entries = [...postedJobIds];
    entries.slice(0, 500).forEach((id) => postedJobIds.delete(id));
    console.log("[Cache] Pruned 500 oldest job IDs");
  }

  const [remotive, remotiveRSS, wwr, arbeitnow, jobicy, adzuna] =
    await Promise.all([
      fetchRemotiveJobs(),
      fetchRemotiveRSSJobs(),
      fetchWWRJobs(),
      fetchArbeitnowJobs(),
      fetchJobicyJobs(),
      fetchAdzunaJobs(),
    ]);

  const allJobs = [
    ...remotive,
    ...remotiveRSS,
    ...wwr,
    ...arbeitnow,
    ...jobicy,
    ...adzuna,
  ];

  allJobs.forEach((job) => postedJobIds.add(job.id));

  console.log(
    `[Sources] Remotive:${remotive.length} RemotiveRSS:${remotiveRSS.length} WWR:${wwr.length} Arbeitnow:${arbeitnow.length} Jobicy:${jobicy.length} Adzuna:${adzuna.length}`
  );

  return allJobs;
}

module.exports = { fetchAllJobs };