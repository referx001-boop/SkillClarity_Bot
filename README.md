# SkillClarity Job Alert Bot

Telegram bot that fetches remote jobs posted in the last 20 minutes and distributes them into skill-based topic threads in your supergroup.

## Setup

### 1. Create the Telegram bot
- Message @BotFather on Telegram
- Run `/newbot` and follow the steps
- Copy the bot token

### 2. Create your supergroup
- Create a Telegram group
- Enable Topics: Group Settings > Topics > Enable
- Create topics: Frontend, Backend, Fullstack, Design, Mobile, DevOps & Cloud, Data & AI, Freelance
- Add your bot as an admin with permission to post messages

### 3. Get your thread IDs
- Send any message to a topic
- Forward that message to @userinfobot or check via bot API
- You need the `message_thread_id` for each topic

### 4. Get your channel/group ID
- Add @userinfobot to your group temporarily
- It will show the group's chat ID (starts with -100)

### 5. Configure environment variables
```bash
cp .env.example .env
# Fill in all values in .env
```

### 6. Run locally
```bash
npm install
npm run dev
```

### 7. Deploy to Railway
- Push to GitHub
- Connect repo in Railway
- Add all env variables in Railway dashboard
- Deploy

## Job Sources
- Remotive (remotive.com)
- Arbeitnow (arbeitnow.com)

## Categories
- Frontend
- Backend
- Fullstack
- Design
- Mobile
- DevOps & Cloud
- Data & AI
- Freelance & Remote
# SkillClarityBot
# SkillClarity_Bot
# SkillClarity_Bot
# SkillClarity_Bot
