import { supabase, isCloudActive } from "./supabase.js";

// One-time automatic cache purge to wipe any previous mock/cached entries
if (typeof window !== "undefined" && window.localStorage) {
  if (localStorage.getItem("portfolio_clean_reset_v3") !== "true") {
    localStorage.removeItem("portfolio_projects");
    localStorage.removeItem("portfolio_tech_stacks");
    localStorage.removeItem("portfolio_timeline");
    localStorage.removeItem("portfolio_certificates");
    localStorage.removeItem("portfolio_hackathons");
    localStorage.removeItem("portfolio_blog");
    localStorage.removeItem("portfolio_messages");
    localStorage.setItem("portfolio_clean_reset_v3", "true");
  }
}

// Clean Default Seeds (All empty)
const DEFAULT_TECH_STACKS = [];
const DEFAULT_PROJECTS = [];
const DEFAULT_MESSAGES = [];
const DEFAULT_TIMELINE_ITEMS = [];
const DEFAULT_ARTICLES = [];
const DEFAULT_CERTIFICATES = [];
const DEFAULT_HACKATHONS = [];

const DEFAULT_SETTINGS = {
  ownerName: "Arnav Jain",
  ownerBio: "Data Science and AI Developer dedicated to forging robust data architectures and breathing life into complex systems through generative, intelligent models.",
  email: "arnavjain1905@gmail.com",
  location: "Ludhiana, Punjab, India",
  linkedin: "https://www.linkedin.com/in/arnav-jain007/",
  github: "https://github.com/arnav-jain700",
  codolio: "https://codolio.com/profile/Jarnav",
  medium: "https://medium.com/@arnav4334",
  geminiKey: "",
  categories: ["Frontend", "Backend", "Databases", "DevOps", "Version Control"]
};

// Initialize Storage
function initStorage() {
  const getOrSeed = (key, defaultData) => {
    const existing = localStorage.getItem(key);
    if (!existing) {
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
    localStorage.setItem("portfolio_settings", JSON.stringify(DEFAULT_SETTINGS));
  } else {
    try {
      const parsed = JSON.parse(currentSettings);
      const updated = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : DEFAULT_SETTINGS.categories
      };
      localStorage.setItem("portfolio_settings", JSON.stringify(updated));
    } catch (e) {
      localStorage.setItem("portfolio_settings", JSON.stringify(DEFAULT_SETTINGS));
    }
  }
}

initStorage();

export const Database = {
  // Global Cloud Database Sync (Cloud is the primary source of truth)
  async syncWithCloud() {
    if (!isCloudActive || !supabase) return false;
    try {
      console.log("Fetching global portfolio data from Supabase Cloud...");
      
      // 1. Sync Settings
      try {
        const { data: settingsData, error } = await supabase.from("portfolio_settings").select("*").eq("id", "main_settings").maybeSingle();
        if (!error && settingsData) {
          const { id, ...cleanSettings } = settingsData;
          const localSettings = JSON.parse(localStorage.getItem("portfolio_settings") || "{}");
          localStorage.setItem("portfolio_settings", JSON.stringify({ ...localSettings, ...cleanSettings }));
        } else if (!settingsData) {
          const localSettings = JSON.parse(localStorage.getItem("portfolio_settings") || "{}");
          if (localSettings && localSettings.ownerName) {
            await supabase.from("portfolio_settings").upsert({ id: "main_settings", ...localSettings });
          }
        }
      } catch (err) {
        console.warn("Supabase settings sync error:", err);
      }

      // 2. Helper to fetch any table from cloud and update local fast-read cache
      const syncTable = async (tableName, storageKey) => {
        try {
          const { data: cloudItems, error } = await supabase.from(tableName).select("*");
          if (error) {
            console.warn(`Supabase read error for '${tableName}':`, error);
            return;
          }
          if (Array.isArray(cloudItems)) {
            const cleaned = cloudItems.map(item => {
              if (tableName === "portfolio_certificates") {
                return {
                  ...item,
                  url: item.url || item.credentialUrl || "",
                  credentialUrl: item.credentialUrl || item.url || ""
                };
              }
              if (tableName === "portfolio_projects") {
                return {
                  ...item,
                  tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === "string" ? item.tags.split(",").map(t => t.trim()).filter(Boolean) : [])
                };
              }
              return item;
            });
            localStorage.setItem(storageKey, JSON.stringify(cleaned));
          }
        } catch (err) {
          console.warn(`Supabase table sync error for '${tableName}':`, err);
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

      console.log("Global cloud synchronization complete. Cache updated.");
      return true;
    } catch (e) {
      console.error("Cloud synchronization failed:", e);
      return false;
    }
  },

  // Projects CRUD (Global & Local)
  getProjects() {
    try {
      const items = JSON.parse(localStorage.getItem("portfolio_projects") || "[]");
      return (Array.isArray(items) ? items : []).map(p => ({
        id: p.id || "proj-" + Date.now(),
        title: p.title || "Untitled Project",
        category: p.category || "Development",
        description: p.description || "",
        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",").map(t => t.trim()).filter(Boolean) : []),
        githubUrl: p.githubUrl || "",
        liveUrl: p.liveUrl || "",
        image: p.image || ""
      }));
    } catch (e) {
      console.warn("Failed to parse projects:", e);
      return [];
    }
  },
  
  saveProject(project) {
    try {
      const projects = this.getProjects();
      if (!Array.isArray(project.tags)) {
        project.tags = typeof project.tags === "string" ? project.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      }
      if (project.id) {
        const index = projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          projects[index] = { ...projects[index], ...project };
        } else {
          projects.push(project);
        }
      } else {
        project.id = "proj-" + Date.now();
        projects.push(project);
      }
      localStorage.setItem("portfolio_projects", JSON.stringify(projects));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_projects").upsert(project).catch(err => console.warn("Supabase project save failed:", err));
      }
    } catch (err) {
      console.error("Save project error:", err);
    }
    return project;
  },
  
  deleteProject(id) {
    try {
      const projects = this.getProjects();
      const filtered = projects.filter(p => p.id !== id);
      localStorage.setItem("portfolio_projects", JSON.stringify(filtered));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_projects").delete().eq("id", id).catch(err => console.warn("Supabase project delete failed:", err));
      }
    } catch (err) {
      console.error("Delete project error:", err);
    }
  },

  // Tech Stacks CRUD (Global & Local)
  getTechStacks() {
    try {
      const items = JSON.parse(localStorage.getItem("portfolio_tech_stacks") || "[]");
      return (Array.isArray(items) ? items : []).map(s => ({
        id: s.id || "tech-" + Date.now(),
        name: s.name || "",
        category: s.category || "General",
        level: Number(s.level) || 80,
        icon: s.icon || s.name || ""
      }));
    } catch (e) {
      console.warn("Failed to parse tech stacks:", e);
      return [];
    }
  },
  
  saveTechStack(stack) {
    try {
      const stacks = this.getTechStacks();
      stack.level = Number(stack.level) || 80;
      if (stack.id) {
        const index = stacks.findIndex(s => s.id === stack.id);
        if (index !== -1) {
          stacks[index] = { ...stacks[index], ...stack };
        } else {
          stacks.push(stack);
        }
      } else {
        stack.id = "tech-" + Date.now();
        stacks.push(stack);
      }
      localStorage.setItem("portfolio_tech_stacks", JSON.stringify(stacks));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_tech_stacks").upsert(stack).catch(err => console.warn("Supabase skill save failed:", err));
      }
    } catch (err) {
      console.error("Save skill error:", err);
    }
    return stack;
  },
  
  deleteTechStack(id) {
    try {
      const stacks = this.getTechStacks();
      const filtered = stacks.filter(s => s.id !== id);
      localStorage.setItem("portfolio_tech_stacks", JSON.stringify(filtered));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_tech_stacks").delete().eq("id", id).catch(err => console.warn("Supabase skill delete failed:", err));
      }
    } catch (err) {
      console.error("Delete skill error:", err);
    }
  },

  // Contact Messages CRUD
  getMessages() {
    try {
      const items = JSON.parse(localStorage.getItem("portfolio_messages") || "[]");
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  },
  
  saveMessage(msg) {
    try {
      const messages = this.getMessages();
      msg.id = msg.id || "msg-" + Date.now();
      msg.timestamp = msg.timestamp || new Date().toISOString();
      msg.unread = msg.unread !== undefined ? msg.unread : true;
      messages.unshift(msg);
      localStorage.setItem("portfolio_messages", JSON.stringify(messages));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_messages").upsert(msg).catch(err => console.warn("Supabase message save failed:", err));
      }
    } catch (err) {
      console.error("Save message error:", err);
    }
    return msg;
  },
  
  deleteMessage(id) {
    try {
      const messages = this.getMessages();
      const filtered = messages.filter(m => m.id !== id);
      localStorage.setItem("portfolio_messages", JSON.stringify(filtered));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_messages").delete().eq("id", id).catch(err => console.warn("Supabase message delete failed:", err));
      }
    } catch (err) {
      console.error("Delete message error:", err);
    }
  },

  markMessageAsRead(id) {
    try {
      const messages = this.getMessages();
      const index = messages.findIndex(m => m.id === id);
      if (index !== -1) {
        messages[index].unread = false;
        localStorage.setItem("portfolio_messages", JSON.stringify(messages));
        
        if (isCloudActive && supabase) {
          supabase.from("portfolio_messages").upsert(messages[index]).catch(err => console.warn("Supabase message read update failed:", err));
        }
      }
    } catch (err) {
      console.error("Message read error:", err);
    }
  },

  toggleMessageRead(id) {
    try {
      const messages = this.getMessages();
      const index = messages.findIndex(m => m.id === id);
      if (index !== -1) {
        messages[index].unread = !messages[index].unread;
        localStorage.setItem("portfolio_messages", JSON.stringify(messages));
        
        if (isCloudActive && supabase) {
          supabase.from("portfolio_messages").upsert(messages[index]).catch(err => console.warn("Supabase message read toggle failed:", err));
        }
      }
    } catch (err) {
      console.error("Message toggle error:", err);
    }
  },

  // Settings & Bio (Global & Local)
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem("portfolio_settings") || "{}");
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },
  
  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem("portfolio_settings", JSON.stringify(updated));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_settings").upsert({ id: "main_settings", ...updated }).catch(err => console.warn("Supabase settings save failed:", err));
      }
      return updated;
    } catch (err) {
      console.error("Save settings error:", err);
      return settings;
    }
  },

  // Timeline CRUD (Global & Local)
  getTimeline() {
    try {
      const items = JSON.parse(localStorage.getItem("portfolio_timeline") || "[]");
      return (Array.isArray(items) ? items : []).map(t => ({
        id: t.id || "time-" + Date.now(),
        title: t.title || "",
        company: t.company || "",
        role: t.role || "",
        dateRange: t.dateRange || "",
        type: t.type || "experience",
        description: t.description || ""
      }));
    } catch (e) {
      return [];
    }
  },

  saveTimelineItem(item) {
    try {
      const timeline = this.getTimeline();
      if (item.id) {
        const index = timeline.findIndex(t => t.id === item.id);
        if (index !== -1) {
          timeline[index] = { ...timeline[index], ...item };
        } else {
          timeline.push(item);
        }
      } else {
        item.id = "time-" + Date.now();
        timeline.push(item);
      }
      localStorage.setItem("portfolio_timeline", JSON.stringify(timeline));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_timeline").upsert(item).catch(err => console.warn("Supabase timeline save failed:", err));
      }
    } catch (err) {
      console.error("Save timeline error:", err);
    }
    return item;
  },

  deleteTimelineItem(id) {
    try {
      const timeline = this.getTimeline();
      const filtered = timeline.filter(t => t.id !== id);
      localStorage.setItem("portfolio_timeline", JSON.stringify(filtered));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_timeline").delete().eq("id", id).catch(err => console.warn("Supabase timeline delete failed:", err));
      }
    } catch (err) {
      console.error("Delete timeline error:", err);
    }
  },

  // Blog CRUD (Global & Local)
  getArticles() {
    try {
      const items = JSON.parse(localStorage.getItem("portfolio_blog") || "[]");
      return (Array.isArray(items) ? items : []).map(a => ({
        id: a.id || "blog-" + Date.now(),
        title: a.title || "",
        summary: a.summary || "",
        tags: Array.isArray(a.tags) ? a.tags : (typeof a.tags === "string" ? a.tags.split(",").map(t => t.trim()).filter(Boolean) : []),
        content: a.content || "",
        date: a.date || new Date().toISOString().split("T")[0]
      }));
    } catch (e) {
      return [];
    }
  },

  saveArticle(article) {
    try {
      const articles = this.getArticles();
      if (!Array.isArray(article.tags)) {
        article.tags = typeof article.tags === "string" ? article.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      }
      if (article.id) {
        const index = articles.findIndex(a => a.id === article.id);
        if (index !== -1) {
          articles[index] = { ...articles[index], ...article };
        } else {
          articles.push(article);
        }
      } else {
        article.id = "art-" + Date.now();
        articles.push(article);
      }
      localStorage.setItem("portfolio_blog", JSON.stringify(articles));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_blog").upsert(article).catch(err => console.warn("Supabase article save failed:", err));
      }
    } catch (err) {
      console.error("Save article error:", err);
    }
    return article;
  },

  deleteArticle(id) {
    try {
      const articles = this.getArticles();
      const filtered = articles.filter(a => a.id !== id);
      localStorage.setItem("portfolio_blog", JSON.stringify(filtered));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_blog").delete().eq("id", id).catch(err => console.warn("Supabase article delete failed:", err));
      }
    } catch (err) {
      console.error("Delete article error:", err);
    }
  },

  // Certificates CRUD (Global & Local)
  getCertificates() {
    try {
      const items = JSON.parse(localStorage.getItem("portfolio_certificates") || "[]");
      return (Array.isArray(items) ? items : []).map(c => ({
        id: c.id || "cert-" + Date.now(),
        title: c.title || "",
        issuer: c.issuer || "",
        date: c.date || "",
        url: c.url || c.credentialUrl || "",
        credentialUrl: c.credentialUrl || c.url || "",
        skills: c.skills || "",
        image: c.image || ""
      }));
    } catch (e) {
      return [];
    }
  },

  saveCertificate(cert) {
    try {
      const certs = this.getCertificates();
      cert.url = cert.url || cert.credentialUrl || "";
      cert.credentialUrl = cert.credentialUrl || cert.url || "";
      if (cert.id) {
        const index = certs.findIndex(c => c.id === cert.id);
        if (index !== -1) {
          certs[index] = { ...certs[index], ...cert };
        } else {
          certs.push(cert);
        }
      } else {
        cert.id = "cert-" + Date.now();
        certs.push(cert);
      }
      localStorage.setItem("portfolio_certificates", JSON.stringify(certs));
      
      if (isCloudActive && supabase) {
        const cloudPayload = {
          id: cert.id,
          title: cert.title || "",
          issuer: cert.issuer || "",
          date: cert.date || "",
          credentialUrl: cert.url || cert.credentialUrl || "",
          skills: cert.skills || "",
          image: cert.image || ""
        };
        supabase.from("portfolio_certificates").upsert(cloudPayload).catch(err => console.warn("Supabase certificate save failed:", err));
      }
    } catch (err) {
      console.error("Save certificate error:", err);
    }
    return cert;
  },

  deleteCertificate(id) {
    try {
      const certs = this.getCertificates();
      const filtered = certs.filter(c => c.id !== id);
      localStorage.setItem("portfolio_certificates", JSON.stringify(filtered));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_certificates").delete().eq("id", id).catch(err => console.warn("Supabase certificate delete failed:", err));
      }
    } catch (err) {
      console.error("Delete certificate error:", err);
    }
  },

  // Hackathons CRUD (Global & Local)
  getHackathons() {
    try {
      const items = JSON.parse(localStorage.getItem("portfolio_hackathons") || "[]");
      return (Array.isArray(items) ? items : []).map(h => ({
        id: h.id || "hack-" + Date.now(),
        title: h.title || "",
        organizer: h.organizer || "",
        date: h.date || "",
        role: h.role || "",
        projectName: h.projectName || "",
        achievement: h.achievement || "",
        description: h.description || "",
        technologies: h.technologies || "",
        projectUrl: h.projectUrl || "",
        certificateUrl: h.certificateUrl || "",
        image: h.image || ""
      }));
    } catch (e) {
      return [];
    }
  },

  saveHackathon(hackathon) {
    try {
      const hackathons = this.getHackathons();
      if (hackathon.id) {
        const index = hackathons.findIndex(h => h.id === hackathon.id);
        if (index !== -1) {
          hackathons[index] = { ...hackathons[index], ...hackathon };
        } else {
          hackathons.push(hackathon);
        }
      } else {
        hackathon.id = "hack-" + Date.now();
        hackathons.push(hackathon);
      }
      localStorage.setItem("portfolio_hackathons", JSON.stringify(hackathons));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_hackathons").upsert(hackathon).catch(err => console.warn("Supabase hackathon save failed:", err));
      }
    } catch (err) {
      console.error("Save hackathon error:", err);
    }
    return hackathon;
  },

  deleteHackathon(id) {
    try {
      const hackathons = this.getHackathons();
      const filtered = hackathons.filter(h => h.id !== id);
      localStorage.setItem("portfolio_hackathons", JSON.stringify(filtered));
      
      if (isCloudActive && supabase) {
        supabase.from("portfolio_hackathons").delete().eq("id", id).catch(err => console.warn("Supabase hackathon delete failed:", err));
      }
    } catch (err) {
      console.error("Delete hackathon error:", err);
    }
  }
};
