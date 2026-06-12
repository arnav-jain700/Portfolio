// Client-side Database Management using LocalStorage

// Seed data
const DEFAULT_TECH_STACKS = [
  { id: "tech-1", name: "React", category: "Frontend", level: 90, icon: "React" },
  { id: "tech-2", name: "JavaScript", category: "Frontend", level: 95, icon: "JS" },
  { id: "tech-3", name: "Node.js", category: "Backend", level: 85, icon: "Node" },
  { id: "tech-4", name: "Python", category: "Backend", level: 80, icon: "Python" },
  { id: "tech-5", name: "MongoDB", category: "Databases", level: 75, icon: "Database" },
  { id: "tech-6", name: "Docker", category: "DevOps", level: 70, icon: "Docker" }
];

const DEFAULT_PROJECTS = [
  {
    id: "proj-1",
    title: "NeuroPlan: AI Task Agent",
    description: "An intelligent task manager that uses LLMs to break down complex goals into subtasks, schedule them dynamically, and automate progress logs.",
    category: "AI / Fullstack",
    tags: ["React", "Node.js", "MongoDB", "Gemini API"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: ""
  },
  {
    id: "proj-2",
    title: "Aetheria: Glassmorphic Hub",
    description: "A highly-aesthetic, responsive dashboard displaying real-time weather, financial metrics, and task tickers with modern glassmorphic glass styling.",
    category: "Frontend",
    tags: ["HTML", "CSS", "JavaScript", "Vite"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: ""
  },
  {
    id: "proj-3",
    title: "SyncChat: Socket Hub",
    description: "A real-time instant messaging workspace featuring private chat rooms, file sharing, message reactions, and online status counters.",
    category: "Backend / Realtime",
    tags: ["Node.js", "React", "Socket.io", "CSS"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: ""
  }
];

const DEFAULT_MESSAGES = [
  {
    id: "msg-1",
    name: "Jane Smith",
    email: "jane@company.com",
    message: "Hey! Loved your NeuroPlan project. Are you available for freelance work next month?",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  }
];

const DEFAULT_TIMELINE_ITEMS = [
  {
    id: "time-1",
    title: "Software Engineer Intern",
    company: "Innovate AI Labs",
    role: "Full-stack Intern",
    dateRange: "Jan 2026 - Present",
    description: "Engineering client-side workflows with Gemini integrations, crafting beautiful responsive dashboards, and optimizing API responses.",
    type: "experience"
  },
  {
    id: "time-2",
    title: "B.Tech in Computer Science",
    company: "Punjab Technical University",
    role: "Student",
    dateRange: "2022 - 2026",
    description: "Specializing in software design, algorithms, web development, and database architectures.",
    type: "education"
  }
];

const DEFAULT_ARTICLES = [
  {
    id: "art-1",
    title: "Building Client-Side AI Applications",
    summary: "How to use local storage combined with the Gemini API to craft smart, responsive, browser-contained AI assistants without heavy backend dependencies.",
    content: "### Introduction\nClient-side AI integrations are changing how developers build interactive tools. Instead of routing everything through complex servers, we can let users save keys locally in their browser and make direct, rate-limited API calls.\n\n### The Core Architecture\n1. **Local State**: Store the API key inside `localStorage`.\n2. **Browser Fetches**: Use `fetch()` directly to query Google's endpoints.\n3. **Context Injection**: Build clean system instructions containing DB objects (like projects or about-me info) to dynamically teach the model who it represents.\n\n### Conclusion\nThis ensures low latency, zero backend server costs, and strict privacy control since keys never leave the user's browser tab.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    tags: ["AI", "Gemini", "JavaScript"]
  },
  {
    id: "art-2",
    title: "The Power of HSL and Glassmorphism",
    summary: "Dive deep into modern CSS properties, backdrop-filters, and color math using HSL values to craft professional dark-theme interfaces.",
    content: "### Modern Styling Systems\nAesthetics determine the first impression of any website. Glassmorphism combines semi-transparent background colors with backdrop filters to create depth.\n\n```css\n.glass-card {\n  background: hsla(222, 25%, 12%, 0.65);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n}\n```\n\n### Why HSL?\nHSL (Hue, Saturation, Lightness) makes color palette tailoring extremely intuitive. Adjusting lightness (--lightness-offset) allows for automatic light and dark theme generation without rewriting colors.",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    tags: ["CSS", "Design", "Frontend"]
  }
];

// Initialize Storage
function initStorage() {
  if (!localStorage.getItem("portfolio_tech_stacks")) {
    localStorage.setItem("portfolio_tech_stacks", JSON.stringify(DEFAULT_TECH_STACKS));
  }
  if (!localStorage.getItem("portfolio_projects")) {
    localStorage.setItem("portfolio_projects", JSON.stringify(DEFAULT_PROJECTS));
  }
  if (!localStorage.getItem("portfolio_messages")) {
    localStorage.setItem("portfolio_messages", JSON.stringify(DEFAULT_MESSAGES));
  }
  if (!localStorage.getItem("portfolio_timeline")) {
    localStorage.setItem("portfolio_timeline", JSON.stringify(DEFAULT_TIMELINE_ITEMS));
  }
  if (!localStorage.getItem("portfolio_blog")) {
    localStorage.setItem("portfolio_blog", JSON.stringify(DEFAULT_ARTICLES));
  }
  const currentSettings = localStorage.getItem("portfolio_settings");
  if (!currentSettings) {
    localStorage.setItem("portfolio_settings", JSON.stringify({
      ownerName: "Arnav Jain",
      ownerBio: "I am a full-stack engineer and AI developer passionate about crafting beautiful, high-performance web applications and integration of intelligent agents.",
      email: "arnavjain1905@gmail.com",
      location: "Ludhiana, Punjab, India",
      linkedin: "https://www.linkedin.com/in/arnav-jain007/",
      github: "https://github.com",
      codolio: "",
      medium: "",
      geminiKey: "",
      categories: ["Frontend", "Backend", "Databases", "DevOps"]
    }));
  } else {
    // Merge keys to ensure fields are populated
    const parsed = JSON.parse(currentSettings);
    const updated = {
      ownerName: parsed.ownerName || "Arnav Jain",
      ownerBio: parsed.ownerBio || "I am a full-stack engineer and AI developer passionate about crafting beautiful, high-performance web applications and integration of intelligent agents.",
      email: parsed.email || "arnavjain1905@gmail.com",
      location: parsed.location || "Ludhiana, Punjab, India",
      linkedin: parsed.linkedin || "https://www.linkedin.com/in/arnav-jain007/",
      github: parsed.github || "https://github",
      codolio: parsed.codolio || "",
      medium: parsed.medium || "",
      geminiKey: parsed.geminiKey || "",
      categories: parsed.categories || ["Frontend", "Backend", "Databases", "DevOps"]
    };
    localStorage.setItem("portfolio_settings", JSON.stringify(updated));
  }
}

initStorage();

export const Database = {
  // Projects CRUD
  getProjects() {
    return JSON.parse(localStorage.getItem("portfolio_projects") || "[]");
  },
  
  saveProject(project) {
    const projects = this.getProjects();
    if (project.id) {
      // Edit
      const index = projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        projects[index] = { ...projects[index], ...project };
      }
    } else {
      // Create
      project.id = "proj-" + Date.now();
      projects.push(project);
    }
    localStorage.setItem("portfolio_projects", JSON.stringify(projects));
    return project;
  },
  
  deleteProject(id) {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem("portfolio_projects", JSON.stringify(filtered));
  },

  // Tech Stacks CRUD
  getTechStacks() {
    return JSON.parse(localStorage.getItem("portfolio_tech_stacks") || "[]");
  },
  
  saveTechStack(stack) {
    const stacks = this.getTechStacks();
    if (stack.id) {
      // Edit
      const index = stacks.findIndex(s => s.id === stack.id);
      if (index !== -1) {
        stacks[index] = { ...stacks[index], ...stack };
      }
    } else {
      // Create
      stack.id = "tech-" + Date.now();
      stacks.push(stack);
    }
    localStorage.setItem("portfolio_tech_stacks", JSON.stringify(stacks));
    return stack;
  },
  
  deleteTechStack(id) {
    const stacks = this.getTechStacks();
    const filtered = stacks.filter(s => s.id !== id);
    localStorage.setItem("portfolio_tech_stacks", JSON.stringify(filtered));
  },

  // Contact Messages CRUD
  getMessages() {
    return JSON.parse(localStorage.getItem("portfolio_messages") || "[]");
  },
  
  saveMessage(msg) {
    const messages = this.getMessages();
    msg.id = "msg-" + Date.now();
    msg.timestamp = new Date().toISOString();
    msg.unread = true; // Mark as unread by default
    messages.unshift(msg); // Newest messages first
    localStorage.setItem("portfolio_messages", JSON.stringify(messages));
    return msg;
  },
  
  deleteMessage(id) {
    const messages = this.getMessages();
    const filtered = messages.filter(m => m.id !== id);
    localStorage.setItem("portfolio_messages", JSON.stringify(filtered));
  },

  markMessageAsRead(id) {
    const messages = this.getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].unread = false;
      localStorage.setItem("portfolio_messages", JSON.stringify(messages));
    }
  },

  toggleMessageRead(id) {
    const messages = this.getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].unread = messages[index].unread === false ? true : false;
      localStorage.setItem("portfolio_messages", JSON.stringify(messages));
      return messages[index].unread;
    }
    return null;
  },

  // Settings & Bio
  getSettings() {
    return JSON.parse(localStorage.getItem("portfolio_settings") || "{}");
  },
  
  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("portfolio_settings", JSON.stringify(updated));
    return updated;
  },

  // Timeline CRUD
  getTimeline() {
    return JSON.parse(localStorage.getItem("portfolio_timeline") || "[]");
  },

  saveTimelineItem(item) {
    const timeline = this.getTimeline();
    if (item.id) {
      const index = timeline.findIndex(t => t.id === item.id);
      if (index !== -1) {
        timeline[index] = { ...timeline[index], ...item };
      }
    } else {
      item.id = "time-" + Date.now();
      timeline.push(item);
    }
    localStorage.setItem("portfolio_timeline", JSON.stringify(timeline));
    return item;
  },

  deleteTimelineItem(id) {
    const timeline = this.getTimeline();
    const filtered = timeline.filter(t => t.id !== id);
    localStorage.setItem("portfolio_timeline", JSON.stringify(filtered));
  },

  // Blog CRUD
  getArticles() {
    return JSON.parse(localStorage.getItem("portfolio_blog") || "[]");
  },

  saveArticle(article) {
    const articles = this.getArticles();
    if (article.id) {
      const index = articles.findIndex(a => a.id === article.id);
      if (index !== -1) {
        articles[index] = { ...articles[index], ...article };
      }
    } else {
      article.id = "art-" + Date.now();
      article.date = new Date().toISOString().split('T')[0];
      articles.push(article);
    }
    localStorage.setItem("portfolio_blog", JSON.stringify(articles));
    return article;
  },

  deleteArticle(id) {
    const articles = this.getArticles();
    const filtered = articles.filter(a => a.id !== id);
    localStorage.setItem("portfolio_blog", JSON.stringify(filtered));
  }
};
