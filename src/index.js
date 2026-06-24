require("dotenv").config();
const { Telegraf } = require("telegraf");
const cron = require("node-cron");
const { fetchAllJobs } = require("./fetcher");
const { detectCategory, CATEGORIES } = require("./categories");
const { formatJobMessage } = require("./formatter");

const bot = new Telegraf(process.env.BOT_TOKEN);

const TOPIC_THREAD_IDS = {
  frontend: parseInt(process.env.THREAD_FRONTEND || "0"),
  backend: parseInt(process.env.THREAD_BACKEND || "0"),
  fullstack: parseInt(process.env.THREAD_FULLSTACK || "0"),
  design: parseInt(process.env.THREAD_DESIGN || "0"),
  mobile: parseInt(process.env.THREAD_MOBILE || "0"),
  devops: parseInt(process.env.THREAD_DEVOPS || "0"),
  data: parseInt(process.env.THREAD_DATA || "0"),
  pm: parseInt(process.env.THREAD_PM || "0"),
  cybersecurity: parseInt(process.env.THREAD_CYBERSECURITY || "0"),
  blockchain: parseInt(process.env.THREAD_BLOCKCHAIN || "0"),
  writing: parseInt(process.env.THREAD_WRITING || "0"),
  support: parseInt(process.env.THREAD_SUPPORT || "0"),
  freelance: parseInt(process.env.THREAD_FREELANCE || "0"),
};

const CHANNEL_ID = process.env.CHANNEL_ID;

async function postJobs() {
  console.log(`[${new Date().toISOString()}] Fetching jobs...`);
  const jobs = await fetchAllJobs();
  console.log(`Found ${jobs.length} new jobs`);

  for (const job of jobs) {
    const categoryKey = detectCategory(job);
    const categoryLabel = CATEGORIES[categoryKey].label;
    const threadId = TOPIC_THREAD_IDS[categoryKey];
    const message = formatJobMessage(job, categoryLabel);

    try {
      const options = {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      };

      if (threadId && threadId > 0) {
        options.message_thread_id = threadId;
      }

      await bot.telegram.sendMessage(CHANNEL_ID, message, options);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[Post error] ${job.title}:`, err.message);
    }
  }
}

cron.schedule("*/2 * * * *", postJobs);

bot.command("start", (ctx) => {
  ctx.reply("SkillClarity Job Bot is live.");
});

bot.launch({ allowedUpdates: ["message", "channel_post"] }).then(() => {
  console.log("SkillClarity bot started.");
  postJobs();
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
