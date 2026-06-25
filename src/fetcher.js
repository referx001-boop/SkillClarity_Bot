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

function getCutoff() {
  return Date.now() - CUTOFF_HOURS * 60 * 60 * 1000;
}

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

// ─── Remotive (JSON API) ────────────────────────────────────────────────────

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

// ─── We Work Remotely (RSS) ─────────────────────────────────────────────────

async function fetchWWRJobs() {
  try {
    const feed = await rssParser.parseURL(
      "https://weworkremotely.com/remote-jobs.rss",
    );

    const cutoff = getCutoff();

    return feed.items
      .filter((item) => {
        const posted = new Date(item.pubDate).getTime();
        const id = `wwr-${encodeURIComponent(item.link)}`;
        return posted >= cutoff && !postedJobIds.has(id);
      })
      .map((item) => {
        // WWR title format: "Company: Job Title"
        const [companyRaw, ...titleParts] = (item.title || "").split(":");
        const title = titleParts.join(":").trim() || item.title;
        const company = companyRaw.trim();

        // Extract region from content if available
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

// ─── Arbeitnow (JSON API) ───────────────────────────────────────────────────

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

// ─── Jobicy (JSON API) ──────────────────────────────────────────────────────

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

// ─── Remote.co (RSS) ────────────────────────────────────────────────────────

async function fetchRemoteCoJobs() {
  try {
    const feed = await rssParser.parseURL(
      "https://remote.co/remote-jobs/feed/",
    );

    const cutoff = getCutoff();

    return feed.items
      .filter((item) => {
        const posted = new Date(item.pubDate).getTime();
        const id = `remoteco-${encodeURIComponent(item.link)}`;
        return posted >= cutoff && !postedJobIds.has(id);
      })
      .map((item) => {
        // remote.co titles are usually plain job titles
        const title = (item.title || "").trim();
        const company =
          item.creator ||
          item["dc:creator"] ||
          (item.content || "").match(/at ([^<\n]+)/i)?.[1]?.trim() ||
          "Unknown";

        return {
          id: `remoteco-${encodeURIComponent(item.link)}`,
          title,
          company,
          location: "Remote",
          salary: null,
          tags: item.categories || [],
          description: (item.contentSnippet || "").slice(0, 300),
          url: item.link,
          source: "Remote.co",
          postedAt: item.pubDate,
        };
      });
  } catch (err) {
    console.error("[Remote.co] Fetch error:", err.message);
    return [];
  }
}

// ─── Remotive RSS (backup, catches jobs the API misses) ─────────────────────

async function fetchRemotiveRSSJobs() {
  try {
    const feed = await rssParser.parseURL(
      "https://remotive.com/remote-jobs/feed/all",
    );

    const cutoff = getCutoff();

    return feed.items
      .filter((item) => {
        const posted = new Date(item.pubDate).getTime();
        // Use a different prefix so it doesn't collide with fetchRemotiveJobs
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

// ─── Aggregate ───────────────────────────────────────────────────────────────

async function fetchAllJobs() {
  if (postedJobIds.size > 1000) {
    // Prune oldest 500 instead of clearing everything
    const entries = [...postedJobIds];
    entries.slice(0, 500).forEach((id) => postedJobIds.delete(id));
    console.log("[Cache] Pruned 500 oldest job IDs");
  }

  const [remotive, remotiveRSS, wwr, arbeitnow, jobicy, remoteco] =
    await Promise.all([
      fetchRemotiveJobs(),
      fetchRemotiveRSSJobs(),
      fetchWWRJobs(),
      fetchArbeitnowJobs(),
      fetchJobicyJobs(),
      fetchRemoteCoJobs(),
    ]);

  const allJobs = [
    ...remotive,
    ...remotiveRSS,
    ...wwr,
    ...arbeitnow,
    ...jobicy,
    ...remoteco,
  ];

  allJobs.forEach((job) => postedJobIds.add(job.id));

  console.log(
    `[Sources] Remotive:${remotive.length} RemotiveRSS:${remotiveRSS.length} WWR:${wwr.length} Arbeitnow:${arbeitnow.length} Jobicy:${jobicy.length} RemoteCo:${remoteco.length}`,
  );

  return allJobs;
}

module.exports = { fetchAllJobs };
