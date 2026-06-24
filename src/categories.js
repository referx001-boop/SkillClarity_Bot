const CATEGORIES = {
  frontend: {
    label: "🖥 Frontend",
    keywords: ["frontend", "front-end", "react", "vue", "angular", "next.js", "svelte", "html", "css", "javascript", "typescript", "ui developer"],
  },
  backend: {
    label: "⚙️ Backend",
    keywords: ["backend", "back-end", "node.js", "python", "django", "fastapi", "express", "php", "laravel", "java", "spring", "golang", "rust", "api developer"],
  },
  fullstack: {
    label: "🔁 Fullstack",
    keywords: ["full stack", "fullstack", "full-stack", "mern", "mean", "lamp"],
  },
  design: {
    label: "🎨 UI/UX Design",
    keywords: ["ui/ux", "ui designer", "ux designer", "product designer", "figma", "graphic designer", "web designer", "visual designer", "interaction designer", "ux researcher"],
  },
  mobile: {
    label: "📱 Mobile",
    keywords: ["mobile developer", "android", "ios", "flutter", "react native", "kotlin", "swift", "mobile engineer"],
  },
  devops: {
    label: "☁️ DevOps & Cloud",
    keywords: ["devops", "cloud", "aws", "gcp", "azure", "kubernetes", "docker", "sre", "platform engineer", "infrastructure", "ci/cd", "site reliability"],
  },
  data: {
    label: "📊 Data & AI",
    keywords: ["data scientist", "data analyst", "machine learning", "ai engineer", "data engineer", "nlp", "llm", "deep learning", "business intelligence", "bi analyst", "analytics engineer", "power bi", "tableau", "sql analyst"],
  },
  pm: {
    label: "📋 Product Management",
    keywords: ["product manager", "product owner", "pm ", "technical pm", "associate pm", "senior pm", "head of product", "product lead", "product strategist", "agile product"],
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
    label: "✍️ Technical Writing & Content",
    keywords: ["technical writer", "content writer", "copywriter", "documentation", "developer advocate", "devrel", "content strategist", "blog writer", "seo writer"],
  },
  support: {
    label: "🛎 Tech Support & QA",
    keywords: ["qa engineer", "quality assurance", "test engineer", "manual tester", "automation tester", "customer success", "technical support", "help desk", "it support"],
  },
  freelance: {
    label: "🌍 Freelance & Remote",
    keywords: ["freelance", "contract", "part-time", "remote work", "gig"],
  },
};

function detectCategory(job) {
  const text = `${job.title} ${job.description || ""} ${(job.tags || []).join(" ")}`.toLowerCase();

  for (const [key, category] of Object.entries(CATEGORIES)) {
    if (category.keywords.some((kw) => text.includes(kw))) {
      return key;
    }
  }
  return "freelance"; // default bucket
}

module.exports = { CATEGORIES, detectCategory };
