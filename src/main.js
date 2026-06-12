import { Database } from "./data.js";
import { AI } from "./ai.js";

// DOM Selector Elements
const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const logo = document.getElementById("brand-logo");

// Active state for sections
let activeTab = "home";

// ----------------------------------------------------
// ROUTING & NAVIGATION
// ----------------------------------------------------
function switchPage(pageId) {
  // Access protection for admin page
  if (pageId === "admin" && !isAdminUnlocked()) {
    switchPage("home");
    return;
  }

  navLinks.forEach(link => {
    if (link.dataset.page === pageId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  pages.forEach(page => {
    if (page.id === `${pageId}-page`) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });

  activeTab = pageId;

  // Specific page initialization callbacks
  if (pageId === "home") {
    renderHomeStats();
    renderTimeline();
  } else if (pageId === "tech") {
    renderTechCategoryFilters();
    renderTechGrid("All");
    renderRadarChart();
  } else if (pageId === "projects") {
    renderProjectFilters();
    renderProjectsGrid();
  } else if (pageId === "blog") {
    renderBlogGrid();
  } else if (pageId === "admin") {
    initAdminPanel();
  }
}

// Bind Navigation Events
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    switchPage(link.dataset.page);
  });
});

logo.addEventListener("click", () => {
  switchPage("home");
});

document.getElementById("cta-view-work").addEventListener("click", () => {
  switchPage("projects");
});

document.getElementById("cta-contact").addEventListener("click", () => {
  switchPage("contact");
});

// ----------------------------------------------------
// HOME PAGE: STATS & DYNAMIC SLIDER
// ----------------------------------------------------
function renderHomeStats() {
  const projects = Database.getProjects();
  const tech = Database.getTechStacks();
  const settings = Database.getSettings();

  document.getElementById("stat-projects-count").textContent = projects.length;
  document.getElementById("stat-skills-count").textContent = tech.length;
  
  const aiStateEl = document.getElementById("stat-ai-mode");
  const subStatusEl = document.getElementById("chat-sub-status");
  
  if (settings.geminiKey) {
    aiStateEl.textContent = "Gemini API";
    aiStateEl.style.color = "var(--accent-cyan)";
    subStatusEl.textContent = "Gemini AI Agent";
  } else {
    aiStateEl.textContent = "Sandbox Mode";
    aiStateEl.style.color = "var(--text-muted)";
    subStatusEl.textContent = "Offline Sandboxed Agent";
  }

  document.getElementById("owner-name-display").textContent = settings.ownerName || "Arnav Jain";
  document.getElementById("owner-bio-display").textContent = settings.ownerBio || "";

  // Dynamic Contact Page Displays
  document.getElementById("contact-email-display").textContent = settings.email || "arnavjain1905@gmail.com";
  document.getElementById("contact-location-display").textContent = settings.location || "Ludhiana, Punjab, India";
  
  const linkedinUrl = settings.linkedin || "https://www.linkedin.com/in/arnav-jain007/";
  const linkedinUser = linkedinUrl.replace(/\/$/, "").split("/").pop() || "arnav-jain007";
  document.getElementById("contact-linkedin-display").innerHTML = `<a href="${linkedinUrl}" target="_blank" style="color: inherit; text-decoration: none; border-bottom: 1px dashed var(--border-light);">${linkedinUser}</a>`;

  // Render extra socials/developer links dynamically
  const extraGroup = document.getElementById("contact-extra-socials-group");
  const extraList = document.getElementById("contact-extra-socials-list");
  extraList.innerHTML = "";
  let hasExtra = false;

  const extras = [
    { name: "GitHub", url: settings.github },
    { name: "Codolio", url: settings.codolio },
    { name: "Medium", url: settings.medium }
  ];

  extras.forEach(item => {
    // Only render if URL is defined and is not the generic base URL template
    if (item.url && item.url !== "https://github.com" && item.url !== "https://codolio.com" && item.url !== "https://medium.com" && item.url.trim() !== "") {
      hasExtra = true;
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.style.color = "var(--accent-cyan)";
      link.style.textDecoration = "none";
      link.style.fontSize = "0.95rem";
      link.style.fontWeight = "500";
      link.style.display = "block";
      
      let display = item.url.replace(/\/$/, "").split("/").pop();
      if (!display || display.includes(".com") || display.length < 2) display = "Profile Link";
      
      link.innerHTML = `&bull; <strong>${item.name}</strong>: <span style="border-bottom: 1px dashed rgba(6, 182, 212, 0.4);">${display}</span>`;
      extraList.appendChild(link);
    }
  });

  if (hasExtra) {
    extraGroup.style.display = "flex";
  } else {
    extraGroup.style.display = "none";
  }
}

// Key Philosophy slider setup
let currentSlide = 0;
const slideTrack = document.getElementById("philosophy-slider-track");
const dotsContainer = document.getElementById("philosophy-slider-dots");
let sliderInterval;

function initSlider() {
  const slides = slideTrack.children;
  dotsContainer.innerHTML = "";
  
  for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement("div");
    dot.className = `slider-dot ${i === 0 ? "active" : ""}`;
    dot.addEventListener("click", () => {
      goToSlide(i);
      resetSliderTimer();
    });
    dotsContainer.appendChild(dot);
  }

  startSliderTimer();
}

function goToSlide(index) {
  const slides = slideTrack.children;
  if (index >= slides.length) index = 0;
  if (index < 0) index = slides.length - 1;
  
  currentSlide = index;
  slideTrack.style.transform = `translateX(-${index * 100}%)`;
  
  // Update dots
  const dots = dotsContainer.children;
  Array.from(dots).forEach((dot, idx) => {
    if (idx === index) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

function startSliderTimer() {
  sliderInterval = setInterval(() => {
    goToSlide(currentSlide + 1);
  }, 6000);
}

function resetSliderTimer() {
  clearInterval(sliderInterval);
  startSliderTimer();
}

// ----------------------------------------------------
// TECH STACK PAGE
// ----------------------------------------------------
let activeTechFilter = "All";

function renderTechGrid(category) {
  const techGrid = document.getElementById("tech-grid-container");
  const techStacks = Database.getTechStacks();
  
  const filtered = category === "All" 
    ? techStacks 
    : techStacks.filter(t => t.category === category);

  techGrid.innerHTML = "";

  if (filtered.length === 0) {
    techGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dimmed); padding: 40px;">No tech stacks added under this category. Add them in the Admin page!</div>`;
    return;
  }

  filtered.forEach(tech => {
    const card = document.createElement("div");
    card.className = "tech-card glass-card";
    card.style.cursor = "pointer";
    card.title = `Click to filter projects for ${tech.name}`;
    
    // Quick custom SVG fallback based on icon text
    let iconSvg = "";
    if (tech.name.toLowerCase().includes("react")) {
      iconSvg = `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="2"/><path d="M12 2v20M17 5L7 19M19 17L5 7"/></svg>`;
    } else if (tech.name.toLowerCase().includes("js") || tech.name.toLowerCase().includes("javascript")) {
      iconSvg = `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 15h12M9 9h6M13 3l-4 18"/></svg>`;
    } else if (tech.name.toLowerCase().includes("node")) {
      iconSvg = `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    } else if (tech.name.toLowerCase().includes("db") || tech.name.toLowerCase().includes("mongo") || tech.name.toLowerCase().includes("sql")) {
      iconSvg = `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`;
    } else if (tech.name.toLowerCase().includes("python")) {
      iconSvg = `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 22a7 7 0 0 0 5-5h-3a4 4 0 0 1-4-4V7H5a7 7 0 0 0 7 15z"/><path d="M12 2a7 7 0 0 0-5 5h3a4 4 0 0 1 4 4v6h5a7 7 0 0 0-7-15z"/></svg>`;
    } else if (tech.name.toLowerCase().includes("docker")) {
      iconSvg = `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M6 6h4v4H6zm8 0h4v4h-4zm0 8h4v4h-4zm-8 0h4v4H6z"/></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`;
    }

    card.innerHTML = `
      <div class="tech-icon-wrapper">${iconSvg}</div>
      <h3>${tech.name}</h3>
      <p style="color: var(--text-dimmed); font-size: 0.8rem;">${tech.category}</p>
      <div class="tech-level-bar">
        <div class="tech-level-fill" style="width: 0%" data-width="${tech.level}%"></div>
      </div>
      <span class="tech-level-text">${tech.level}%</span>
    `;

    // Clicking a tech card navigates to projects and searches for that tech
    card.addEventListener("click", () => {
      switchPage("projects");
      const searchBox = document.getElementById("project-search-input");
      searchBox.value = tech.name;
      // Trigger search filter
      filterProjects();
    });

    techGrid.appendChild(card);
  });

  // Animate the skill level fills after cards render
  setTimeout(() => {
    document.querySelectorAll(".tech-level-fill").forEach(fill => {
      fill.style.width = fill.dataset.width;
    });
  }, 100);
}

function renderTechCategoryFilters() {
  const container = document.getElementById("tech-category-filters");
  if (!container) return;
  const settings = Database.getSettings();
  const categories = settings.categories || ["Frontend", "Backend", "Databases", "DevOps"];
  const techStacks = Database.getTechStacks();

  container.innerHTML = `<button class="tech-filter-btn active" data-category="All">All Tech (${techStacks.length})</button>`;
  categories.forEach(cat => {
    const count = techStacks.filter(t => t.category === cat).length;
    container.innerHTML += `<button class="tech-filter-btn" data-category="${cat}">${cat} (${count})</button>`;
  });

  // Re-bind click events
  container.querySelectorAll(".tech-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".tech-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTechGrid(btn.dataset.category);
    });
  });
}

// ----------------------------------------------------
// PROJECTS PAGE & CAROUSEL/SLIDER
// ----------------------------------------------------
let activeProjectFilter = "All";

function renderProjectFilters() {
  const container = document.getElementById("project-tech-filters");
  const techStacks = Database.getTechStacks();
  const projects = Database.getProjects();
  
  container.innerHTML = `<button class="tech-filter-btn active" data-tag="All">All Projects (${projects.length})</button>`;
  
  techStacks.forEach(tech => {
    const count = projects.filter(p => p.tags.some(tag => tag.toLowerCase() === tech.name.toLowerCase())).length;
    if (count > 0) {
      const btn = document.createElement("button");
      btn.className = "tech-filter-btn";
      btn.textContent = `${tech.name} (${count})`;
      btn.dataset.tag = tech.name;
      container.appendChild(btn);
    }
  });

  // Re-bind click events
  container.querySelectorAll(".tech-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".tech-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeProjectFilter = btn.dataset.tag;
      filterProjects();
    });
  });
}

function renderProjectsGrid(projectsList = null) {
  const grid = document.getElementById("projects-grid-container");
  const projects = projectsList || Database.getProjects();

  grid.innerHTML = "";

  if (projects.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dimmed); padding: 40px;">No projects match the selected criteria. Add/edit them in the Admin tab!</div>`;
    return;
  }

  projects.forEach(proj => {
    const card = document.createElement("div");
    card.className = "project-card glass-card";

    // Set custom icon graphic or code vector as thumbnail representation
    card.innerHTML = `
      <div class="project-thumbnail">
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; max-height: 120px;" fill="none" stroke="currentColor" stroke-width="0.8">
          <circle cx="50" cy="50" r="30" stroke="rgba(99, 102, 241, 0.15)" stroke-width="4"/>
          <path d="M35 50 L45 60 L65 40" stroke="var(--accent-cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="project-badges">
          <span class="badge">${proj.category}</span>
        </div>
      </div>
      <div class="project-content">
        <h3>${proj.title}</h3>
        <p class="project-desc">${proj.description}</p>
        <div class="project-tech-list">
          ${proj.tags.map(tag => `<span class="project-tech-tag">${tag}</span>`).join("")}
        </div>
        <div class="project-links">
          <a href="${proj.githubUrl || '#'}" target="_blank" class="project-link" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            GitHub
          </a>
          <a href="${proj.liveUrl || '#'}" target="_blank" class="project-link" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Live Demo
          </a>
        </div>
      </div>
    `;

    // Click card to open modal detail view
    card.addEventListener("click", () => {
      openProjectModal(proj);
    });

    grid.appendChild(card);
  });
}

function filterProjects() {
  const searchVal = document.getElementById("project-search-input").value.toLowerCase();
  const projects = Database.getProjects();

  const filtered = projects.filter(proj => {
    const matchesSearch = proj.title.toLowerCase().includes(searchVal) || 
                          proj.description.toLowerCase().includes(searchVal);
                          
    const matchesTag = activeProjectFilter === "All" || 
                       proj.tags.some(t => t.toLowerCase() === activeProjectFilter.toLowerCase());

    return matchesSearch && matchesTag;
  });

  renderProjectsGrid(filtered);
}

document.getElementById("project-search-input").addEventListener("input", filterProjects);

// ----------------------------------------------------
// PORTFOLIO MODAL (Detail View)
// ----------------------------------------------------
const modalOverlay = document.getElementById("project-detail-modal");

function openProjectModal(project) {
  const content = document.getElementById("modal-content");
  content.innerHTML = `
    <h2 style="font-size: 2rem; margin-bottom: 8px;">${project.title}</h2>
    <span class="badge" style="display: inline-block; margin-bottom: 20px;">${project.category}</span>
    
    <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 30px; margin-bottom: 24px; text-align: center;">
      <svg viewBox="0 0 24 24" width="64" height="64" stroke="var(--accent-cyan)" stroke-width="1.5" fill="none" style="margin-bottom: 12px;">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <p style="color: var(--text-muted); font-size: 0.9rem;">Interactive Sandbox System Mockup</p>
    </div>

    <h3 style="margin-bottom: 8px;">About Project</h3>
    <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 1rem; line-height: 1.7;">
      ${project.description}
    </p>

    <h3 style="margin-bottom: 10px;">Tech Stack Employed</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px;">
      ${project.tags.map(tag => `<span class="badge" style="background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.25); color: var(--text-primary);">${tag}</span>`).join("")}
    </div>

    <div style="display: flex; gap: 16px;">
      <a href="${project.githubUrl || '#'}" target="_blank" class="btn btn-primary">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
        Source Repository
      </a>
      <a href="${project.liveUrl || '#'}" target="_blank" class="btn btn-secondary">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Deployment Link
      </a>
    </div>
  `;
  modalOverlay.classList.add("open");
}

function closeModal() {
  modalOverlay.classList.remove("open");
}

document.getElementById("modal-close-btn").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ----------------------------------------------------
// CONTACT FORM HANDLER
// ----------------------------------------------------
const contactForm = document.getElementById("contact-submission-form");
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const message = messageInput.value.trim();

  // Reset errors
  document.getElementById("contact-name-error").style.display = "none";
  document.getElementById("contact-email-error").style.display = "none";
  document.getElementById("contact-message-error").style.display = "none";

  nameInput.style.borderColor = "var(--border-light)";
  emailInput.style.borderColor = "var(--border-light)";
  messageInput.style.borderColor = "var(--border-light)";

  let isValid = true;

  // Name check: min 2 chars, letters & spaces only
  const nameRegex = /^[A-Za-z\s]{2,}$/;
  if (!nameRegex.test(name)) {
    document.getElementById("contact-name-error").style.display = "block";
    nameInput.style.borderColor = "#ef4444";
    isValid = false;
  }

  // Email check: standard strict pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById("contact-email-error").style.display = "block";
    emailInput.style.borderColor = "#ef4444";
    isValid = false;
  }

  // Message check: min 10 chars
  if (message.length < 10) {
    document.getElementById("contact-message-error").style.display = "block";
    messageInput.style.borderColor = "#ef4444";
    isValid = false;
  }

  if (!isValid) return;

  Database.saveMessage({ name, email, message });

  // Reset & Success prompt
  contactForm.reset();
  nameInput.style.borderColor = "var(--border-light)";
  emailInput.style.borderColor = "var(--border-light)";
  messageInput.style.borderColor = "var(--border-light)";
  
  const successMsg = document.getElementById("contact-success-msg");
  successMsg.style.display = "block";

  setTimeout(() => {
    successMsg.style.display = "none";
  }, 4000);
});

// Real-time interactive validation hooks
document.getElementById("contact-name").addEventListener("input", (e) => {
  const input = e.target;
  const error = document.getElementById("contact-name-error");
  const nameRegex = /^[A-Za-z\s]{2,}$/;
  if (nameRegex.test(input.value.trim())) {
    input.style.borderColor = "rgba(34, 197, 94, 0.45)"; // Soft green glow
    error.style.display = "none";
  } else {
    input.style.borderColor = "var(--border-light)";
  }
});

document.getElementById("contact-email").addEventListener("input", (e) => {
  const input = e.target;
  const error = document.getElementById("contact-email-error");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(input.value.trim())) {
    input.style.borderColor = "rgba(34, 197, 94, 0.45)"; // Soft green glow
    error.style.display = "none";
  } else {
    input.style.borderColor = "var(--border-light)";
  }
});

document.getElementById("contact-message").addEventListener("input", (e) => {
  const input = e.target;
  const error = document.getElementById("contact-message-error");
  if (input.value.trim().length >= 10) {
    input.style.borderColor = "rgba(34, 197, 94, 0.45)"; // Soft green glow
    error.style.display = "none";
  } else {
    input.style.borderColor = "var(--border-light)";
  }
});

// ----------------------------------------------------
// CHATBOT WIDGET LOGIC
// ----------------------------------------------------
const chatToggle = document.getElementById("chat-widget-toggle");
const chatBox = document.getElementById("chat-widget-box");
const chatClose = document.getElementById("chat-widget-close");
const chatInput = document.getElementById("chat-user-input");
const chatSend = document.getElementById("chat-send-btn");
const messageHistory = document.getElementById("chat-message-history");

// In-memory conversation state
let chatHistory = [];

chatToggle.addEventListener("click", () => {
  chatBox.classList.toggle("open");
  if (chatBox.classList.contains("open")) {
    chatInput.focus();
  }
});

chatClose.addEventListener("click", () => {
  chatBox.classList.remove("open");
});

async function submitChatMessage() {
  const query = chatInput.value.trim();
  if (!query) return;

  // Render User query bubble
  renderChatBubble(query, "visitor");
  chatInput.value = "";

  // Render typing bubble
  const typingBubble = renderTypingBubble();
  
  // Call AI Assistant
  const answer = await AI.askAI(query, chatHistory);

  // Remove typing animation bubble
  typingBubble.remove();

  // Render Model answer bubble
  renderChatBubble(answer, "ai");

  // Save in history
  chatHistory.push({ sender: "visitor", text: query });
  chatHistory.push({ sender: "ai", text: answer });
}

function renderChatBubble(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = `chat-message ${sender}`;
  
  // Basic markdown formatting conversion inside bubble (bolding, line breaks)
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
    .replace(/•\s(.*?)(<br\/>|$)/g, '<li>$1</li>');

  bubble.innerHTML = formatted;
  messageHistory.appendChild(bubble);
  messageHistory.scrollTop = messageHistory.scrollHeight;
  return bubble;
}

function renderTypingBubble() {
  const bubble = document.createElement("div");
  bubble.className = "chat-typing";
  bubble.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  messageHistory.appendChild(bubble);
  messageHistory.scrollTop = messageHistory.scrollHeight;
  return bubble;
}

chatSend.addEventListener("click", submitChatMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") submitChatMessage();
});

// Bind click events to suggestion chips
document.querySelectorAll(".chat-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    chatInput.value = chip.dataset.query;
    submitChatMessage();
  });
});

// ----------------------------------------------------
// ADMIN DASHBOARD CORE
// ----------------------------------------------------
function populateAdminTechCategoriesDropdown() {
  const select = document.getElementById("admin-tech-category");
  if (!select) return;
  const settings = Database.getSettings();
  const categories = settings.categories || ["Frontend", "Backend", "Databases", "DevOps"];

  select.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  const optNew = document.createElement("option");
  optNew.value = "__new__";
  optNew.textContent = "+ Add Custom Category...";
  select.appendChild(optNew);
}

function initAdminPanel() {
  // Toggle Admin Sidebar Sub-Panes
  const tabs = document.querySelectorAll(".admin-tab-btn");
  const panes = document.querySelectorAll(".admin-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(tab.dataset.pane);
      targetPane.classList.add("active");

      // Specific sub-pane render trigger
      if (tab.dataset.pane === "admin-pane-tech") {
        renderAdminTechList();
        populateAdminTechCategoriesDropdown();
      } else if (tab.dataset.pane === "admin-pane-projects") {
        renderAdminProjectList();
        renderTechCheckboxes();
      } else if (tab.dataset.pane === "admin-pane-timeline") {
        renderAdminTimelineList();
      } else if (tab.dataset.pane === "admin-pane-blog") {
        renderAdminBlogList();
      } else if (tab.dataset.pane === "admin-pane-messages") {
        renderAdminMessages();
      } else if (tab.dataset.pane === "admin-pane-settings") {
        loadAdminSettings();
      }
    });
  });

  // Load primary default admin lists
  renderAdminTechList();
  populateAdminTechCategoriesDropdown();
  
  // Setup range label update
  const levelSlider = document.getElementById("admin-tech-level");
  const label = document.getElementById("prof-label");
  levelSlider.addEventListener("input", () => {
    label.textContent = `Proficiency: ${levelSlider.value}%`;
  });

  // Setup category dropdown change listener
  const categorySelect = document.getElementById("admin-tech-category");
  const customCategoryGroup = document.getElementById("admin-tech-custom-category-group");
  const customCategoryInput = document.getElementById("admin-tech-custom-category");

  categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "__new__") {
      customCategoryGroup.style.display = "block";
      customCategoryInput.required = true;
      customCategoryInput.focus();
    } else {
      customCategoryGroup.style.display = "none";
      customCategoryInput.required = false;
    }
  });

  setupAdminTimelineFormOnce();
  setupAdminBlogFormOnce();
}

// Admin: Manage Tech Stacks
const techForm = document.getElementById("admin-tech-form");
const cancelTechEdit = document.getElementById("admin-tech-cancel-btn");
const submitTechBtn = document.getElementById("admin-tech-submit-btn");

techForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("admin-tech-id").value;
  const name = document.getElementById("admin-tech-name").value.trim();
  let category = document.getElementById("admin-tech-category").value;
  const level = parseInt(document.getElementById("admin-tech-level").value, 10);

  if (category === "__new__") {
    const customVal = document.getElementById("admin-tech-custom-category").value.trim();
    if (!customVal) {
      alert("Please enter a custom category name.");
      return;
    }
    category = customVal;

    // Save to settings
    const settings = Database.getSettings();
    const categories = settings.categories || ["Frontend", "Backend", "Databases", "DevOps"];
    if (!categories.includes(category)) {
      categories.push(category);
      Database.saveSettings({ categories });
    }
  }

  Database.saveTechStack({ id: id || undefined, name, category, level, icon: name });
  resetTechForm();
  renderAdminTechList();
  
  // Refresh dropdown and categories list filter
  populateAdminTechCategoriesDropdown();
  renderTechCategoryFilters();
});

cancelTechEdit.addEventListener("click", resetTechForm);

function resetTechForm() {
  techForm.reset();
  document.getElementById("admin-tech-id").value = "";
  submitTechBtn.textContent = "Add Technology";
  cancelTechEdit.style.display = "none";
  document.getElementById("admin-tech-custom-category-group").style.display = "none";
  document.getElementById("admin-tech-custom-category").required = false;
  document.getElementById("prof-label").textContent = "Proficiency: 80%";
}

function renderAdminTechList() {
  const container = document.getElementById("admin-tech-list");
  const tech = Database.getTechStacks();
  
  container.innerHTML = "";
  if (tech.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No tech stacks saved.</div>`;
    return;
  }

  tech.forEach(t => {
    const el = document.createElement("div");
    el.className = "admin-list-item";
    el.innerHTML = `
      <div class="admin-list-info">
        <h4>${t.name}</h4>
        <p>${t.category} — ${t.level}% Proficiency</p>
      </div>
      <div class="admin-list-actions">
        <button class="action-btn edit" data-id="${t.id}" title="Edit details">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete" data-id="${t.id}" title="Remove skill">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `;

    el.querySelector(".edit").addEventListener("click", () => {
      document.getElementById("admin-tech-id").value = t.id;
      document.getElementById("admin-tech-name").value = t.name;
      
      const categorySelect = document.getElementById("admin-tech-category");
      categorySelect.value = t.category;
      document.getElementById("admin-tech-custom-category-group").style.display = "none";
      document.getElementById("admin-tech-custom-category").required = false;

      document.getElementById("admin-tech-level").value = t.level;
      document.getElementById("prof-label").textContent = `Proficiency: ${t.level}%`;

      submitTechBtn.textContent = "Update Technology";
      cancelTechEdit.style.display = "inline-block";
      document.getElementById("admin-tech-form").scrollIntoView({ behavior: "smooth" });
    });

    el.querySelector(".delete").addEventListener("click", () => {
      Database.deleteTechStack(t.id);
      renderAdminTechList();
    });

    container.appendChild(el);
  });
}

// Admin: Manage Projects
const projectForm = document.getElementById("admin-project-form");
const cancelProjEdit = document.getElementById("admin-project-cancel-btn");
const submitProjBtn = document.getElementById("admin-project-submit-btn");

function renderTechCheckboxes() {
  const container = document.getElementById("admin-project-tech-tags");
  const tech = Database.getTechStacks();
  container.innerHTML = "";

  if (tech.length === 0) {
    container.innerHTML = `<span style="color: var(--text-dimmed); font-size: 0.85rem;">No technologies available. Add some in 'Manage Toolkit' first!</span>`;
    return;
  }

  tech.forEach(t => {
    const label = document.createElement("label");
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.gap = "6px";
    label.style.marginRight = "12px";
    label.style.cursor = "pointer";
    label.style.color = "var(--text-primary)";
    label.style.fontSize = "0.85rem";

    label.innerHTML = `
      <input type="checkbox" name="proj-tags" value="${t.name}" style="accent-color: var(--accent-indigo);" />
      ${t.name}
    `;
    container.appendChild(label);
  });
}

// AI suggest project copy
document.getElementById("admin-project-ai-suggest").addEventListener("click", async () => {
  const title = document.getElementById("admin-project-title").value.trim();
  const checkboxes = document.querySelectorAll('input[name="proj-tags"]:checked');
  const selectedTech = Array.from(checkboxes).map(cb => cb.value);

  if (!title) {
    alert("Please insert a Project Title first before utilizing AI suggestions.");
    return;
  }

  const btn = document.getElementById("admin-project-ai-suggest");
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<span style="color: var(--accent-cyan);">Generating Draft...</span>`;
  btn.disabled = true;

  const aiDesc = await AI.generateProjectDescription(title, selectedTech);
  
  document.getElementById("admin-project-desc").value = aiDesc;
  btn.innerHTML = originalHtml;
  btn.disabled = false;
});

projectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("admin-project-id").value;
  const title = document.getElementById("admin-project-title").value.trim();
  const category = document.getElementById("admin-project-category").value.trim();
  const description = document.getElementById("admin-project-desc").value.trim();
  const githubUrl = document.getElementById("admin-project-github").value;
  const liveUrl = document.getElementById("admin-project-live").value;

  const checkboxes = document.querySelectorAll('input[name="proj-tags"]:checked');
  const tags = Array.from(checkboxes).map(cb => cb.value);

  Database.saveProject({
    id: id || undefined,
    title,
    category,
    description,
    tags,
    githubUrl,
    liveUrl,
    image: ""
  });

  resetProjectForm();
  renderAdminProjectList();
});

cancelProjEdit.addEventListener("click", resetProjectForm);

function resetProjectForm() {
  projectForm.reset();
  document.getElementById("admin-project-id").value = "";
  submitProjBtn.textContent = "Save Project";
  cancelProjEdit.style.display = "none";
}

function renderAdminProjectList() {
  const container = document.getElementById("admin-project-list");
  const projects = Database.getProjects();
  
  container.innerHTML = "";
  if (projects.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No projects saved.</div>`;
    return;
  }

  projects.forEach(p => {
    const el = document.createElement("div");
    el.className = "admin-list-item";
    el.innerHTML = `
      <div class="admin-list-info">
        <h4>${p.title}</h4>
        <p>${p.category} — Tags: ${p.tags.join(", ") || "None"}</p>
      </div>
      <div class="admin-list-actions">
        <button class="action-btn edit" data-id="${p.id}" title="Edit details">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete" data-id="${p.id}" title="Delete project">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `;

    el.querySelector(".edit").addEventListener("click", () => {
      // Load details into form
      document.getElementById("admin-project-id").value = p.id;
      document.getElementById("admin-project-title").value = p.title;
      document.getElementById("admin-project-category").value = p.category;
      document.getElementById("admin-project-desc").value = p.description;
      document.getElementById("admin-project-github").value = p.githubUrl || "";
      document.getElementById("admin-project-live").value = p.liveUrl || "";

      // Check linked tags checkboxes
      const checkboxes = document.querySelectorAll('input[name="proj-tags"]');
      checkboxes.forEach(cb => {
        cb.checked = p.tags.includes(cb.value);
      });

      submitProjBtn.textContent = "Update Project Details";
      cancelProjEdit.style.display = "inline-block";
      // Scroll to project form
      document.getElementById("admin-project-form").scrollIntoView({ behavior: "smooth" });
    });

    el.querySelector(".delete").addEventListener("click", () => {
      Database.deleteProject(p.id);
      renderAdminProjectList();
    });

    container.appendChild(el);
  });
}

// Admin: Visitor messages log view & auto drafting response
function renderAdminMessages() {
  const container = document.getElementById("admin-messages-list");
  const messages = Database.getMessages();

  container.innerHTML = "";
  if (messages.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No messages received yet.</div>`;
    return;
  }

  messages.forEach(m => {
    const dateStr = new Date(m.timestamp).toLocaleString();
    const el = document.createElement("div");
    el.className = "admin-list-item";
    el.style.flexDirection = "column";
    el.style.alignItems = "stretch";

    const isUnread = m.unread !== false;
    if (isUnread) {
      el.classList.add("unread-message-card");
    }

    el.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h4 style="color: var(--accent-cyan); font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
            ${m.name}
            ${isUnread ? `<span class="unread-badge">New</span>` : ""}
          </h4>
          <p style="font-size: 0.8rem; color: var(--text-dimmed);">${m.email} &bull; ${dateStr}</p>
        </div>
        <div class="admin-list-actions">
          <button class="action-btn toggle-read" data-id="${m.id}" title="${isUnread ? 'Mark as Read' : 'Mark as Unread'}">
            ${isUnread ? 
              `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>` : 
              `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
            }
          </button>
          <button class="action-btn delete" data-id="${m.id}" title="Remove entry">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
      <p style="margin-top: 10px; font-size: 0.95rem; color: var(--text-primary); background: rgba(0,0,0,0.15); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); font-style: italic;">
        "${m.message}"
      </p>
      
      <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
        <button class="btn btn-secondary draft-reply-btn" style="padding: 6px 12px; font-size: 0.8rem; align-self: flex-start;">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Draft AI Response
        </button>
        <div class="draft-reply-display" style="display: none; padding: 12px; background: rgba(6, 182, 212, 0.05); border: 1px dashed rgba(6, 182, 212, 0.3); border-radius: var(--radius-sm); font-size: 0.85rem; font-family: monospace; white-space: pre-wrap; color: var(--text-primary);"></div>
      </div>
    `;

    el.querySelector(".delete").addEventListener("click", () => {
      Database.deleteMessage(m.id);
      renderAdminMessages();
    });

    el.querySelector(".toggle-read").addEventListener("click", () => {
      Database.toggleMessageRead(m.id);
      renderAdminMessages();
    });

    const draftBtn = el.querySelector(".draft-reply-btn");
    const displayEl = el.querySelector(".draft-reply-display");
    
    draftBtn.addEventListener("click", async () => {
      // Mark as read immediately on click
      if (m.unread !== false) {
        Database.markMessageAsRead(m.id);
        el.classList.remove("unread-message-card");
        const badge = el.querySelector(".unread-badge");
        if (badge) badge.remove();
        m.unread = false;
      }

      draftBtn.disabled = true;
      draftBtn.textContent = "Drafting with AI...";
      
      const responseDraft = await AI.draftReplyToMessage(m.name, m.message);
      
      displayEl.innerHTML = `
        <textarea class="glass-input reply-textarea" style="min-height: 120px; font-family: inherit; font-size: 0.85rem; margin-bottom: 10px; width: 100%; border-color: rgba(6, 182, 212, 0.3); background: rgba(0,0,0,0.15); line-height: 1.4;">${responseDraft}</textarea>
        <div style="display: flex; gap: 8px;">
          <a class="btn btn-primary send-email-btn" href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent("Reply: Portfolio Inquiry")}&body=${encodeURIComponent(responseDraft)}" target="_blank" style="padding: 6px 14px; font-size: 0.8rem; text-decoration: none;">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 4px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send via Gmail
          </a>
          <button class="btn btn-secondary copy-draft-btn" style="padding: 6px 14px; font-size: 0.8rem;">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Draft
          </button>
        </div>
      `;
      
      displayEl.style.display = "block";
      draftBtn.textContent = "Regenerate Draft";
      draftBtn.disabled = false;

      // Realtime email link updates
      const sendBtn = displayEl.querySelector(".send-email-btn");
      const textarea = displayEl.querySelector(".reply-textarea");
      textarea.addEventListener("input", () => {
        sendBtn.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent("Reply: Portfolio Inquiry")}&body=${encodeURIComponent(textarea.value)}`;
      });

      // Copy draft to clipboard action
      const copyBtn = displayEl.querySelector(".copy-draft-btn");
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(textarea.value);
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy Draft";
        }, 2000);
      });
    });

    container.appendChild(el);
  });
}

// Admin: Settings Pane
function loadAdminSettings() {
  const settings = Database.getSettings();
  const keyInput = document.getElementById("admin-settings-key");
  const bioInput = document.getElementById("admin-settings-bio");

  keyInput.value = settings.geminiKey || "";
  bioInput.value = settings.ownerBio || "";

  // Set new settings input values
  document.getElementById("admin-settings-name").value = settings.ownerName || "";
  document.getElementById("admin-settings-email").value = settings.email || "";
  document.getElementById("admin-settings-location").value = settings.location || "";
  document.getElementById("admin-settings-linkedin").value = settings.linkedin || "";
  document.getElementById("admin-settings-github").value = settings.github || "";
  document.getElementById("admin-settings-codolio").value = settings.codolio || "";
  document.getElementById("admin-settings-medium").value = settings.medium || "";

  updateApiBadge(settings.geminiKey);
}

function updateApiBadge(key) {
  const statusBadge = document.getElementById("api-status-badge");
  if (key) {
    statusBadge.textContent = "Gemini Key Saved: Connected to Live AI Services";
    statusBadge.className = "api-badge connected";
  } else {
    statusBadge.textContent = "Disconnected: Rule-based Simulation Sandbox Mode Active";
    statusBadge.className = "api-badge disconnected";
  }
}

document.getElementById("admin-settings-save").addEventListener("click", () => {
  const geminiKey = document.getElementById("admin-settings-key").value.trim();
  const ownerBio = document.getElementById("admin-settings-bio").value.trim();
  const ownerName = document.getElementById("admin-settings-name").value.trim();
  const email = document.getElementById("admin-settings-email").value.trim();
  const location = document.getElementById("admin-settings-location").value.trim();
  const linkedin = document.getElementById("admin-settings-linkedin").value.trim();
  const github = document.getElementById("admin-settings-github").value.trim();
  const codolio = document.getElementById("admin-settings-codolio").value.trim();
  const medium = document.getElementById("admin-settings-medium").value.trim();

  Database.saveSettings({ 
    geminiKey, 
    ownerBio, 
    ownerName, 
    email, 
    location, 
    linkedin, 
    github, 
    codolio, 
    medium 
  });
  updateApiBadge(geminiKey);
  
  // Refresh displays
  renderHomeStats();
  alert("Settings stored securely. Portfolio state synchronized successfully!");
});

// Secure SHA-256 hash helper
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

function isAdminUnlocked() {
  return sessionStorage.getItem("portfolio_admin_unlocked") === "true";
}

function updateAdminLockUI() {
  const adminLi = document.getElementById("nav-admin-li");
  const lockBtn = document.getElementById("admin-lock-btn");
  const lockIcon = document.getElementById("lock-icon");

  // Only show the admin lock button if the secret query parameter (?admin or ?manage) is present OR if it's already unlocked
  const urlParams = new URLSearchParams(window.location.search);
  const showAdminControl = urlParams.has("admin") || urlParams.has("manage") || isAdminUnlocked();

  if (lockBtn) {
    lockBtn.style.display = showAdminControl ? "flex" : "none";
  }

  if (isAdminUnlocked()) {
    if (adminLi) adminLi.style.display = "inline-block";
    if (lockBtn) {
      lockBtn.title = "Lock Admin Access";
      lockBtn.style.color = "var(--accent-cyan)";
    }
    if (lockIcon) {
      lockIcon.innerHTML = `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`;
    }
  } else {
    if (adminLi) adminLi.style.display = "none";
    if (lockBtn) {
      lockBtn.title = "Admin Portal Control";
      lockBtn.style.color = "var(--text-dimmed)";
    }
    if (lockIcon) {
      lockIcon.innerHTML = `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`;
    }
  }
}

document.getElementById("admin-lock-btn").addEventListener("click", async () => {
  if (isAdminUnlocked()) {
    sessionStorage.removeItem("portfolio_admin_unlocked");
    updateAdminLockUI();
    if (activeTab === "admin") {
      switchPage("home");
    }
    alert("Admin session locked.");
  } else {
    const pass = prompt("Enter passcode to unlock Admin Console:");
    if (pass) {
      const hash = await sha256(pass.trim());
      if (hash === "6b0eddb3003c5af40ece4f3ab87be46d3acafa9906499304d54c5304494b35ca") {
        sessionStorage.setItem("portfolio_admin_unlocked", "true");
        updateAdminLockUI();
        switchPage("admin");
        alert("Admin console unlocked successfully!");
      } else {
        alert("Access Denied: Incorrect Passcode");
      }
    }
  }
});

// ----------------------------------------------------
// THEME SWITCHER
// ----------------------------------------------------
function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const savedTheme = localStorage.getItem("portfolio_theme") || "dark";

  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    setSunIcon(themeIcon);
  } else {
    document.body.classList.remove("light-theme");
    setMoonIcon(themeIcon);
  }

  toggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("light-theme")) {
      document.body.classList.remove("light-theme");
      localStorage.setItem("portfolio_theme", "dark");
      setMoonIcon(themeIcon);
    } else {
      document.body.classList.add("light-theme");
      localStorage.setItem("portfolio_theme", "light");
      setSunIcon(themeIcon);
    }
  });
}

function setSunIcon(svgEl) {
  svgEl.innerHTML = `
    <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
  `;
}

function setMoonIcon(svgEl) {
  svgEl.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" stroke="currentColor" stroke-width="2"/>`;
}

// ----------------------------------------------------
// EXPERIENCE TIMELINE RENDERER
// ----------------------------------------------------
function renderTimeline() {
  const container = document.getElementById("timeline-container");
  if (!container) return;
  const items = Database.getTimeline();
  const sorted = [...items].reverse();

  container.innerHTML = "";
  if (sorted.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No journey details added yet. Add them in Admin!</div>`;
    return;
  }

  sorted.forEach(item => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-header">
        <div class="timeline-title-group">
          <h4>${item.title}</h4>
          <p>${item.company} &bull; ${item.role}</p>
        </div>
        <span class="timeline-meta">${item.dateRange}</span>
      </div>
      <div class="timeline-desc">${item.description.replace(/\n/g, "<br/>")}</div>
    `;
    container.appendChild(div);
  });
}

// ----------------------------------------------------
// SVG RADAR SKILL CHART DRAWER
// ----------------------------------------------------
function renderRadarChart() {
  const container = document.getElementById("radar-chart-container");
  if (!container) return;
  
  const tech = Database.getTechStacks();
  const settings = Database.getSettings();
  const categories = settings.categories || ["Frontend", "Backend", "Databases", "DevOps"];

  const data = [];
  categories.forEach(cat => {
    const items = tech.filter(t => t.category === cat);
    if (items.length > 0) {
      const avg = items.reduce((sum, item) => sum + item.level, 0) / items.length;
      data.push({ name: cat, value: avg });
    } else {
      data.push({ name: cat, value: 30 }); // default placeholder
    }
  });

  if (data.length < 3) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;">Add at least 3 categories with skills to render the Radar Chart.</div>`;
    return;
  }

  const size = 280;
  const center = size / 2;
  const radius = center - 40;
  const angleSlice = (Math.PI * 2) / data.length;

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];
  let gridMarkup = "";
  rings.forEach(lvl => {
    const r = radius * lvl;
    const points = [];
    for (let i = 0; i < data.length; i++) {
      const x = center + r * Math.sin(angleSlice * i);
      const y = center - r * Math.cos(angleSlice * i);
      points.push(`${x},${y}`);
    }
    gridMarkup += `<polygon points="${points.join(" ")}" class="radar-grid-line" fill="none" />`;
  });

  // Axes and labels
  let axesMarkup = "";
  let labelsMarkup = "";
  const points = [];
  const dotsMarkup = [];

  data.forEach((d, i) => {
    const angle = angleSlice * i;
    const xOuter = center + radius * Math.sin(angle);
    const yOuter = center - radius * Math.cos(angle);
    axesMarkup += `<line x1="${center}" y1="${center}" x2="${xOuter}" y2="${yOuter}" class="radar-axis" />`;

    const labelX = center + (radius + 22) * Math.sin(angle);
    const labelY = center - (radius + 18) * Math.cos(angle) + 4;
    labelsMarkup += `<text x="${labelX}" y="${labelY}" class="radar-axis-label">${d.name}</text>`;

    const valRadius = radius * (d.value / 100);
    const xVal = center + valRadius * Math.sin(angle);
    const yVal = center - valRadius * Math.cos(angle);
    points.push(`${xVal},${yVal}`);
    
    dotsMarkup.push(`<circle cx="${xVal}" cy="${yVal}" class="radar-point"><title>${d.name}: ${Math.round(d.value)}%</title></circle>`);
  });

  const polygonMarkup = `<polygon points="${points.join(" ")}" class="radar-polygon" />`;

  container.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">
      ${gridMarkup}
      ${axesMarkup}
      ${polygonMarkup}
      ${dotsMarkup.join("")}
      ${labelsMarkup}
    </svg>
  `;
}

// ----------------------------------------------------
// AI JOB-FIT SCANNER INTERACTIVE LOGIC
// ----------------------------------------------------
function initJobScanner() {
  const btn = document.getElementById("scanner-btn");
  const input = document.getElementById("scanner-input");
  const results = document.getElementById("scanner-results-container");
  const progress = document.getElementById("scanner-progress");
  const percentageText = document.getElementById("scanner-percentage-text");
  const summaryText = document.getElementById("scanner-summary-text");
  const gapsGroup = document.getElementById("scanner-gaps-group");
  const gapsText = document.getElementById("scanner-gaps-text");
  const projectsText = document.getElementById("scanner-projects-text");

  if (!btn) return;

  if (input) {
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = input.scrollHeight + "px";
    });
  }

  btn.addEventListener("click", async () => {
    const jd = input.value.trim();
    if (!jd) {
      alert("Please paste a job description first.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Scanning Job Alignment...";
    results.classList.remove("active");

    try {
      const analysis = await AI.analyzeJobFit(jd);

      results.classList.add("active");

      const perimeter = 282.7;
      const score = Math.round(analysis.score || analysis.matchPercentage || 50);
      const offset = perimeter - (score / 100) * perimeter;
      
      progress.style.strokeDasharray = perimeter;
      progress.style.strokeDashoffset = perimeter;
      
      setTimeout(() => {
        progress.style.strokeDashoffset = offset;
      }, 100);

      percentageText.textContent = `${score}%`;
      summaryText.textContent = analysis.summary || analysis.suitabilitySummary || "";
      
      const gaps = analysis.gaps || [];
      if (gaps.length > 0 && gaps[0] !== "") {
        gapsGroup.style.display = "block";
        gapsText.textContent = gaps.join(", ");
      } else {
        gapsGroup.style.display = "none";
      }

      const recProjs = analysis.projects || analysis.recommendedProjects || [];
      projectsText.textContent = recProjs.join(", ") || "None specified";

    } catch (err) {
      console.error(err);
      alert("Error during job-fit analysis. Falling back to offline scanner.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Analyze Job Fit";
    }
  });
}

// ----------------------------------------------------
// DYNAMIC BLOG SPACE RENDERING
// ----------------------------------------------------
function renderBlogGrid() {
  const container = document.getElementById("blog-grid-container");
  if (!container) return;
  const articles = Database.getArticles();
  const sorted = [...articles].reverse();

  container.innerHTML = "";
  if (sorted.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dimmed); padding: 40px;">No articles published yet. Publish one in Admin!</div>`;
    return;
  }

  sorted.forEach(art => {
    const card = document.createElement("div");
    card.className = "blog-card glass-card";
    
    const dateStr = new Date(art.date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });

    card.innerHTML = `
      <div class="blog-card-content">
        <div class="blog-card-meta">
          <span>${dateStr}</span>
        </div>
        <h3 class="blog-card-title">${art.title}</h3>
        <p class="blog-card-summary">${art.summary}</p>
        <div class="blog-tags">
          ${art.tags.map(t => `<span class="blog-tag">${t}</span>`).join("")}
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      openBlogModal(art);
    });

    container.appendChild(card);
  });
}

function openBlogModal(art) {
  const modalContent = document.getElementById("modal-content");
  const dateStr = new Date(art.date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const formattedBody = art.content
    .replace(/\n/g, "<br/>")
    .replace(/###\s(.*?)(<br\/>|$)/g, '<h4 style="font-size: 1.25rem; margin-top: 20px; margin-bottom: 8px; color: var(--accent-cyan);">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/```css([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: var(--radius-sm); font-family: monospace; overflow-x: auto; margin: 15px 0;">$1</pre>')
    .replace(/```javascript([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: var(--radius-sm); font-family: monospace; overflow-x: auto; margin: 15px 0;">$1</pre>')
    .replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: var(--radius-sm); font-family: monospace; overflow-x: auto; margin: 15px 0;">$1</pre>');

  modalContent.innerHTML = `
    <h2 style="font-size: 2rem; margin-bottom: 8px;">${art.title}</h2>
    <p style="font-size: 0.85rem; color: var(--text-dimmed); margin-bottom: 24px;">Published on ${dateStr} &bull; Tags: ${art.tags.join(", ")}</p>
    
    <div style="font-size: 1rem; line-height: 1.7; color: var(--text-muted); margin-bottom: 30px;">
      ${formattedBody}
    </div>
  `;
  document.getElementById("project-detail-modal").classList.add("open");
}

// ----------------------------------------------------
// JOURNEY TIMELINE ADMIN CRUD LIFECYCLE
// ----------------------------------------------------
let timelineFormBound = false;
function setupAdminTimelineFormOnce() {
  if (timelineFormBound) return;
  timelineFormBound = true;

  const form = document.getElementById("admin-timeline-form");
  const cancelBtn = document.getElementById("admin-timeline-cancel-btn");
  const submitBtn = document.getElementById("admin-timeline-submit-btn");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("admin-timeline-id").value;
    const title = document.getElementById("admin-timeline-title").value.trim();
    const company = document.getElementById("admin-timeline-company").value.trim();
    const dateRange = document.getElementById("admin-timeline-dates").value.trim();
    const type = document.getElementById("admin-timeline-type").value;
    const description = document.getElementById("admin-timeline-desc").value.trim();

    Database.saveTimelineItem({
      id: id || undefined,
      title,
      company,
      role: type === "education" ? "Student" : "Engineer",
      dateRange,
      type,
      description
    });

    resetTimelineForm();
    renderAdminTimelineList();
    renderTimeline();
  });

  cancelBtn.addEventListener("click", resetTimelineForm);
}

function resetTimelineForm() {
  const form = document.getElementById("admin-timeline-form");
  if (form) form.reset();
  document.getElementById("admin-timeline-id").value = "";
  document.getElementById("admin-timeline-submit-btn").textContent = "Save Entry";
  document.getElementById("admin-timeline-cancel-btn").style.display = "none";
}

function renderAdminTimelineList() {
  const container = document.getElementById("admin-timeline-list");
  if (!container) return;
  const items = Database.getTimeline();

  container.innerHTML = "";
  if (items.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No journey items.</div>`;
    return;
  }

  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "admin-list-item";
    el.innerHTML = `
      <div class="admin-list-info">
        <h4>${item.title}</h4>
        <p>${item.company} (${item.dateRange}) &bull; ${item.type}</p>
      </div>
      <div class="admin-list-actions">
        <button class="action-btn edit" title="Edit entry">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete" title="Delete entry">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `;

    el.querySelector(".edit").addEventListener("click", () => {
      document.getElementById("admin-timeline-id").value = item.id;
      document.getElementById("admin-timeline-title").value = item.title;
      document.getElementById("admin-timeline-company").value = item.company;
      document.getElementById("admin-timeline-dates").value = item.dateRange;
      document.getElementById("admin-timeline-type").value = item.type;
      document.getElementById("admin-timeline-desc").value = item.description;

      document.getElementById("admin-timeline-submit-btn").textContent = "Update Entry";
      document.getElementById("admin-timeline-cancel-btn").style.display = "inline-block";
      document.getElementById("admin-timeline-form").scrollIntoView({ behavior: "smooth" });
    });

    el.querySelector(".delete").addEventListener("click", () => {
      Database.deleteTimelineItem(item.id);
      renderAdminTimelineList();
      renderTimeline();
    });

    container.appendChild(el);
  });
}

// ----------------------------------------------------
// BLOG ARTICLES ADMIN CRUD LIFECYCLE
// ----------------------------------------------------
let blogFormBound = false;
function setupAdminBlogFormOnce() {
  if (blogFormBound) return;
  blogFormBound = true;

  const form = document.getElementById("admin-blog-form");
  const cancelBtn = document.getElementById("admin-blog-cancel-btn");
  const submitBtn = document.getElementById("admin-blog-submit-btn");
  const aiBtn = document.getElementById("admin-blog-ai-suggest");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("admin-blog-id").value;
    const title = document.getElementById("admin-blog-title").value.trim();
    const summary = document.getElementById("admin-blog-summary").value.trim();
    const tagsStr = document.getElementById("admin-blog-tags").value.trim();
    const content = document.getElementById("admin-blog-content").value.trim();

    const tags = tagsStr.split(",").map(t => t.trim()).filter(t => t !== "");

    Database.saveArticle({
      id: id || undefined,
      title,
      summary,
      tags,
      content
    });

    resetBlogForm();
    renderAdminBlogList();
    renderBlogGrid();
  });

  cancelBtn.addEventListener("click", resetBlogForm);

  aiBtn.addEventListener("click", async () => {
    const title = document.getElementById("admin-blog-title").value.trim();
    if (!title) {
      alert("Please enter an Article Title first before using AI assistance.");
      return;
    }

    const origHtml = aiBtn.innerHTML;
    aiBtn.innerHTML = `<span style="color: var(--accent-cyan);">Generating Outline...</span>`;
    aiBtn.disabled = true;

    const outline = await AI.generateBlogOutline(title);

    document.getElementById("admin-blog-content").value = outline;
    aiBtn.innerHTML = origHtml;
    aiBtn.disabled = false;
  });
}

function resetBlogForm() {
  const form = document.getElementById("admin-blog-form");
  if (form) form.reset();
  document.getElementById("admin-blog-id").value = "";
  document.getElementById("admin-blog-submit-btn").textContent = "Publish Article";
  document.getElementById("admin-blog-cancel-btn").style.display = "none";
}

function renderAdminBlogList() {
  const container = document.getElementById("admin-blog-list");
  if (!container) return;
  const articles = Database.getArticles();

  container.innerHTML = "";
  if (articles.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No articles published.</div>`;
    return;
  }

  articles.forEach(art => {
    const el = document.createElement("div");
    el.className = "admin-list-item";
    el.innerHTML = `
      <div class="admin-list-info">
        <h4>${art.title}</h4>
        <p>${art.date} &bull; Tags: ${art.tags.join(", ")}</p>
      </div>
      <div class="admin-list-actions">
        <button class="action-btn edit" title="Edit article">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete" title="Delete article">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `;

    el.querySelector(".edit").addEventListener("click", () => {
      document.getElementById("admin-blog-id").value = art.id;
      document.getElementById("admin-blog-title").value = art.title;
      document.getElementById("admin-blog-summary").value = art.summary;
      document.getElementById("admin-blog-tags").value = art.tags.join(", ");
      document.getElementById("admin-blog-content").value = art.content;

      document.getElementById("admin-blog-submit-btn").textContent = "Update Article";
      document.getElementById("admin-blog-cancel-btn").style.display = "inline-block";
      document.getElementById("admin-blog-form").scrollIntoView({ behavior: "smooth" });
    });

    el.querySelector(".delete").addEventListener("click", () => {
      Database.deleteArticle(art.id);
      renderAdminBlogList();
      renderBlogGrid();
    });

    container.appendChild(el);
  });
}

// Initialize Main Execution Flow
function initApp() {
  initTheme();
  initJobScanner();
  updateAdminLockUI();
  renderHomeStats();
  initSlider();
  switchPage("home");
}

window.addEventListener("DOMContentLoaded", initApp);
