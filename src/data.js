// Client-side Database Management using LocalStorage

// Seed data
const DEFAULT_TECH_STACKS = [
  {
    id: "tech-1783838090427",
    name: "C++",
    category: "Backend",
    level: 85,
    icon: "C++"
  },
  {
    id: "tech-1783838237111",
    name: "HTML",
    category: "Frontend",
    level: 95,
    icon: "HTML"
  },
  {
    id: "tech-1783838248954",
    name: "CSS",
    category: "Frontend",
    level: 95,
    icon: "CSS"
  },
  {
    id: "tech-1783838399189",
    name: "Python",
    category: "Backend",
    level: 75,
    icon: "Python"
  }
];

const DEFAULT_PROJECTS = [
  {
    id: "proj-1783879719230",
    title: "Global Nav Plexus",
    category: "High-Performance Systems & 3D Geospatial Visualization",
    description: "An interactive, graph-based global routing engine that visualises optimal paths between global nodes on a custom 3D WebGL plexus globe. The project combines a high-performance C++17 backend exposing a REST API with a Three.js HTML5/CSS3/Vanilla JS frontend featuring concurrent algorithm overlays, cinematic flight animations, timezone calculations, and live hover previews.",
    tags: [
      "C++"
    ],
    githubUrl: "https://github.com/arnav-jain700/High-Performance-Navigation-System",
    liveUrl: "https://global-nav-plexus.onrender.com/",
    image: ""
  }
];

const DEFAULT_MESSAGES = [];

const DEFAULT_TIMELINE_ITEMS = [
  {
    id: "time-1781333225265",
    title: "Higher Secondary Education",
    company: "Kundan Vidya Mandir Senior Secondary School",
    role: "Student",
    dateRange: "2022 - 2023",
    type: "education",
    description: ""
  },
  {
    id: "time-1781333648916",
    title: "Bachelor of Technology Hons(Data Science and Data Engineering)",
    company: "Lovely Professional University",
    role: "Student",
    dateRange: "2024 - 2028",
    type: "education",
    description: "Rigorous CSE honors program specializing in Data Science and Data Engineering. Focused on Machine Learning, Deep Learning, Big Data tools, Database Management, and Data Structures, supported by applied analytics projects."
  }
];

const DEFAULT_ARTICLES = [];

const DEFAULT_CERTIFICATES = [];

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
  if (!localStorage.getItem("portfolio_certificates")) {
    localStorage.setItem("portfolio_certificates", JSON.stringify(DEFAULT_CERTIFICATES));
  }
  const currentSettings = localStorage.getItem("portfolio_settings");
  if (!currentSettings) {
    localStorage.setItem("portfolio_settings", JSON.stringify({
      ownerName: "Arnav Jain",
      ownerBio: "I am a Data Science and AI Developer dedicated to forging robust data architectures and breathing life into complex systems through generative, intelligent models.",
      email: "arnavjain1905@gmail.com",
      location: "Ludhiana, Punjab, India",
      linkedin: "https://www.linkedin.com/in/arnav-jain007/",
      github: "https://github.com/arnav-jain700",
      codolio: "https://codolio.com/profile/Jarnav",
      medium: "https://medium.com/@arnav4334",
      geminiKey: "",
      categories: ["Frontend", "Backend", "Databases", "DevOps", "Version Control"]
    }));
  } else {
    // Merge keys to ensure fields are populated
    const parsed = JSON.parse(currentSettings);
    const updated = {
      ownerName: parsed.ownerName || "Arnav Jain",
      ownerBio: parsed.ownerBio || "I am a Data Science and AI Developer dedicated to forging robust data architectures and breathing life into complex systems through generative, intelligent models.",
      email: parsed.email || "arnavjain1905@gmail.com",
      location: parsed.location || "Ludhiana, Punjab, India",
      linkedin: parsed.linkedin || "https://www.linkedin.com/in/arnav-jain007/",
      github: parsed.github || "https://github.com/arnav-jain700",
      codolio: parsed.codolio || "https://codolio.com/profile/Jarnav",
      medium: parsed.medium || "https://medium.com/@arnav4334",
      geminiKey: parsed.geminiKey || "",
      categories: parsed.categories || ["Frontend", "Backend", "Databases", "DevOps", "Version Control"]
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
  },

  // Certificates CRUD
  getCertificates() {
    return JSON.parse(localStorage.getItem("portfolio_certificates") || "[]");
  },

  saveCertificate(cert) {
    const certs = this.getCertificates();
    if (cert.id) {
      const index = certs.findIndex(c => c.id === cert.id);
      if (index !== -1) {
        certs[index] = { ...certs[index], ...cert };
      }
    } else {
      cert.id = "cert-" + Date.now();
      certs.push(cert);
    }
    localStorage.setItem("portfolio_certificates", JSON.stringify(certs));
    return cert;
  },

  deleteCertificate(id) {
    const certs = this.getCertificates();
    const filtered = certs.filter(c => c.id !== id);
    localStorage.setItem("portfolio_certificates", JSON.stringify(filtered));
  }
};
