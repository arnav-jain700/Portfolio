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

      // Helper to fetch collection and merge with localStorage safely without overwriting new local entries
      const syncTable = async (tableName, storageKey) => {
        try {
          const { data: cloudItems, error } = await supabase.from(tableName).select("*");
          if (error) {
            console.warn(`Supabase read error for '${tableName}':`, error);
            return;
          }
          const localList = JSON.parse(localStorage.getItem(storageKey) || "[]");
          const cloudList = cloudItems || [];

          // Map by ID to merge local and cloud items without data loss
          const itemMap = new Map();
          
          localList.forEach(item => {
            if (item && item.id) {
              if (tableName === "portfolio_certificates") {
                item.url = item.url || item.credentialUrl || "";
                item.credentialUrl = item.credentialUrl || item.url || "";
              }
              itemMap.set(item.id, item);
            }
          });

          cloudList.forEach(item => {
            if (item && item.id) {
              if (tableName === "portfolio_certificates") {
                item.url = item.url || item.credentialUrl || "";
                item.credentialUrl = item.credentialUrl || item.url || "";
              }
              itemMap.set(item.id, item);
            }
          });

          const mergedList = Array.from(itemMap.values());
          localStorage.setItem(storageKey, JSON.stringify(mergedList));

          // Upload any local items missing from cloud
          const cloudIds = new Set(cloudList.map(i => i.id));
          const missingInCloud = localList.filter(i => i && i.id && !cloudIds.has(i.id));

          if (missingInCloud.length > 0) {
            console.log(`Syncing ${missingInCloud.length} local items to Supabase '${tableName}'...`);
            for (const item of missingInCloud) {
              const payload = tableName === "portfolio_certificates" 
                ? { 
                    id: item.id, 
                    title: item.title || "", 
                    issuer: item.issuer || "", 
                    date: item.date || "", 
                    credentialUrl: item.url || item.credentialUrl || "", 
                    skills: item.skills || "", 
                    image: item.image || "" 
                  }
                : item;
              await supabase.from(tableName).upsert(payload).catch(err => console.warn(`Upload failed for item ${item.id}:`, err));
            }
          }
        } catch (err) {
          console.warn(`Supabase table sync failed for '${tableName}':`, err);
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
      console.error("Local save project error:", err);
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
      console.error("Local delete project error:", err);
    }
  },

  // Tech Stacks CRUD
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
      console.error("Local save skill error:", err);
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
      console.error("Local delete skill error:", err);
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
      console.error("Local save message error:", err);
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
      console.error("Local delete message error:", err);
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
      console.error("Local message read error:", err);
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
      console.error("Local message toggle error:", err);
    }
  },

  // Settings & Bio
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem("portfolio_settings") || "{}");
    } catch (e) {
      return {};
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
      console.error("Local save settings error:", err);
      return settings;
    }
  },

  // Timeline CRUD
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
      console.error("Local save timeline error:", err);
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
      console.error("Local delete timeline error:", err);
    }
  },

  // Blog CRUD
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
      console.error("Local save article error:", err);
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
      console.error("Local delete article error:", err);
    }
  },

  // Certificates CRUD
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
      console.error("Local save certificate error:", err);
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
      console.error("Local delete certificate error:", err);
    }
  },

  // Hackathons CRUD
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
      console.error("Local save hackathon error:", err);
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
      console.error("Local delete hackathon error:", err);
    }
  }
};
