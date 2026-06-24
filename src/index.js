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
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME; // e.g. skillclarityjobsng

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
  ctx.reply("SkillClarity Job Bot is live. Fresh remote jobs posted every few minutes.");
});

bot.command("status", (ctx) => {
  ctx.reply("Bot is running.");
});

// Join request handler
bot.on("chat_join_request", async (ctx) => {
  const userId = ctx.chatJoinRequest.from.id;
  const chatId = ctx.chatJoinRequest.chat.id;

  try {
    // Check if user is subscribed to the channel
    const member = await bot.telegram.getChatMember(
      `@${CHANNEL_USERNAME}`,
      userId
    );

    const isSubscribed = ["member", "administrator", "creator"].includes(
      member.status
    );

    if (isSubscribed) {
      // Approve the request
      await bot.telegram.approveChatJoinRequest(chatId, userId);
      await bot.telegram.sendMessage(
        userId,
        "✅ You have been approved to join SkillClarity Jobs group. Welcome!"
      );
    } else {
      // Reject and tell them to join the channel first
      await bot.telegram.declineChatJoinRequest(chatId, userId);
      await bot.telegram.sendMessage(
        userId,
        `❌ To join the group you must first subscribe to our channel.\n\n👉 Join here: t.me/${CHANNEL_USERNAME}\n\nThen click the group link again.`
      );
    }
  } catch (err) {
    console.error("[Join request error]", err.message);
    // Approve anyway if check fails to avoid blocking legitimate users
    await bot.telegram.approveChatJoinRequest(chatId, userId);
  }
});

bot.launch({ allowedUpdates: ["message", "channel_post", "chat_join_request"] }).then(() => {
  console.log("SkillClarity bot started.");
  postJobs();
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));