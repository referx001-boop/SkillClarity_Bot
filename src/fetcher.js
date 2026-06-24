const CATEGORIES = {
  frontend: {
    label: "🖥 Frontend",
    keywords: ["frontend", "front-end", "react", "vue", "angular", "next.js", "svelte", "html", "css", "javascript", "typescript", "ui developer", "web developer", "front end"],
  },
  backend: {
    label: "⚙️ Backend",
    keywords: ["backend", "back-end", "node.js", "python", "django", "fastapi", "express", "php", "laravel", "java", "spring", "golang", "rust", "api developer", "back end", "software engineer", "software developer"],
  },
  fullstack: {
    label: "🔁 Fullstack",
    keywords: ["full stack", "fullstack", "full-stack", "mern", "mean", "lamp"],
  },
  design: {
    label: "🎨 UI/UX Design",
    keywords: ["ui/ux", "ui designer", "ux designer", "product designer", "figma", "graphic designer", "web designer", "visual designer", "interaction designer", "ux researcher", "creative designer", "brand designer"],
  },
  mobile: {
    label: "📱 Mobile",
    keywords: ["mobile developer", "android", "ios", "flutter", "react native", "kotlin", "swift", "mobile engineer"],
  },
  devops: {
    label: "☁️ DevOps & Cloud",
    keywords: ["devops", "cloud", "aws", "gcp", "azure", "kubernetes", "docker", "sre", "platform engineer", "infrastructure", "ci/cd", "site reliability", "cloud engineer"],
  },
  data: {
    label: "📊 Data & AI",
    keywords: ["data scientist", "data analyst", "machine learning", "ai engineer", "data engineer", "nlp", "llm", "deep learning", "business intelligence", "bi analyst", "analytics engineer", "power bi", "tableau", "sql analyst", "data science", "artificial intelligence"],
  },
  pm: {
    label: "📋 Product Management",
    keywords: ["product manager", "product owner", "technical pm", "associate pm", "senior pm", "head of product", "product lead", "product strategist", "agile product", "project manager", "scrum master", "program manager"],
  },
  cybersecurity: {
    label: "🔐 Cybersecurity",
    keywords: ["cybersecurity", "cyber security", "information security", "infosec", "penetration tester", "pentester", "soc analyst", "security engineer", "security analyst", "ethical hacker", "vulnerability", "devsecops", "cloud security", "network security"],
  },
  blockchain: {
    label: "⛓ Blockchain & Web3",
    keywords: ["blockchain", "web3", "solidity", "smart contract", "defi", "nft", "crypto developer", "ethereum", "rust blockchain", "substrate"],
  },
  writing: {
    label: "✍️ Technical Writing",
    keywords: ["technical writer", "content writer", "copywriter", "documentation", "developer advocate", "devrel", "content strategist", "blog writer", "seo writer", "content creator", "editor"],
  },
  support: {
    label: "🛎 Tech Support & QA",
    keywords: ["qa engineer", "quality assurance", "test engineer", "manual tester", "automation tester", "customer success", "technical support", "help desk", "it support", "customer support", "support engineer"],
  },
  engineering: {
    label: "🔧 Engineering",
    keywords: ["engineer", "engineering", "ingenieur", "techniker", "mechanical", "electrical", "civil", "structural", "construction", "manufacturing", "industrial"],
  },
  marketing: {
    label: "📣 Marketing & Growth",
    keywords: ["marketing", "growth", "seo", "sem", "social media", "digital marketing", "brand", "campaign", "advertising", "communications", "pr ", "public relations", "email marketing"],
  },
  business: {
    label: "💼 Business & Operations",
    keywords: ["business development", "operations", "strategy", "consulting", "management", "founder", "executive", "director", "analyst", "finance", "accounting", "sales", "account manager"],
  },
  freelance: {
    label: "🌍 Freelance & Remote",
    keywords: ["freelance", "contract", "part-time", "remote work", "gig", "working student", "intern", "internship", "trainee"],
  },
};

function detectCategory(job) {
  const text = `${job.title} ${job.description || ""} ${(job.tags || []).join(" ")}`.toLowerCase();

  // Priority order matters - more specific first
  const priorityOrder = [
    "frontend", "backend", "fullstack", "mobile", "devops",
    "data", "cybersecurity", "blockchain", "design", "pm",
    "writing", "support", "engineering", "marketing", "business", "freelance"
  ];

  for (const key of priorityOrder) {
    const category = CATEGORIES[key];
    if (category.keywords.some((kw) => text.includes(kw))) {
      return key;
    }
  }

  return "freelance";
}

module.exports = { CATEGORIES, detectCategory };