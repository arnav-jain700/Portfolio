import { Database } from "./data.js";

// Helper to compile full portfolio context for the system prompt
function compilePortfolioContext() {
  const settings = Database.getSettings();
  const projects = Database.getProjects();
  const techStacks = Database.getTechStacks();
  const timeline = Database.getTimeline();

  let context = `PORTFOLIO OWNER DETAILS:
- Name: ${settings.ownerName || "Arnav Jain"}
- Email: ${settings.email || "arnavjain1905@gmail.com"}
- Location: ${settings.location || "Ludhiana, Punjab, India"}
- LinkedIn: ${settings.linkedin || ""}
- GitHub Profile: ${settings.github || ""}
- Codolio Profile: ${settings.codolio || ""}
- Medium Profile: ${settings.medium || ""}

BIO:
${settings.ownerBio || "Full-stack Developer and AI practitioner."}

SKILLS & TECH STACK:
`;

  techStacks.forEach(tech => {
    context += `- ${tech.name} (Category: ${tech.category}, Proficiency: ${tech.level}%)\n`;
  });

  context += `\nPROFESSIONAL JOURNEY & EDUCATION:\n`;
  timeline.forEach(item => {
    context += `- ${item.title} at ${item.company} (${item.dateRange}) as a ${item.role || item.type}: ${item.description}\n`;
  });

  context += `\nPROJECTS COMPLETED:\n`;
  projects.forEach((proj, idx) => {
    context += `${idx + 1}. ${proj.title}
   - Description: ${proj.description}
   - Tech Used: ${proj.tags.join(", ")}
   - Links: GitHub (${proj.githubUrl}), Live Demo (${proj.liveUrl})\n`;
  });

  return context;
}

// Robust Gemini API HTTP POST caller trying multiple endpoints (v1 and v1beta) to handle 404 deprecations
async function callGeminiApi(apiKey, payload, customModel = "gemini-1.5-flash") {
  const models = [customModel, "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash"];
  const versions = ["v1", "v1beta"];
  
  const urls = [];
  versions.forEach(ver => {
    models.forEach(mod => {
      urls.push(`https://generativelanguage.googleapis.com/${ver}/models/${mod}:generateContent?key=${apiKey}`);
    });
  });

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        return response;
      }
      lastError = new Error(`Gemini API Error: ${response.status} ${response.statusText} at ${url}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("All Gemini API endpoints failed.");
}

// Simulated rule-based AI engine for offline fallback
function getSimulatedResponse(message) {
  const msg = message.toLowerCase();
  const projects = Database.getProjects();
  const techStacks = Database.getTechStacks();
  const settings = Database.getSettings();

  // Basic greeting
  if (msg.includes("hello") || msg.includes("hi ") || msg.includes("hey")) {
    return "Hello! I am the virtual assistant for this portfolio. I can tell you about the owner's skills, projects, or how to contact them. (Tip: Configure a Gemini API Key in the Admin panel for fully dynamic AI chat!)";
  }

  // Who are you / bio
  if (msg.includes("who are you") || msg.includes("about") || msg.includes("yourself") || msg.includes("bio")) {
    return `The portfolio owner is a developer. Here is their bio: "${settings.ownerBio}". Would you like to check out their tech stack or projects?`;
  }

  // Projects inquiry
  if (msg.includes("project") || msg.includes("built") || msg.includes("portfolio")) {
    if (projects.length === 0) {
      return "The owner hasn't listed any projects yet! You can add some in the Admin panel.";
    }
    let response = "Here are the projects the owner has built:\n\n";
    projects.forEach(p => {
      response += `• **${p.title}**: ${p.description} (${p.tags.join(", ")})\n`;
    });
    return response;
  }

  // Tech stack inquiry
  if (msg.includes("skills") || msg.includes("tech") || msg.includes("stack") || msg.includes("know") || msg.includes("language")) {
    if (techStacks.length === 0) {
      return "No skills have been listed yet! You can add them in the Admin panel.";
    }
    const categories = {};
    techStacks.forEach(t => {
      if (!categories[t.category]) categories[t.category] = [];
      categories[t.category].push(`${t.name} (${t.level}%)`);
    });

    let response = "Here is the owner's technology stack:\n\n";
    for (const [cat, items] of Object.entries(categories)) {
      response += `**${cat}**: ${items.join(", ")}\n`;
    }
    return response;
  }

  // Specific technology filter
  for (const tech of techStacks) {
    if (msg.includes(tech.name.toLowerCase())) {
      const matchingProjects = projects.filter(p => 
        p.tags.some(tag => tag.toLowerCase() === tech.name.toLowerCase())
      );
      
      let response = `The owner is proficient in **${tech.name}** (level: ${tech.level}%). `;
      if (matchingProjects.length > 0) {
        response += `They have used it in projects like: ${matchingProjects.map(p => p.title).join(", ")}.`;
      } else {
        response += "They haven't linked it to any specific projects in their portfolio list yet.";
      }
      return response;
    }
  }

  // Contact info
  if (msg.includes("contact") || msg.includes("hire") || msg.includes("email") || msg.includes("message")) {
    return `You can get in touch with Arnav by filling out the Contact Form on the **Contact** page, or email him directly at **${settings.email || "arnavjain1905@gmail.com"}**. You can also view contact logs in the Admin Dashboard.`;
  }

  // Default response
  return "That's an interesting question! I am running in Offline Sandbox Mode. To get a fully intelligent, open-ended response from a real Gemini AI model, please navigate to the **Admin** tab and enter a Google Gemini API Key. (It will be saved only in your local browser's storage).";
}

export const AI = {
  // Chat with Gemini API
  async askAI(message, conversationHistory = []) {
    const settings = Database.getSettings();
    const apiKey = settings.geminiKey;

    if (!apiKey) {
      // Return simulated response after a short delay to feel like a real chatbot
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(getSimulatedResponse(message));
        }, 800);
      });
    }

    try {
      const portfolioContext = compilePortfolioContext();
      
      const systemInstruction = `You are the Virtual AI Representative of a software developer.
Your job is to interact with visitors of this portfolio website, answering questions about the developer's experience, technologies, and projects.
Be professional, elegant, helpful, and concise. Make the developer look good! Do not make up facts; refer strictly to the provided context. If you don't know something, tell them and guide them to the Contact page.

PORTFOLIO CONTEXT:
${portfolioContext}`;

      // Convert conversation history to Gemini format
      // history = [{ role: 'user'|'model', parts: [{ text: '...' }] }]
      const contents = [];
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.sender === "visitor" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
      // Add current message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await callGeminiApi(apiKey, {
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 350
        }
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("AI chat failed:", error);
      return `[AI Connection Error] I had trouble connecting to the Gemini server. Error: ${error.message}. Falling back to sandbox response: \n\n${getSimulatedResponse(message)}`;
    }
  },

  // Generate a project description based on title and tags
  async generateProjectDescription(title, tags) {
    const settings = Database.getSettings();
    const apiKey = settings.geminiKey;

    if (!apiKey) {
      return `A powerful client-side ${title} application designed to stream workflows and boost productivity, built leveraging ${tags.join(", ") || "modern web frameworks"}.`;
    }

    try {
      const response = await callGeminiApi(apiKey, {
        contents: [
          {
            role: "user",
            parts: [{ text: `Generate a professional, high-impact 2-sentence project description for a developer portfolio.
Project Title: ${title}
Technologies Used: ${tags.join(", ")}
Keep it brief and starting with an action-oriented tone.` }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 100
        }
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error("AI description generator failed:", error);
      return `A professional application focusing on ${title}, utilizing ${tags.join(", ") || "modern tech stack"} to build reliable user journeys and back-end efficiency.`;
    }
  },

  // Draft a response to a message
  async draftReplyToMessage(senderName, messageText) {
    const settings = Database.getSettings();
    const apiKey = settings.geminiKey;
    const ownerName = settings.ownerName || "Arnav Jain";

    if (!apiKey) {
      return `Hi ${senderName},\n\nThank you for reaching out! I appreciate you contacting me regarding: "${messageText.substring(0, 40)}...". I will review this and get back to you within 24 hours.\n\nBest regards,\n${ownerName}`;
    }

    try {
      const response = await callGeminiApi(apiKey, {
        contents: [
          {
            role: "user",
            parts: [{ text: `Draft a friendly, professional 1-paragraph email response to an inquiry.
Sender: ${senderName}
Inquiry Message: "${messageText}"
Sign off as ${ownerName}. Keep it elegant.` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error("AI email drafting failed:", error);
      return `Hi ${senderName},\n\nThank you for contacting me. I've received your query and will reply in detail as soon as possible. Let's stay in touch!\n\nBest,\n${ownerName}`;
    }
  },

  // Analyze recruiter job description for alignment
  async analyzeJobFit(jobDescription) {
    const settings = Database.getSettings();
    const apiKey = settings.geminiKey;

    if (!apiKey) {
      // Run offline analyzer
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.analyzeJobFitOffline(jobDescription));
        }, 1200);
      });
    }

    try {
      const portfolioContext = compilePortfolioContext();
      
      const systemInstruction = `You are a professional HR recruiter assistant evaluating a candidate named Arnav Jain.
You will evaluate if Arnav fits the user's provided job description.
You MUST respond with a valid JSON object only. Do not wrap in markdown code blocks or add text outside the JSON. The JSON structure must match:
{
  "score": 85,
  "summary": "Arnav has strong experience with React, Node.js and client-side AI integration which align well with the job. However, there is a minor gap in direct C# experience.",
  "strengths": ["Excellent frontend skills with React and Javascript", "Direct experience in Gemini AI integration"],
  "gaps": ["No direct reference to containerization or Kubernetes in the JD context"],
  "projects": ["NeuroPlan: AI Task Agent", "SyncChat: Socket Hub"]
}
Limit summary to 2-3 sentences. Limit strengths/gaps/projects lists to 2-3 bullet items.`;

      const response = await callGeminiApi(apiKey, {
        contents: [
          {
            role: "user",
            parts: [{ text: `Evaluate this job description: \n"${jobDescription}"\n\nCandidate portfolio context:\n${portfolioContext}` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text);
    } catch (error) {
      console.error("AI job-fit analysis failed:", error);
      return this.analyzeJobFitOffline(jobDescription);
    }
  },

  // Generate blog article outline
  async generateBlogOutline(title) {
    const settings = Database.getSettings();
    const apiKey = settings.geminiKey;

    if (!apiKey) {
      return `### 1. Introduction to ${title}\n- Brief definition and context\n- Key motivations for builders\n\n### 2. Core Principles\n- Practical tips and design systems\n- Best practice benchmarks\n\n### 3. Step-by-Step Implementation\n- Code patterns and hooks\n- Testing and optimization\n\n### 4. Summary & Conclusions`;
    }

    try {
      const response = await callGeminiApi(apiKey, {
        contents: [{
          role: "user",
          parts: [{ text: `Create a brief professional article outline for the blog title: "${title}". Use markdown headers (###) and bullet lists. Keep it compact.` }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("AI blog outline generation failed:", error);
      return `### 1. Introduction to ${title}\n- Outline fallback details.`;
    }
  },

  // Offline rule-based job-fit analyzer
  analyzeJobFitOffline(jobDescription) {
    const jd = jobDescription.toLowerCase();
    const tech = Database.getTechStacks();
    const projects = Database.getProjects();

    const matchedTech = [];
    tech.forEach(t => {
      if (jd.includes(t.name.toLowerCase())) {
        matchedTech.push(t);
      }
    });

    // Score calculations
    let score = 40; // baseline
    if (matchedTech.length > 0) {
      score += matchedTech.length * 10;
    }
    if (jd.includes("fullstack") || jd.includes("full stack")) {
      score += 5;
    }
    if (jd.includes("ai") || jd.includes("llm") || jd.includes("intelligence")) {
      score += 10;
    }
    if (score > 95) score = 95; // cap offline at 95%

    const strengths = [];
    const gaps = [];
    const recommendedProjects = [];

    if (matchedTech.length > 0) {
      strengths.push(`Direct matching skills: ${matchedTech.slice(0, 3).map(m => m.name).join(", ")}`);
    } else {
      strengths.push("Broad conceptual alignment with web design and algorithms");
    }

    if (score > 75) {
      strengths.push("High alignment with full-stack and modern state management concepts");
    } else {
      strengths.push("Strong candidate for core frontend and scripting tasks");
    }

    // Identify gaps
    const allTechNames = tech.map(t => t.name.toLowerCase());
    const commonGaps = ["aws", "kubernetes", "typescript", "c#", "java", "next.js", "tailwind"];
    commonGaps.forEach(g => {
      if (jd.includes(g) && !allTechNames.includes(g)) {
        gaps.push(`Requires proficiency in ${g.toUpperCase()}`);
      }
    });

    if (gaps.length === 0) {
      gaps.push("No major technical stack mismatch detected");
    }

    // Recommended projects
    projects.forEach(p => {
      const matchedCount = p.tags.filter(t => jd.includes(t.toLowerCase())).length;
      if (matchedCount > 0) {
        recommendedProjects.push(p.title);
      }
    });

    if (recommendedProjects.length === 0 && projects.length > 0) {
      recommendedProjects.push(projects[0].title);
    }

    return {
      score: score,
      summary: `Evaluated alignment at ${score}% using sandbox matching. Arnav's expertise in ${matchedTech.map(m => m.name).join(", ") || "web engineering"} makes them a solid fit for this role.`,
      strengths: strengths,
      gaps: gaps,
      projects: recommendedProjects
    };
  }
};

