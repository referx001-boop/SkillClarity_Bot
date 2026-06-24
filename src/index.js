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
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;
const GROUP_INVITE_LINK = process.env.GROUP_INVITE_LINK;

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

// Start command - general
bot.command("start", async (ctx) => {
  const payload = ctx.message.text.split(" ")[1];

  if (payload === "join") {
    // They came from the channel join link
    await ctx.reply(
      `👋 Hey! Welcome to SkillClarity Jobs.\n\n` +
      `Before joining the group, you need to subscribe to our channel first.\n\n` +
      `Here is why: The channel broadcasts fresh remote job alerts every few minutes. ` +
      `The group is where the community discusses, shares wins, and supports each other.\n\n` +
      `👉 Step 1: Subscribe to the channel here: t.me/${CHANNEL_USERNAME}\n` +
      `👉 Step 2: Come back and click the group link: ${GROUP_INVITE_LINK}\n` +
      `👉 Step 3: Request to join and we will approve you instantly.\n\n` +
      `See you inside. 🚀`
    );
  } else {
    await ctx.reply(
      `👋 Welcome to SkillClarity Jobs Bot.\n\n` +
      `We post fresh remote tech jobs straight to Telegram every few minutes.\n\n` +
      `👉 Subscribe to our channel: t.me/${CHANNEL_USERNAME}\n\n` +
      `See you inside. 🚀`
    );
  }
});

bot.command("status", (ctx) => {
  ctx.reply("Bot is running. Jobs fetched every 2 minutes.");
});

// Join request handler
bot.on("chat_join_request", async (ctx) => {
  const userId = ctx.chatJoinRequest.from.id;
  const chatId = ctx.chatJoinRequest.chat.id;
  const firstName = ctx.chatJoinRequest.from.first_name || "there";

  try {
    const member = await bot.telegram.getChatMember(
      `@${CHANNEL_USERNAME}`,
      userId
    );

    const isSubscribed = ["member", "administrator", "creator"].includes(
      member.status
    );

    if (isSubscribed) {
      await bot.telegram.approveChatJoinRequest(chatId, userId);
      try {
        await bot.telegram.sendMessage(
          userId,
          `✅ Welcome to SkillClarity Jobs group, ${firstName}!\n\n` +
          `Join the topics that match your skill and start applying. Fresh jobs drop every few minutes.\n\n` +
          `Good luck. 🚀`
        );
      } catch (e) {}
    } else {
      await bot.telegram.declineChatJoinRequest(chatId, userId);
      try {
        await bot.telegram.sendMessage(
          userId,
          `❌ Sorry ${firstName}, you need to subscribe to our channel first.\n\n` +
          `👉 Step 1: Subscribe here: t.me/${CHANNEL_USERNAME}\n` +
          `👉 Step 2: Then click the group link again: ${GROUP_INVITE_LINK}\n\n` +
          `We will approve you instantly once you are subscribed. 🚀`
        );
      } catch (e) {}
    }
  } catch (err) {
    console.error("[Join request error]", err.message);
    await bot.telegram.approveChatJoinRequest(chatId, userId);
  }
});

bot.launch({
  allowedUpdates: ["message", "channel_post", "chat_join_request"],
}).then(() => {
  console.log("SkillClarity bot started.");
  postJobs();
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));