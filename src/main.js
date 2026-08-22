import { Database } from "./data.js";
import { AI } from "./ai.js";
import { isCloudActive } from "./supabase.js";

// DOM Selector Elements
const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const logo = document.getElementById("brand-logo");

// Active state for sections
let activeTab = "home";
let isServerLive = false;

// ----------------------------------------------------
// ----------------------------------------------------
// TOAST NOTIFICATIONS & INTERACTIVE FEEDBACK
// ----------------------------------------------------
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;

  const iconSvg = type === 'error' 
    ? `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#f87171" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : (type === 'delete' 
      ? `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#f87171" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#34d399" stroke-width="2.5" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`);

  const titleText = type === 'error' ? 'Error' : (type === 'delete' ? 'Deleted' : 'Success');

  toast.innerHTML = `
    <div class="toast-icon-wrap">${iconSvg}</div>
    <div class="toast-text-wrap">
      <div class="toast-title">${titleText}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector(".toast-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      toast.classList.remove("toast-show");
      toast.classList.add("toast-hide");
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 250);
    });
  }

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("toast-show");
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove("toast-show");
      toast.classList.add("toast-hide");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }
  }, 4000);
}

function flashButtonSuccess(btn, successText = "✓ Saved Successfully!") {
  if (!btn) return;
  const originalHtml = btn.innerHTML;
  const originalWidth = btn.offsetWidth ? `${btn.offsetWidth}px` : "auto";
  btn.style.minWidth = originalWidth;
  btn.classList.add("btn-success-flash");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" style="vertical-align: middle; margin-right: 6px;"><polyline points="20 6 9 17 4 12"/></svg>${successText}`;

  setTimeout(() => {
    btn.classList.remove("btn-success-flash");
    btn.innerHTML = originalHtml;
    btn.style.minWidth = "";
  }, 2200);
}

function initButtonRipples() {
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn, .admin-tab-btn, .action-btn, .nav-link");
    if (!btn) return;

    const circle = document.createElement("span");
    const diameter = Math.max(btn.clientWidth, btn.clientHeight) || 60;
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add("btn-ripple");

    const existing = btn.querySelector(".btn-ripple");
    if (existing) existing.remove();

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  });
}

function refreshAllPublicViews() {
  try { renderHomeStats(); } catch (e) {}
  try { renderTimeline(); } catch (e) {}
  try { renderTechCategoryFilters(); } catch (e) {}
  try { renderTechGrid("All"); } catch (e) {}
  try { renderProjectFilters(); } catch (e) {}
  try { renderProjectsGrid(); } catch (e) {}
  try { renderHackathonsGrid(); } catch (e) {}
  try { renderCertificatesGrid(); } catch (e) {}
  try { renderBlogGrid(); } catch (e) {}
}

// ----------------------------------------------------
// ROUTING & NAVIGATION
// ----------------------------------------------------
function switchPage(pageId) {
  // Close mobile navigation drawer if open
  const mainNavLinks = document.getElementById("main-nav-links");
  if (mainNavLinks) {
    mainNavLinks.classList.remove("mobile-open");
  }

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
  window.scrollTo({ top: 0, behavior: "smooth" });

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
  } else if (pageId === "hackathons") {
    renderHackathonsGrid();
  } else if (pageId === "blog") {
    renderBlogGrid();
  } else if (pageId === "certificates") {
    renderCertificatesGrid();
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

// Mobile menu toggle listener
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mainNavLinks = document.getElementById("main-nav-links");
if (mobileMenuToggle && mainNavLinks) {
  mobileMenuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    mainNavLinks.classList.toggle("mobile-open");
  });

  document.addEventListener("click", (e) => {
    if (!mainNavLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      mainNavLinks.classList.remove("mobile-open");
    }
  });
}

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
  
  if (settings.geminiKey || isServerLive) {
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

function getProjectSvgGraphic(proj) {
  const cat = (proj.category || "").toLowerCase();
  const title = (proj.title || "").toLowerCase();
  const tagsStr = (proj.tags || []).join(" ").toLowerCase();

  // 1. 3D / Geospatial / C++ / WebGL / Graph / Plexus
  if (cat.includes("3d") || cat.includes("geospatial") || cat.includes("nav") || title.includes("plexus") || title.includes("nav") || tagsStr.includes("c++") || tagsStr.includes("three.js") || tagsStr.includes("webgl")) {
    return `
      <svg class="project-graphic-svg" viewBox="0 0 240 100" fill="none" stroke="currentColor">
        <defs>
          <linearGradient id="grad-plexus" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="120" cy="50" r="34" stroke="url(#grad-plexus)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
        <ellipse cx="120" cy="50" rx="46" ry="18" stroke="url(#grad-plexus)" stroke-width="1" opacity="0.4" transform="rotate(-15 120 50)"/>
        <path d="M40 75 Q120 15 200 75" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
        <path d="M60 25 Q120 85 180 25" stroke="#a855f7" stroke-width="1.5" opacity="0.5"/>
        <circle cx="75" cy="45" r="4" fill="#06b6d4"/>
        <circle cx="120" cy="22" r="5" fill="#6366f1"/>
        <circle cx="165" cy="55" r="4.5" fill="#a855f7"/>
        <circle cx="130" cy="72" r="3.5" fill="#38bdf8"/>
        <circle cx="95" cy="65" r="3" fill="#818cf8"/>
        <line x1="75" y1="45" x2="120" y2="22" stroke="#06b6d4" stroke-width="1.2" opacity="0.8"/>
        <line x1="120" y1="22" x2="165" y2="55" stroke="#6366f1" stroke-width="1.2" opacity="0.8"/>
        <line x1="165" y1="55" x2="130" y2="72" stroke="#a855f7" stroke-width="1.2" opacity="0.8"/>
        <line x1="130" y1="72" x2="95" y2="65" stroke="#38bdf8" stroke-width="1.2" opacity="0.8"/>
        <line x1="95" y1="65" x2="75" y2="45" stroke="#818cf8" stroke-width="1.2" opacity="0.8"/>
        <line x1="75" y1="45" x2="165" y2="55" stroke="#06b6d4" stroke-width="0.8" opacity="0.4"/>
      </svg>
    `;
  }

  // 2. AI / Agent / Intelligence / Machine Learning / Python / Data Science
  if (cat.includes("ai") || cat.includes("intelligence") || cat.includes("agent") || title.includes("ai") || tagsStr.includes("python") || tagsStr.includes("tensorflow") || tagsStr.includes("ai")) {
    return `
      <svg class="project-graphic-svg" viewBox="0 0 240 100" fill="none" stroke="currentColor">
        <defs>
          <linearGradient id="grad-ai" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#a855f7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="90" y="20" width="60" height="60" rx="12" stroke="url(#grad-ai)" stroke-width="2" fill="rgba(168, 85, 247, 0.08)"/>
        <circle cx="120" cy="50" r="16" fill="none" stroke="#38bdf8" stroke-width="2"/>
        <path d="M120 38 L120 62 M108 50 L132 50" stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
        <path d="M40 50 L90 50 M150 50 L200 50 M120 20 L120 8 M120 80 L120 92" stroke="url(#grad-ai)" stroke-width="1.5" stroke-dasharray="4 2"/>
        <circle cx="40" cy="50" r="4" fill="#a855f7"/>
        <circle cx="200" cy="50" r="4" fill="#06b6d4"/>
        <circle cx="120" cy="8" r="3" fill="#38bdf8"/>
        <circle cx="120" cy="92" r="3" fill="#c084fc"/>
      </svg>
    `;
  }

  // 3. Web Development / Full-Stack / Systems / Default Code Window
  return `
    <svg class="project-graphic-svg" viewBox="0 0 240 100" fill="none" stroke="currentColor">
      <defs>
        <linearGradient id="grad-code" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
      <rect x="50" y="15" width="140" height="70" rx="8" stroke="url(#grad-code)" stroke-width="1.5" fill="rgba(99, 102, 241, 0.06)"/>
      <path d="M70 35 L85 50 L70 65" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M170 35 L155 50 L170 65" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="125" y1="35" x2="115" y2="65" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="95" y="72" width="50" height="3" rx="1.5" fill="#38bdf8" opacity="0.6"/>
    </svg>
  `;
}

function formatFormattedDescription(text) {
  if (!text) return "";
  let raw = text.trim();

  // 1. If text contains bullet symbol '•'
  if (raw.includes("•")) {
    const parts = raw.split("•").map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      let header = !raw.startsWith("•") ? parts[0] : "";
      let bullets = !raw.startsWith("•") ? parts.slice(1) : parts;

      let html = header ? `<p style="margin-bottom: 12px; line-height: 1.6; color: var(--text-primary); font-weight: 500;">${header}</p>` : "";
      html += `<ul style="margin: 0 0 20px 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; list-style-type: disc;">`;
      bullets.forEach(b => {
        html += `<li style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem;">${b}</li>`;
      });
      html += `</ul>`;
      return html;
    }
  }

  // 2. If text contains line breaks (\n)
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    let header = "";
    let items = lines;

    // If first line ends with ':' or doesn't start with bullet symbol/number, treat line 1 as header
    if (lines[0].endsWith(":") || lines[0].toLowerCase().includes("highlight") || lines[0].toLowerCase().includes("feature") || lines[0].toLowerCase().includes("about")) {
      header = lines[0];
      items = lines.slice(1);
    }

    let html = header ? `<p style="margin-bottom: 12px; line-height: 1.6; color: var(--text-primary); font-weight: 500;">${header}</p>` : "";
    html += `<ul style="margin: 0 0 20px 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; list-style-type: disc;">`;
    items.forEach(l => {
      const clean = l.replace(/^[-*•\d+.]\s*/, "");
      html += `<li style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem;">${clean}</li>`;
    });
    html += `</ul>`;
    return html;
  }

  return `<p style="line-height: 1.6; color: var(--text-muted); white-space: pre-wrap;">${raw}</p>`;
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

    let thumbnailMarkup = "";
    if (proj.image && proj.image.trim() !== "") {
      thumbnailMarkup = `
        <div class="project-thumbnail">
          <img src="${proj.image}" alt="${proj.title}" />
          <div class="project-badges">
            <span class="badge">${proj.category}</span>
          </div>
        </div>
      `;
    } else {
      thumbnailMarkup = `
        <div class="project-thumbnail project-code-banner">
          <div class="project-graphic-content">
            ${getProjectSvgGraphic(proj)}
          </div>
          <div class="project-badges">
            <span class="badge">${proj.category}</span>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      ${thumbnailMarkup}
      <div class="project-content">
        <h3>${proj.title}</h3>
        <div class="project-desc">${formatFormattedDescription(proj.description)}</div>
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
  let modalGraphicHeader = "";

  if (project.image && project.image.trim() !== "") {
    modalGraphicHeader = `
      <div style="width: 100%; max-height: 260px; overflow: hidden; border-radius: var(--radius-md); border: 1px solid var(--border-light); margin-bottom: 24px; background: rgba(0,0,0,0.3);">
        <img src="${project.image}" alt="${project.title}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `;
  } else {
    modalGraphicHeader = `
      <div style="background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.25), rgba(15, 23, 42, 0.95)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px; text-align: center; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 140px;">
        ${getProjectSvgGraphic(project)}
      </div>
    `;
  }

  content.innerHTML = `
    <h2 style="font-size: 2rem; margin-bottom: 8px;">${project.title}</h2>
    <span class="badge" style="display: inline-block; margin-bottom: 20px;">${project.category}</span>
    
    ${modalGraphicHeader}

    <h3 style="margin-bottom: 12px;">About Project</h3>
    <div style="margin-bottom: 24px;">
      ${formatFormattedDescription(project.description)}
    </div>

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
function populateAdminCategoryList() {
  const container = document.getElementById("admin-category-list");
  if (!container) return;

  const settings = Database.getSettings();
  const categories = settings.categories || ["Frontend", "Backend", "Databases", "DevOps"];

  container.innerHTML = "";
  if (categories.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 10px; font-size: 0.8rem;">No categories defined.</div>`;
    return;
  }

  categories.forEach(cat => {
    const el = document.createElement("div");
    el.className = "admin-category-item";
    el.innerHTML = `
      <span>${cat}</span>
      <button class="admin-category-delete-btn" data-category="${cat}" title="Delete Category">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    `;

    el.querySelector(".admin-category-delete-btn").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete the category "${cat}"?`)) {
        deleteCategory(cat);
      }
    });

    container.appendChild(el);
  });
}

function deleteCategory(catName) {
  const settings = Database.getSettings();
  const categories = settings.categories || ["Frontend", "Backend", "Databases", "DevOps"];
  const updated = categories.filter(c => c !== catName);
  
  Database.saveSettings({ categories: updated });
  
  // Refresh UI
  populateAdminCategoryList();
  populateAdminTechCategoriesDropdown();
  renderTechCategoryFilters();
  renderAdminTechList();
}

let isCategoryFormSetup = false;
function setupAdminCategoryFormOnce() {
  if (isCategoryFormSetup) return;
  const form = document.getElementById("admin-category-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("admin-category-name");
    const newCat = input.value.trim();
    if (!newCat) return;

    const settings = Database.getSettings();
    const categories = settings.categories || ["Frontend", "Backend", "Databases", "DevOps"];
    
    if (categories.some(c => c.toLowerCase() === newCat.toLowerCase())) {
      showToast("This category already exists.", "error");
      return;
    }

    categories.push(newCat);
    Database.saveSettings({ categories });

    const submitBtn = form.querySelector('button[type="submit"]');
    flashButtonSuccess(submitBtn, "✓ Category Added!");
    showToast(`Category "${newCat}" added successfully!`);
    
    input.value = "";
    
    // Refresh UI
    populateAdminCategoryList();
    populateAdminTechCategoriesDropdown();
    refreshAllPublicViews();
  });

  isCategoryFormSetup = true;
}

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

let isAdminPanelInitialized = false;
function initAdminPanel() {
  const cloudBadge = document.getElementById("cloud-status-badge");
  if (cloudBadge) {
    if (isCloudActive) {
      cloudBadge.textContent = "Cloud Sync";
      cloudBadge.classList.remove("disconnected");
      cloudBadge.classList.add("connected");
    } else {
      cloudBadge.textContent = "Local Mode";
      cloudBadge.classList.add("disconnected");
      cloudBadge.classList.remove("connected");
    }
  }

  if (isAdminPanelInitialized) {
    renderAdminTechList();
    populateAdminTechCategoriesDropdown();
    populateAdminCategoryList();
    return;
  }
  isAdminPanelInitialized = true;

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
        populateAdminCategoryList();
      } else if (tab.dataset.pane === "admin-pane-projects") {
        renderAdminProjectList();
        renderTechCheckboxes();
      } else if (tab.dataset.pane === "admin-pane-timeline") {
        renderAdminTimelineList();
      } else if (tab.dataset.pane === "admin-pane-blog") {
        renderAdminBlogList();
      } else if (tab.dataset.pane === "admin-pane-messages") {
        renderAdminMessages();
      } else if (tab.dataset.pane === "admin-pane-certificates") {
        renderAdminCertList();
      } else if (tab.dataset.pane === "admin-pane-hackathons") {
        renderAdminHackathonList();
      } else if (tab.dataset.pane === "admin-pane-settings") {
        loadAdminSettings();
      }
    });
  });

  // Load primary default admin lists
  renderAdminTechList();
  populateAdminTechCategoriesDropdown();
  populateAdminCategoryList();
  setupAdminCategoryFormOnce();
  setupAdminHackathonFormOnce();
  
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
  setupAdminCertFormOnce();
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
  flashButtonSuccess(submitTechBtn, id ? "✓ Updated!" : "✓ Added to Toolkit!");
  showToast(id ? `Updated technology "${name}"` : `Added "${name}" to toolkit!`);
  resetTechForm();
  renderAdminTechList();
  populateAdminTechCategoriesDropdown();
  refreshAllPublicViews();
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
      showToast(`Removed "${t.name}" from toolkit.`, "delete");
      renderAdminTechList();
      refreshAllPublicViews();
    });

    container.appendChild(el);
  });
}

// Admin: Manage Projects
const projectForm = document.getElementById("admin-project-form");
const cancelProjEdit = document.getElementById("admin-project-cancel-btn");
const submitProjBtn = document.getElementById("admin-project-submit-btn");

let currentUploadedProjImage = "";

function showProjPreview(src) {
  const box = document.getElementById("admin-project-image-preview-box");
  const img = document.getElementById("admin-project-preview-img");
  if (box && img) {
    img.src = src;
    box.style.display = "flex";
  }
}

function hideProjPreview() {
  const box = document.getElementById("admin-project-image-preview-box");
  const img = document.getElementById("admin-project-preview-img");
  const fileInput = document.getElementById("admin-project-file");
  const urlInput = document.getElementById("admin-project-image-url");
  if (box && img) {
    img.src = "";
    box.style.display = "none";
  }
  if (fileInput) fileInput.value = "";
  if (urlInput) urlInput.value = "";
  currentUploadedProjImage = "";
}

// Bind project image upload handlers
const projFileInput = document.getElementById("admin-project-file");
const projUrlInput = document.getElementById("admin-project-image-url");
const projRemoveImgBtn = document.getElementById("admin-project-remove-img-btn");

if (projFileInput) {
  projFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (projUrlInput) projUrlInput.value = "";
      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          currentUploadedProjImage = canvas.toDataURL("image/jpeg", 0.75);
          showProjPreview(currentUploadedProjImage);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

if (projUrlInput) {
  projUrlInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) {
      if (projFileInput) projFileInput.value = "";
      currentUploadedProjImage = val;
      showProjPreview(val);
    } else {
      hideProjPreview();
    }
  });
}

if (projRemoveImgBtn) {
  projRemoveImgBtn.addEventListener("click", hideProjPreview);
}

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
    image: currentUploadedProjImage
  });

  flashButtonSuccess(submitProjBtn, id ? "✓ Project Updated!" : "✓ Project Saved!");
  showToast(id ? `Updated project "${title}"` : `Project "${title}" saved successfully!`);
  resetProjectForm();
  renderAdminProjectList();
  refreshAllPublicViews();
});

cancelProjEdit.addEventListener("click", resetProjectForm);

function resetProjectForm() {
  projectForm.reset();
  document.getElementById("admin-project-id").value = "";
  submitProjBtn.textContent = "Save Project";
  cancelProjEdit.style.display = "none";
  hideProjPreview();
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

      // Load image preview if present
      currentUploadedProjImage = p.image || "";
      if (currentUploadedProjImage) {
        showProjPreview(currentUploadedProjImage);
        if (!currentUploadedProjImage.startsWith("data:")) {
          const urlInput = document.getElementById("admin-project-image-url");
          if (urlInput) urlInput.value = currentUploadedProjImage;
        }
      } else {
        hideProjPreview();
      }

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
      showToast(`Deleted project "${p.title}".`, "delete");
      renderAdminProjectList();
      refreshAllPublicViews();
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
      const responseDraftCRLF = responseDraft.replace(/\r?\n/g, "\r\n");
      
      displayEl.innerHTML = `
        <textarea class="glass-input reply-textarea" style="min-height: 120px; font-family: inherit; font-size: 0.85rem; margin-bottom: 10px; width: 100%; border-color: rgba(6, 182, 212, 0.3); background: rgba(0,0,0,0.15); line-height: 1.4;">${responseDraft}</textarea>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a class="btn btn-primary send-email-btn" href="https://mail.google.com/mail/?view=cm&tf=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent("Reply: Portfolio Inquiry")}&body=${encodeURIComponent(responseDraftCRLF)}" target="_blank" style="padding: 6px 14px; font-size: 0.8rem; text-decoration: none;">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 4px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send via Gmail
          </a>
          <a class="btn btn-secondary send-mailto-btn" href="mailto:${m.email}?subject=${encodeURIComponent("Reply: Portfolio Inquiry")}&body=${encodeURIComponent(responseDraftCRLF)}" style="padding: 6px 14px; font-size: 0.8rem; text-decoration: none; border-color: rgba(6, 182, 212, 0.25);">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Send via Mail Client
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
      const mailtoBtn = displayEl.querySelector(".send-mailto-btn");
      const textarea = displayEl.querySelector(".reply-textarea");
      textarea.addEventListener("input", () => {
        const val = textarea.value.replace(/\r?\n/g, "\r\n");
        sendBtn.href = `https://mail.google.com/mail/?view=cm&tf=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent("Reply: Portfolio Inquiry")}&body=${encodeURIComponent(val)}`;
        mailtoBtn.href = `mailto:${m.email}?subject=${encodeURIComponent("Reply: Portfolio Inquiry")}&body=${encodeURIComponent(val)}`;
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
  
  const saveBtn = document.getElementById("admin-settings-save");
  flashButtonSuccess(saveBtn, "✓ Settings Saved & Synced!");
  showToast("Platform profile and AI Co-Pilot settings saved!");
  refreshAllPublicViews();
});

const exportDbBtn = document.getElementById("admin-settings-export-db");
if (exportDbBtn) {
  exportDbBtn.addEventListener("click", () => {
    const backup = {
      settings: Database.getSettings(),
      techStacks: Database.getTechStacks(),
      projects: Database.getProjects(),
      timeline: Database.getTimeline(),
      blog: Database.getArticles(),
      certificates: Database.getCertificates()
    };
    navigator.clipboard.writeText(JSON.stringify(backup, null, 2)).then(() => {
      const toast = document.getElementById("export-db-toast");
      if (toast) {
        toast.style.display = "inline";
        setTimeout(() => {
          toast.style.display = "none";
        }, 3000);
      }
    }).catch(err => {
      alert("Failed to copy database: " + err);
    });
  });
}

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

function lockAdminSession() {
  sessionStorage.removeItem("portfolio_admin_unlocked");
  sessionStorage.removeItem("portfolio_admin_passcode");
  updateAdminLockUI();
  if (activeTab === "admin") {
    switchPage("home");
  }
  alert("Admin session locked.");
}

const lockBtn = document.getElementById("admin-lock-btn");
if (lockBtn) {
  lockBtn.addEventListener("click", async () => {
    if (isAdminUnlocked()) {
      lockAdminSession();
    } else {
      const pass = prompt("Enter passcode to unlock Admin Console:");
      if (pass) {
        const trimmedPass = pass.trim();
        const hash = await sha256(trimmedPass);
        if (hash === "6b0eddb3003c5af40ece4f3ab87be46d3acafa9906499304d54c5304494b35ca") {
          sessionStorage.setItem("portfolio_admin_unlocked", "true");
          sessionStorage.setItem("portfolio_admin_passcode", trimmedPass);
          
          if (isCloudActive) {
            console.log("Admin unlocked. Supabase Cloud Sync active.");
          }
          
          updateAdminLockUI();
          switchPage("admin");
          alert("Admin console unlocked successfully!");
        } else {
          alert("Access Denied: Incorrect Passcode");
        }
      }
    }
  });
}

const panelLockBtn = document.getElementById("admin-panel-lock-btn");
if (panelLockBtn) {
  panelLockBtn.addEventListener("click", lockAdminSession);
}

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
// ----------------------------------------------------
// DYNAMIC CERTIFICATES RENDERING
// ----------------------------------------------------
function renderCertificatesGrid() {
  const container = document.getElementById("certificates-grid-container");
  if (!container) return;
  const certs = Database.getCertificates();
  
  container.innerHTML = "";
  if (certs.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dimmed); padding: 40px;">No certificates added yet. Add some in the Admin panel!</div>`;
    return;
  }
  
  certs.forEach(cert => {
    const card = document.createElement("div");
    card.className = "certificate-card glass-card";
    
    // Skills formatting
    const skillsList = cert.skills ? cert.skills.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];
    const skillsMarkup = skillsList.map(s => `<span class="certificate-skill-tag">${s}</span>`).join("");
    
    // URL action
    const urlBtn = cert.url ? `<a href="${cert.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 6px 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px;">
        Verify Credential
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>` : '';

    const imgContainer = cert.image ? `
      <div class="certificate-image-container" title="Click to view certificate full size">
        <img src="${cert.image}" alt="${cert.title}" />
      </div>
    ` : '';

    card.innerHTML = `
      ${imgContainer}
      <div class="certificate-badge-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="certificate-issuer">${cert.issuer}</div>
      <h3 class="certificate-title">${cert.title}</h3>
      
      <div class="certificate-skills">
        ${skillsMarkup}
      </div>
      
      <div class="certificate-meta">
        <span>Issued: ${cert.date}</span>
        ${urlBtn}
      </div>
    `;
    
    // Zoom click handler
    const imgEl = card.querySelector(".certificate-image-container");
    if (imgEl) {
      imgEl.addEventListener("click", () => {
        openCertLightbox(cert.image);
      });
    }

    container.appendChild(card);
  });
}

// Global Lightbox helper
function openCertLightbox(src) {
  let lightbox = document.getElementById("cert-lightbox-widget");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "cert-lightbox-widget";
    lightbox.className = "cert-lightbox";
    lightbox.innerHTML = `
      <div class="cert-lightbox-close">&times;</div>
      <img class="cert-lightbox-content" src="" />
    `;
    document.body.appendChild(lightbox);
    
    lightbox.addEventListener("click", () => {
      lightbox.classList.remove("open");
    });
    lightbox.querySelector(".cert-lightbox-close").addEventListener("click", (e) => {
      e.stopPropagation();
      lightbox.classList.remove("open");
    });
  }
  
  lightbox.querySelector(".cert-lightbox-content").src = src;
  lightbox.classList.add("open");
}

// ----------------------------------------------------
// CERTIFICATES ADMIN CRUD LIFECYCLE
// ----------------------------------------------------
let certFormBound = false;
let currentUploadedCertImage = "";

function showCertPreview(src) {
  const box = document.getElementById("admin-cert-image-preview-box");
  const img = document.getElementById("admin-cert-preview-img");
  if (box && img) {
    img.src = src;
    box.style.display = "flex";
  }
}

function hideCertPreview() {
  const box = document.getElementById("admin-cert-image-preview-box");
  const img = document.getElementById("admin-cert-preview-img");
  const fileInput = document.getElementById("admin-cert-file");
  const urlInput = document.getElementById("admin-cert-image-url");
  if (box && img) {
    img.src = "";
    box.style.display = "none";
  }
  if (fileInput) fileInput.value = "";
  if (urlInput) urlInput.value = "";
  currentUploadedCertImage = "";
}

function setupAdminCertFormOnce() {
  if (certFormBound) return;
  certFormBound = true;

  const form = document.getElementById("admin-certificate-form");
  const cancelBtn = document.getElementById("admin-cert-cancel-btn");
  const submitBtn = document.getElementById("admin-cert-submit-btn");
  const fileInput = document.getElementById("admin-cert-file");
  const urlInput = document.getElementById("admin-cert-image-url");
  const removeImgBtn = document.getElementById("admin-cert-remove-img-btn");

  if (!form) return;

  // Handle local image file picker and compress via Canvas
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      urlInput.value = ""; // clear URL input
      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 500; // Optimal width for local storage
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          currentUploadedCertImage = canvas.toDataURL("image/jpeg", 0.7);
          showCertPreview(currentUploadedCertImage);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle manual image URL input
  urlInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) {
      fileInput.value = ""; // Clear file selector
      currentUploadedCertImage = val;
      showCertPreview(val);
    } else {
      hideCertPreview();
    }
  });

  // Remove image preview action
  removeImgBtn.addEventListener("click", () => {
    hideCertPreview();
  });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("admin-certificate-id").value;
      const title = document.getElementById("admin-cert-title").value.trim();
      const issuer = document.getElementById("admin-cert-issuer").value.trim();
      const date = document.getElementById("admin-cert-date").value.trim();
      const url = document.getElementById("admin-cert-url").value.trim();
      const skills = document.getElementById("admin-cert-skills").value.trim();

      Database.saveCertificate({
        id: id || undefined,
        title,
        issuer,
        date,
        url,
        skills,
        image: currentUploadedCertImage
      });

      const submitBtn = document.getElementById("admin-cert-submit-btn");
      flashButtonSuccess(submitBtn, id ? "✓ Certificate Updated!" : "✓ Certificate Saved!");
      showToast(id ? `Updated certificate "${title}"` : `Certificate "${title}" saved!`);
      resetCertForm();
      renderAdminCertList();
      refreshAllPublicViews();
    });

    cancelBtn.addEventListener("click", resetCertForm);
  }

  function resetCertForm() {
    const form = document.getElementById("admin-certificate-form");
    if (form) form.reset();
    document.getElementById("admin-certificate-id").value = "";
    document.getElementById("admin-cert-submit-btn").textContent = "Add Certificate";
    document.getElementById("admin-cert-cancel-btn").style.display = "none";
    hideCertPreview();
  }

  function renderAdminCertList() {
    const container = document.getElementById("admin-certificate-list");
    if (!container) return;
    const certs = Database.getCertificates();

    container.innerHTML = "";
    if (certs.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No certificates.</div>`;
      return;
    }

    certs.forEach(cert => {
      const el = document.createElement("div");
      el.className = "admin-list-item";
      el.innerHTML = `
        <div class="admin-list-info">
          <h4>${cert.title}</h4>
          <p>${cert.issuer} &bull; ${cert.date}</p>
        </div>
        <div class="admin-list-actions">
          <button class="action-btn edit" title="Edit certificate">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn delete" title="Delete certificate">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;

      el.querySelector(".edit").addEventListener("click", () => {
        document.getElementById("admin-certificate-id").value = cert.id;
        document.getElementById("admin-cert-title").value = cert.title;
        document.getElementById("admin-cert-issuer").value = cert.issuer;
        document.getElementById("admin-cert-date").value = cert.date;
        document.getElementById("admin-cert-url").value = cert.url || "";
        document.getElementById("admin-cert-skills").value = cert.skills || "";
        
        currentUploadedCertImage = cert.image || "";
        if (currentUploadedCertImage) {
          showCertPreview(currentUploadedCertImage);
          if (!currentUploadedCertImage.startsWith("data:")) {
            document.getElementById("admin-cert-image-url").value = currentUploadedCertImage;
          }
        } else {
          hideCertPreview();
        }

        document.getElementById("admin-cert-submit-btn").textContent = "Update Certificate";
        document.getElementById("admin-cert-cancel-btn").style.display = "inline-block";
        document.getElementById("admin-certificate-form").scrollIntoView({ behavior: "smooth" });
      });

      el.querySelector(".delete").addEventListener("click", () => {
        Database.deleteCertificate(cert.id);
        showToast(`Deleted certificate "${cert.title}".`, "delete");
        renderAdminCertList();
        renderCertificatesGrid();
      });

      container.appendChild(el);
    });
  }

// ----------------------------------------------------
// DYNAMIC HACKATHONS SHOWCASE RENDERING
// ----------------------------------------------------
function renderHackathonsGrid() {
  const container = document.getElementById("hackathons-grid-container");
  if (!container) return;
  const hackathons = Database.getHackathons();

  container.innerHTML = "";
  if (hackathons.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dimmed); padding: 40px;">No hackathons added yet. Add some in the Admin panel!</div>`;
    return;
  }

  hackathons.forEach(hack => {
    const card = document.createElement("div");
    card.className = "hackathon-card glass-card";

    // Skills tag list
    const techList = hack.technologies ? hack.technologies.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];
    const techMarkup = techList.map(s => `<span class="hackathon-skill-tag">${s}</span>`).join("");

    // Action buttons
    const demoBtn = hack.projectUrl ? `<a href="${hack.projectUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 6px 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px;">
        View Demo
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>` : '';

    const certBtn = hack.certificateUrl ? `<a href="${hack.certificateUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 6px 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px; border-color: rgba(99, 102, 241, 0.4); color: var(--accent-indigo);">
        Certificate / Proof
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </a>` : '';

    const imgContainer = hack.image ? `
      <div class="hackathon-image-container" title="Click to view photo full size">
        <img src="${hack.image}" alt="${hack.title}" />
      </div>
    ` : '';

    const achievementMarkup = hack.achievement ? `
      <span class="hackathon-achievement-badge">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
        ${hack.achievement}
      </span>
    ` : '';

    card.innerHTML = `
      ${imgContainer}
      <div class="hackathon-badge-container">
        <div class="hackathon-organizer">${hack.organizer || 'Hackathon Event'}</div>
        ${achievementMarkup}
      </div>
      <h3 class="hackathon-title">${hack.title}</h3>
      <div class="hackathon-project-name">Project: ${hack.projectName}</div>
      <p class="hackathon-description">${hack.description}</p>
      
      <div class="hackathon-skills">
        ${techMarkup}
      </div>
      
      <div class="hackathon-meta">
        <span>${hack.role} &bull; ${hack.date}</span>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${demoBtn}
          ${certBtn}
        </div>
      </div>
    `;

    const imgEl = card.querySelector(".hackathon-image-container");
    if (imgEl) {
      imgEl.addEventListener("click", () => {
        openCertLightbox(hack.image);
      });
    }

    container.appendChild(card);
  });
}

// ----------------------------------------------------
// HACKATHONS ADMIN CRUD LIFECYCLE
// ----------------------------------------------------
let hackFormBound = false;
let currentUploadedHackImage = "";

function showHackPreview(src) {
  const box = document.getElementById("admin-hack-image-preview-box");
  const img = document.getElementById("admin-hack-preview-img");
  if (box && img) {
    img.src = src;
    box.style.display = "flex";
  }
}

function hideHackPreview() {
  const box = document.getElementById("admin-hack-image-preview-box");
  const img = document.getElementById("admin-hack-preview-img");
  const fileInput = document.getElementById("admin-hack-file");
  const urlInput = document.getElementById("admin-hack-image-url");
  if (box && img) {
    img.src = "";
    box.style.display = "none";
  }
  if (fileInput) fileInput.value = "";
  if (urlInput) urlInput.value = "";
  currentUploadedHackImage = "";
}

function setupAdminHackathonFormOnce() {
  if (hackFormBound) return;
  hackFormBound = true;

  const form = document.getElementById("admin-hackathon-form");
  const cancelBtn = document.getElementById("admin-hack-cancel-btn");
  const submitBtn = document.getElementById("admin-hack-submit-btn");
  const fileInput = document.getElementById("admin-hack-file");
  const urlInput = document.getElementById("admin-hack-image-url");
  const removeImgBtn = document.getElementById("admin-hack-remove-img-btn");

  if (!form) return;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      urlInput.value = "";
      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 500;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          currentUploadedHackImage = canvas.toDataURL("image/jpeg", 0.7);
          showHackPreview(currentUploadedHackImage);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  urlInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) {
      fileInput.value = "";
      currentUploadedHackImage = val;
      showHackPreview(val);
    } else {
      hideHackPreview();
    }
  });

  if (removeImgBtn) {
    removeImgBtn.addEventListener("click", () => {
      hideHackPreview();
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("admin-hackathon-id").value;
    const title = document.getElementById("admin-hack-title").value.trim();
    const organizer = document.getElementById("admin-hack-organizer").value.trim();
    const date = document.getElementById("admin-hack-date").value.trim();
    const role = document.getElementById("admin-hack-role").value.trim();
    const projectName = document.getElementById("admin-hack-project-name").value.trim();
    const achievement = document.getElementById("admin-hack-achievement").value.trim();
    const description = document.getElementById("admin-hack-desc").value.trim();
    const technologies = document.getElementById("admin-hack-tech").value.trim();
    const projectUrl = document.getElementById("admin-hack-project-url").value.trim();
    const certificateUrl = document.getElementById("admin-hack-cert-url").value.trim();

    Database.saveHackathon({
      id: id || undefined,
      title,
      organizer,
      date,
      role,
      projectName,
      achievement,
      description,
      technologies,
      projectUrl,
      certificateUrl,
      image: currentUploadedHackImage
    });

    const submitBtn = document.getElementById("admin-hack-submit-btn");
    flashButtonSuccess(submitBtn, id ? "✓ Hackathon Updated!" : "✓ Hackathon Saved!");
    showToast(id ? `Updated hackathon "${title}"` : `Hackathon "${title}" saved successfully!`);
    resetHackForm();
    renderAdminHackathonList();
    refreshAllPublicViews();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetHackForm);
  }
}

function resetHackForm() {
  const form = document.getElementById("admin-hackathon-form");
  if (form) form.reset();
  document.getElementById("admin-hackathon-id").value = "";
  const submitBtn = document.getElementById("admin-hack-submit-btn");
  const cancelBtn = document.getElementById("admin-hack-cancel-btn");
  if (submitBtn) submitBtn.textContent = "Add Hackathon";
  if (cancelBtn) cancelBtn.style.display = "none";
  hideHackPreview();
}

function renderAdminHackathonList() {
  const container = document.getElementById("admin-hackathon-list");
  if (!container) return;
  const hackathons = Database.getHackathons();

  container.innerHTML = "";
  if (hackathons.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dimmed); padding: 20px;">No hackathons listed.</div>`;
    return;
  }

  hackathons.forEach(hack => {
    const el = document.createElement("div");
    el.className = "admin-list-item";
    el.innerHTML = `
      <div class="admin-list-info">
        <h4>${hack.title} (${hack.achievement || 'Participant'})</h4>
        <p>${hack.projectName} &bull; ${hack.organizer} (${hack.date})</p>
      </div>
      <div class="admin-list-actions">
        <button class="action-btn edit" title="Edit hackathon">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete" title="Delete hackathon">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `;

    el.querySelector(".edit").addEventListener("click", () => {
      document.getElementById("admin-hackathon-id").value = hack.id;
      document.getElementById("admin-hack-title").value = hack.title;
      document.getElementById("admin-hack-organizer").value = hack.organizer || "";
      document.getElementById("admin-hack-date").value = hack.date || "";
      document.getElementById("admin-hack-role").value = hack.role || "";
      document.getElementById("admin-hack-project-name").value = hack.projectName || "";
      document.getElementById("admin-hack-achievement").value = hack.achievement || "";
      document.getElementById("admin-hack-desc").value = hack.description || "";
      document.getElementById("admin-hack-tech").value = hack.technologies || "";
      document.getElementById("admin-hack-project-url").value = hack.projectUrl || "";
      document.getElementById("admin-hack-cert-url").value = hack.certificateUrl || "";

      currentUploadedHackImage = hack.image || "";
      if (currentUploadedHackImage) {
        showHackPreview(currentUploadedHackImage);
        if (!currentUploadedHackImage.startsWith("data:")) {
          document.getElementById("admin-hack-image-url").value = currentUploadedHackImage;
        }
      } else {
        hideHackPreview();
      }

      document.getElementById("admin-hack-submit-btn").textContent = "Update Hackathon";
      document.getElementById("admin-hack-cancel-btn").style.display = "inline-block";
      document.getElementById("admin-hackathon-form").scrollIntoView({ behavior: "smooth" });
    });

    el.querySelector(".delete").addEventListener("click", () => {
      Database.deleteHackathon(hack.id);
      showToast(`Deleted hackathon "${hack.title}".`, "delete");
      renderAdminHackathonList();
      renderHackathonsGrid();
    });

    container.appendChild(el);
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

    flashButtonSuccess(submitBtn, id ? "✓ Entry Updated!" : "✓ Entry Saved!");
    showToast(id ? `Updated journey entry "${title}"` : `Journey entry "${title}" saved!`);
    resetTimelineForm();
    renderAdminTimelineList();
    refreshAllPublicViews();
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

    flashButtonSuccess(submitBtn, id ? "✓ Article Updated!" : "✓ Article Published!");
    showToast(id ? `Updated article "${title}"` : `Article "${title}" published!`);
    resetBlogForm();
    renderAdminBlogList();
    refreshAllPublicViews();
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

// Check if the serverless proxy backend has a valid Gemini key
async function checkServerStatus() {
  try {
    const res = await fetch("/api/status");
    if (res.ok) {
      const data = await res.json();
      isServerLive = !!data.live;
    }
  } catch (e) {
    isServerLive = false;
  }
  renderHomeStats();
}

// Dynamic Resume and CV PDF/Print generator
function exportPDF(type) {
  const printUrl = window.location.origin + window.location.pathname + "?print=" + type;
  const printWindow = window.open(printUrl, "_blank");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups to download your Resume/CV.");
  }
}

function checkPrintRoute() {
  const urlParams = new URLSearchParams(window.location.search);
  const printType = urlParams.get('print');
  if (printType === 'resume' || printType === 'cv') {
    generatePrintLayout(printType);
    return true;
  }
  return false;
}

function generatePrintLayout(type) {
  const settings = Database.getSettings();
  const projects = Database.getProjects();
  const tech = Database.getTechStacks();
  const timeline = Database.getTimeline();

  const name = settings.ownerName || "Arnav Jain";
  const email = settings.email || "arnavjain1905@gmail.com";
  const location = settings.location || "Ludhiana, Punjab, India";
  const bio = settings.ownerBio || "";
  
  // Format LinkedIn display username
  const linkedinUrl = settings.linkedin || "";
  let linkedinDisplay = linkedinUrl.replace(/\/$/, "").split("/").pop() || "";
  if (linkedinDisplay && !linkedinDisplay.includes("linkedin.com")) {
    linkedinDisplay = "linkedin.com/in/" + linkedinDisplay;
  }

  const githubUrl = settings.github || "";
  const githubDisplay = githubUrl.replace(/\/$/, "").split("/").pop() || "github.com";

  const isResume = type === "resume";
  const docTitle = isResume ? `${name} - Resume` : `${name} - Curriculum Vitae (CV)`;
  
  const fontFamily = isResume ? "'Inter', 'Outfit', sans-serif" : "'Georgia', serif";
  const accentColor = isResume ? "#4f46e5" : "#1f2937";
  const headerColor = isResume ? "#1e1b4b" : "#111111";
  const bodySize = isResume ? "9.5pt" : "10.5pt";
  const itemMargin = isResume ? "14px" : "24px";
  const summaryAlign = isResume ? "justify" : "left";

  const skillCategories = {};
  tech.forEach(t => {
    if (!skillCategories[t.category]) skillCategories[t.category] = [];
    skillCategories[t.category].push(t.name);
  });

  const workExperience = timeline.filter(t => t.type === "experience");
  const education = timeline.filter(t => t.type === "education");

  const emailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-svg"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const mapPinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-svg"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const linkedinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-svg"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
  const githubIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-svg"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`;

  document.title = docTitle;

  let printHtml = `
    <div class="print-container ${type}-view">
      <header class="print-header">
        <h1>${name}</h1>
        <div class="print-subtitle">${isResume ? "Full-Stack Software Engineer & AI Builder" : "Curriculum Vitae"}</div>
        <div class="print-contact">
          <div class="contact-item">
            ${emailIcon}
            <a href="mailto:${email}">${email}</a>
          </div>
          <div class="contact-item">
            ${mapPinIcon}
            <span>${location}</span>
          </div>
          ${linkedinUrl ? `
          <div class="contact-item">
            ${linkedinIcon}
            <a href="${linkedinUrl}" target="_blank">${linkedinDisplay}</a>
          </div>` : ""}
          ${githubUrl ? `
          <div class="contact-item">
            ${githubIcon}
            <a href="${githubUrl}" target="_blank">${githubDisplay}</a>
          </div>` : ""}
        </div>
      </header>

      <main class="print-main">
        ${bio ? `
        <section class="print-section print-profile">
          <h2 class="section-title">Professional Profile</h2>
          <div class="section-content">
            <p class="profile-bio">${bio}</p>
          </div>
        </section>
        ` : ""}

        <section class="print-section print-skills">
          <h2 class="section-title">Technical Expertise</h2>
          <div class="section-content skills-grid">
  `;

  for (const [category, items] of Object.entries(skillCategories)) {
    printHtml += `
            <div class="skill-category item-block">
              <span class="category-name">${category}:</span>
              <div class="skills-list">
                ${items.map(item => `<span class="skill-badge">${item}</span>`).join("")}
              </div>
            </div>
    `;
  }

  printHtml += `
          </div>
        </section>

        <section class="print-section print-experience">
          <h2 class="section-title">Professional Experience</h2>
          <div class="section-content timeline-items">
  `;

  const expItems = isResume ? workExperience.slice(0, 3) : workExperience;
  if (expItems.length === 0) {
    printHtml += `<p class="empty-msg">Detailed professional history available upon request.</p>`;
  } else {
    expItems.forEach(item => {
      printHtml += `
            <div class="timeline-item item-block">
              <div class="item-header">
                <h3 class="item-title">${item.title}</h3>
                <span class="item-date">${item.dateRange}</span>
              </div>
              <div class="item-sub-header">
                <span class="item-company">${item.company}</span>
                <span class="item-role">${item.role}</span>
              </div>
              <div class="item-description">${item.description.split("\n").map(p => p.trim() ? `<p>&bull; ${p.trim()}</p>` : "").join("")}</div>
            </div>
      `;
    });
  }

  printHtml += `
          </div>
        </section>

        <section class="print-section print-projects">
          <h2 class="section-title">Featured Projects</h2>
          <div class="section-content projects-list">
  `;

  const projItems = isResume ? projects.slice(0, 2) : projects;
  if (projItems.length === 0) {
    printHtml += `<p class="empty-msg">Project case studies and repository details available on the website.</p>`;
  } else {
    projItems.forEach(proj => {
      printHtml += `
            <div class="project-item item-block">
              <div class="item-header">
                <h3 class="item-title">${proj.title}</h3>
                <div class="project-links">
                  <a href="${proj.githubUrl}" target="_blank">GitHub</a>
                  ${proj.liveUrl ? ` &bull; <a href="${proj.liveUrl}" target="_blank">Live Demo</a>` : ""}
                </div>
              </div>
              <p class="project-desc">${proj.description}</p>
              <div class="project-tech"><strong>Technologies:</strong> ${proj.tags.join(", ")}</div>
            </div>
      `;
    });
  }

  printHtml += `
          </div>
        </section>

        <section class="print-section print-education">
          <h2 class="section-title">Education & Credentials</h2>
          <div class="section-content education-list">
  `;

  const eduItems = isResume ? education.slice(0, 2) : education;
  if (eduItems.length === 0) {
    printHtml += `<p class="empty-msg">Educational credentials available upon request.</p>`;
  } else {
    eduItems.forEach(item => {
      printHtml += `
            <div class="education-item item-block">
              <div class="item-header">
                <h3 class="item-title">${item.title}</h3>
                <span class="item-date">${item.dateRange}</span>
              </div>
              <div class="item-institution">${item.company}</div>
            </div>
      `;
    });
  }

  printHtml += `
          </div>
        </section>
      </main>
    </div>
  `;

  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');

    /* Responsive screen styling */
    @media screen {
      html {
        background-color: #f3f4f6 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      body {
        font-family: ${fontFamily} !important;
        font-size: ${bodySize} !important;
        line-height: 1.5 !important;
        background-color: #f3f4f6 !important;
        color: #1f2937 !important;
        margin: 0 !important;
        padding: 20px 10px !important;
      }

      .print-container {
        background-color: #ffffff !important;
        max-width: 800px;
        margin: 20px auto !important;
        padding: 1.5cm !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        border-radius: 8px !important;
        box-sizing: border-box;
      }

      /* Mobile Phone Aspect Ratio / Viewport Optimizations */
      @media (max-width: 768px) {
        body {
          padding: 10px 5px !important;
        }

        .print-container {
          margin: 0 auto !important;
          padding: 1.0cm 0.6cm !important;
          border-radius: 6px !important;
        }

        .print-header h1 {
          font-size: ${isResume ? "20pt" : "18pt"} !important;
        }

        .skills-grid {
          grid-template-columns: 1fr !important;
          gap: 6px !important;
        }

        .item-header {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 2px !important;
        }

        .item-date {
          font-size: 8pt !important;
          margin-top: 1px !important;
        }

        .print-contact {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 6px !important;
        }
      }
    }

    /* Print-specific layout */
    @media print {
      html {
        background-color: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      body {
        font-family: ${fontFamily} !important;
        font-size: ${bodySize} !important;
        line-height: 1.5 !important;
        background-color: #ffffff !important;
        color: #1f2937 !important;
        margin: 1.6cm !important; /* Standard print margin to prevent edge cutoff */
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .print-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        background-color: transparent !important;
      }
    }

    /* Hide everything else on the portfolio website */
    #app, .app-container, .navbar, .sidebar, .chatbot-container, .modal, .toast {
      display: none !important;
    }

    .print-header {
      text-align: ${isResume ? "center" : "left"};
      margin-bottom: 20px;
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 12px;
    }

    .print-header h1 {
      font-family: ${isResume ? "'Outfit', sans-serif" : "'Georgia', serif"};
      font-size: ${isResume ? "24pt" : "22pt"};
      font-weight: 700;
      color: ${headerColor};
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
      text-transform: ${isResume ? "uppercase" : "none"};
    }

    .print-subtitle {
      font-family: ${isResume ? "'Outfit', sans-serif" : "'Georgia', serif"};
      font-size: 11pt;
      font-weight: 500;
      color: ${accentColor};
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-style: ${isResume ? "normal" : "italic"};
    }

    .print-contact {
      display: flex;
      justify-content: ${isResume ? "center" : "flex-start"};
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
      font-size: 8.5pt;
      color: #4b5563;
    }

    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .contact-svg {
      color: #4b5563;
      flex-shrink: 0;
      width: 12px;
      height: 12px;
    }

    .print-contact a {
      color: inherit;
      text-decoration: none;
    }

    .print-contact a:hover {
      text-decoration: underline;
    }

    .print-section {
      margin-bottom: ${itemMargin};
    }

    .section-title {
      font-family: ${isResume ? "'Outfit', sans-serif" : "'Georgia', serif"};
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      color: ${headerColor};
      border-bottom: 1px solid ${accentColor};
      padding-bottom: 3px;
      margin-bottom: 8px;
      letter-spacing: 0.8px;
    }

    .profile-bio {
      text-align: ${summaryAlign};
      color: #374151;
      margin: 0;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: ${isResume ? "repeat(2, 1fr)" : "1fr"};
      gap: 8px 16px;
    }

    .skill-category {
      font-size: 8.5pt;
    }

    .category-name {
      font-weight: 700;
      color: #111111;
      display: block;
      margin-bottom: 2px;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .skill-badge {
      background-color: #f3f4f6;
      color: #1f2937;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      border: 1px solid #e5e7eb;
      display: inline-block;
    }

    .item-block {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .timeline-item {
      margin-bottom: 10px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-weight: 700;
      color: #111111;
    }

    .item-title {
      font-size: 9.5pt;
      margin: 0;
      font-weight: 700;
    }

    .item-date {
      font-size: 8.5pt;
      color: #4b5563;
      font-weight: 500;
    }

    .item-sub-header {
      display: flex;
      gap: 6px;
      font-size: 8.5pt;
      color: #4b5563;
      font-style: ${isResume ? "normal" : "italic"};
      margin-bottom: 4px;
    }

    .item-company {
      font-weight: 600;
    }

    .item-role {
      font-weight: normal;
    }

    .item-description {
      font-size: 8.5pt;
      color: #374151;
      padding-left: 6px;
    }

    .item-description p {
      margin-bottom: 2px;
    }

    .project-item {
      margin-bottom: 10px;
    }

    .project-links {
      font-size: 8pt;
      font-weight: normal;
    }

    .project-links a {
      color: ${accentColor};
      text-decoration: none;
    }

    .project-links a:hover {
      text-decoration: underline;
    }

    .project-desc {
      font-size: 8.5pt;
      color: #374151;
      margin: 2px 0;
      text-align: justify;
    }

    .project-tech {
      font-size: 8pt;
      color: #4b5563;
    }

    .education-item {
      margin-bottom: 6px;
    }

    .item-institution {
      font-size: 8.5pt;
      color: #4b5563;
    }

    .empty-msg {
      font-size: 8.5pt;
      color: #6b7280;
      font-style: italic;
    }

    @page {
      size: A4;
      margin: 0 !important; /* Hides default browser header (title, timestamp) and footer (URL) */
    }

    .cv-view {
      font-family: 'Georgia', serif !important;
    }
    
    .cv-view .skills-list {
      display: inline;
    }

    .cv-view .skill-badge {
      background-color: transparent;
      border: none;
      padding: 0;
      border-radius: 0;
      display: inline;
    }
    
    .cv-view .skill-badge:not(:last-child)::after {
      content: ", ";
    }
  `;

  document.body.innerHTML = printHtml;
  
  const styleEl = document.createElement("style");
  styleEl.textContent = printStyles;
  document.head.appendChild(styleEl);

  // Disable existing stylesheets
  document.querySelectorAll("link[rel='stylesheet']:not([href*='fonts'])").forEach(link => {
    link.disabled = true;
  });

  // Remove existing styles to avoid conflicts
  document.querySelectorAll("style").forEach(style => {
    if (style !== styleEl) {
      style.remove();
    }
  });

  // Wait for fonts to load before opening print window
  if (document.fonts) {
    document.fonts.ready.then(() => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  } else {
    setTimeout(() => {
      window.print();
    }, 600);
  }
}

// Bind events to resume/cv download buttons
function initResumeExporter() {
  const resumeBtn = document.getElementById("btn-download-resume");
  const cvBtn = document.getElementById("btn-download-cv");

  if (resumeBtn) {
    resumeBtn.addEventListener("click", () => exportPDF("resume"));
  }
  if (cvBtn) {
    cvBtn.addEventListener("click", () => exportPDF("cv"));
  }
}

// Initialize Main Execution Flow
async function initApp() {
  if (checkPrintRoute()) {
    return;
  }
  initTheme();
  initButtonRipples();
  initJobScanner();
  updateAdminLockUI();

  if (isCloudActive) {
    await Database.syncWithCloud();
  }

  renderHomeStats();
  initSlider();
  switchPage("home");
  checkServerStatus(); // Query Vercel serverless state
  initResumeExporter(); // Bind resume/cv click actions
}

window.addEventListener("DOMContentLoaded", initApp);
