import { supabase, isCloudActive } from "./supabase.js";

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

const DEFAULT_HACKATHONS = [
  {
    id: "hack-1",
    title: "Global AI & Innovation Hackathon 2025",
    organizer: "Devfolio & Google Cloud",
    date: "March 2025",
    role: "Team Lead & Lead Developer",
    projectName: "Global Nav Plexus AI",
    achievement: "🏆 1st Winner",
    description: "Architected a real-time AI-powered 3D geospatial routing engine and intelligent agent system in a 36-hour hackathon sprint. Integrated graph algorithm overlays, live WebGL rendering, and generative AI job fit analysis.",
    technologies: "C++, Python, Three.js, JavaScript, TensorFlow, REST API",
    projectUrl: "https://global-nav-plexus.onrender.com/",
    certificateUrl: "https://devfolio.co",
    image: ""
  }
];

// Initialize Storage
function initStorage() {
  const getOrSeed = (key, defaultData) => {
    const existing = localStorage.getItem(key);
    if (!existing || (existing === "[]" && defaultData.length > 0)) {
      localStorage.setItem(key, JSON.stringify(defaultData));
    }
  };

  getOrSeed("portfolio_tech_stacks", DEFAULT_TECH_STACKS);
  getOrSeed("portfolio_projects", DEFAULT_PROJECTS);
  getOrSeed("portfolio_messages", DEFAULT_MESSAGES);
  getOrSeed("portfolio_timeline", DEFAULT_TIMELINE_ITEMS);
  getOrSeed("portfolio_blog", DEFAULT_ARTICLES);
  getOrSeed("portfolio_certificates", DEFAULT_CERTIFICATES);
  getOrSeed("portfolio_hackathons", DEFAULT_HACKATHONS);

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
  // Cloud Database Sync
  async syncWithCloud() {
    if (!isCloudActive || !supabase) return false;
    try {
      console.log("Syncing database with Supabase Cloud...");
      
      // Sync settings
      try {
        const { data: settingsData } = await supabase.from("portfolio_settings").select("*").eq("id", "main_settings").maybeSingle();
        const localSettings = JSON.parse(localStorage.getItem("portfolio_settings") || "{}");
        if (!settingsData && localSettings && localSettings.ownerName) {
          console.log("Cloud settings empty. Uploading local settings cache...");
          await supabase.from("portfolio_settings").upsert({ id: "main_settings", ...localSettings });
        } else if (settingsData) {
          const { id, ...cleanSettings } = settingsData;
          localStorage.setItem("portfolio_settings", JSON.stringify({ ...localSettings, ...cleanSettings }));
        }
      } catch (err) {
        console.warn("Supabase settings read failed:", err);
      }

      // Helper to fetch collection and store in localStorage or upload if cloud is empty
      const syncTable = async (tableName, storageKey) => {
        try {
          const { data: cloudItems, error } = await supabase.from(tableName).select("*");
          if (error) {
            console.warn(`Supabase read error for '${tableName}':`, error);
            return;
          }
          const localList = JSON.parse(localStorage.getItem(storageKey) || "[]");
          
          if ((!cloudItems || cloudItems.length === 0) && localList && localList.length > 0) {
            console.log(`Cloud table '${tableName}' is empty. Uploading local cache...`);
            for (const item of localList) {
              await supabase.from(tableName).upsert(item);
            }
          } else if (cloudItems && cloudItems.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(cloudItems));
          }
        } catch (err) {
          console.warn(`Supabase table read failed for '${tableName}':`, err);
        }
      };

      await Promise.all([
        syncTable("portfolio_projects", "portfolio_projects"),
        syncTable("portfolio_tech_stacks", "portfolio_tech_stacks"),
        syncTable("portfolio_timeline", "portfolio_timeline"),
        syncTable("portfolio_blog", "portfolio_blog"),
        syncTable("portfolio_certificates", "portfolio_certificates"),
        syncTable("portfolio_hackathons", "portfolio_hackathons"),
        syncTable("portfolio_messages", "portfolio_messages")
      ]);

      console.log("Supabase Cloud sync complete. Cache updated.");
      return true;
    } catch (e) {
      console.error("Supabase Cloud sync failed, using cached local data:", e);
      return false;
    }
  },

  // Projects CRUD
  getProjects() {
    return JSON.parse(localStorage.getItem("portfolio_projects") || "[]");
  },
  
  saveProject(project) {
    const projects = this.getProjects();
    if (project.id) {
      const index = projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        projects[index] = { ...projects[index], ...project };
      }
    } else {
      project.id = "proj-" + Date.now();
      projects.push(project);
    }
    localStorage.setItem("portfolio_projects", JSON.stringify(projects));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_projects").upsert(project).catch(err => console.error("Supabase project save failed:", err));
    }
    return project;
  },
  
  deleteProject(id) {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem("portfolio_projects", JSON.stringify(filtered));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_projects").delete().eq("id", id).catch(err => console.error("Supabase project delete failed:", err));
    }
  },

  // Tech Stacks CRUD
  getTechStacks() {
    return JSON.parse(localStorage.getItem("portfolio_tech_stacks") || "[]");
  },
  
  saveTechStack(stack) {
    const stacks = this.getTechStacks();
    if (stack.id) {
      const index = stacks.findIndex(s => s.id === stack.id);
      if (index !== -1) {
        stacks[index] = { ...stacks[index], ...stack };
      }
    } else {
      stack.id = "tech-" + Date.now();
      stacks.push(stack);
    }
    localStorage.setItem("portfolio_tech_stacks", JSON.stringify(stacks));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_tech_stacks").upsert(stack).catch(err => console.error("Supabase skill save failed:", err));
    }
    return stack;
  },
  
  deleteTechStack(id) {
    const stacks = this.getTechStacks();
    const filtered = stacks.filter(s => s.id !== id);
    localStorage.setItem("portfolio_tech_stacks", JSON.stringify(filtered));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_tech_stacks").delete().eq("id", id).catch(err => console.error("Supabase skill delete failed:", err));
    }
  },

  // Contact Messages CRUD
  getMessages() {
    return JSON.parse(localStorage.getItem("portfolio_messages") || "[]");
  },
  
  saveMessage(msg) {
    const messages = this.getMessages();
    msg.id = "msg-" + Date.now();
    msg.timestamp = new Date().toISOString();
    msg.unread = true;
    messages.unshift(msg);
    localStorage.setItem("portfolio_messages", JSON.stringify(messages));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_messages").upsert(msg).catch(err => console.error("Supabase message save failed:", err));
    }
    return msg;
  },
  
  deleteMessage(id) {
    const messages = this.getMessages();
    const filtered = messages.filter(m => m.id !== id);
    localStorage.setItem("portfolio_messages", JSON.stringify(filtered));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_messages").delete().eq("id", id).catch(err => console.error("Supabase message delete failed:", err));
    }
  },

  markMessageAsRead(id) {
    const messages = this.getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].unread = false;
      localStorage.setItem("portfolio_messages", JSON.stringify(messages));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_messages").upsert(messages[index]).catch(err => console.error("Supabase message read update failed:", err));
      }
    }
  },

  toggleMessageRead(id) {
    const messages = this.getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].unread = !messages[index].unread;
      localStorage.setItem("portfolio_messages", JSON.stringify(messages));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_messages").upsert(messages[index]).catch(err => console.error("Supabase message read toggle failed:", err));
      }
    }
  },

  // Settings & Bio
  getSettings() {
    return JSON.parse(localStorage.getItem("portfolio_settings") || "{}");
  },
  
  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("portfolio_settings", JSON.stringify(updated));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_settings").upsert({ id: "main_settings", ...updated }).catch(err => console.error("Supabase settings save failed:", err));
    }
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
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_timeline").upsert(item).catch(err => console.error("Supabase timeline save failed:", err));
    }
    return item;
  },

  deleteTimelineItem(id) {
    const timeline = this.getTimeline();
    const filtered = timeline.filter(t => t.id !== id);
    localStorage.setItem("portfolio_timeline", JSON.stringify(filtered));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_timeline").delete().eq("id", id).catch(err => console.error("Supabase timeline delete failed:", err));
    }
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
      articles.push(article);
    }
    localStorage.setItem("portfolio_blog", JSON.stringify(articles));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_blog").upsert(article).catch(err => console.error("Supabase article save failed:", err));
    }
    return article;
  },

  deleteArticle(id) {
    const articles = this.getArticles();
    const filtered = articles.filter(a => a.id !== id);
    localStorage.setItem("portfolio_blog", JSON.stringify(filtered));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_blog").delete().eq("id", id).catch(err => console.error("Supabase article delete failed:", err));
    }
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
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_certificates").upsert(cert).catch(err => console.error("Supabase certificate save failed:", err));
    }
    return cert;
  },

  deleteCertificate(id) {
    const certs = this.getCertificates();
    const filtered = certs.filter(c => c.id !== id);
    localStorage.setItem("portfolio_certificates", JSON.stringify(filtered));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_certificates").delete().eq("id", id).catch(err => console.error("Supabase certificate delete failed:", err));
    }
  },

  // Hackathons CRUD
  getHackathons() {
    return JSON.parse(localStorage.getItem("portfolio_hackathons") || "[]");
  },

  saveHackathon(hackathon) {
    const hackathons = this.getHackathons();
    if (hackathon.id) {
      const index = hackathons.findIndex(h => h.id === hackathon.id);
      if (index !== -1) {
        hackathons[index] = { ...hackathons[index], ...hackathon };
      }
    } else {
      hackathon.id = "hack-" + Date.now();
      hackathons.push(hackathon);
    }
    localStorage.setItem("portfolio_hackathons", JSON.stringify(hackathons));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_hackathons").upsert(hackathon).catch(err => console.error("Supabase hackathon save failed:", err));
    }
    return hackathon;
  },

  deleteHackathon(id) {
    const hackathons = this.getHackathons();
    const filtered = hackathons.filter(h => h.id !== id);
    localStorage.setItem("portfolio_hackathons", JSON.stringify(filtered));
    
    if (isCloudActive && supabase) {
      supabase.from("portfolio_hackathons").delete().eq("id", id).catch(err => console.error("Supabase hackathon delete failed:", err));
    }
  }
};
