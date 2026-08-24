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

// High-Performance Groq API Caller using Llama 3.3 70B
async function callGroqApi(messages, options = {}) {
  const settings = Database.getSettings();
  const apiKey = settings.groqKey || settings.geminiKey || "";

  const bodyPayload = {
    model: options.model || "llama-3.3-70b-versatile",
    messages: messages,
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    max_tokens: options.max_tokens || 500,
    json: options.json || false
  };

  // 1. Direct client call to Groq if key is present
  if (apiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: bodyPayload.model,
          messages: messages,
          temperature: bodyPayload.temperature,
          max_tokens: bodyPayload.max_tokens,
          response_format: options.json ? { type: "json_object" } : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      }
    } catch (e) {
      console.warn("Direct Groq API call error:", e);
    }
  }

  // 2. Serverless proxy fallback
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-groq-key": apiKey } : {})
      },
      body: JSON.stringify(bodyPayload)
    });

    if (response.ok) {
      const data = await response.json();
      return data.text || "";
    }
  } catch (e) {
    console.warn("Serverless AI proxy error:", e);
  }

  throw new Error("Groq API offline / unconfigured.");
}

// Simulated rule-based AI engine for offline fallback
function getSimulatedResponse(message) {
  const msg = message.toLowerCase();
  const projects = Database.getProjects();
  const techStacks = Database.getTechStacks();
  const settings = Database.getSettings();

  // Basic greeting
  if (msg.includes("hello") || msg.includes("hi ") || msg.includes("hey")) {
    return "Hello! I am the virtual assistant for this portfolio. I can tell you about the owner's skills, projects, or how to contact them. (Tip: Configure your free Groq API Key in the Admin panel for live high-speed AI responses!)";
  }

  // Who are you / bio
  if (msg.includes("who are you") || msg.includes("about") || msg.includes("yourself") || msg.includes("bio")) {
    return `The portfolio owner is ${settings.ownerName || "Arnav Jain"}. Here is their bio: "${settings.ownerBio}". Would you like to check out their tech stack or projects?`;
  }

  // Projects inquiry
  if (msg.includes("project") || msg.includes("built") || msg.includes("portfolio")) {
    if (projects.length === 0) {
      return "No projects have been added yet! You can add some in the Admin panel.";
    }
    let response = "Here are the projects the owner has built:\n\n";
    projects.forEach(p => {
      response += `• **${p.title}**: ${p.description} (${(Array.isArray(p.tags) ? p.tags : []).join(", ")})\n`;
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
        (Array.isArray(p.tags) ? p.tags : []).some(tag => tag.toLowerCase() === tech.name.toLowerCase())
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
    return `You can get in touch by filling out the Contact Form on the **Contact** page, or email directly at **${settings.email || "arnavjain1905@gmail.com"}**.`;
  }

  // Default response
  return "That's an interesting question! I am running in Offline Sandbox Mode. To get a fully dynamic response from Llama 3.3 70B, please navigate to the **Admin** tab -> **Settings** and enter your free Groq API Key.";
}

export const AI = {
  // Chat with Groq Llama 3.3 70B
  async askAI(message, conversationHistory = []) {
    try {
      const portfolioContext = compilePortfolioContext();
      
      const systemInstruction = `You are the Virtual AI Representative of a software developer.
Your job is to interact with visitors of this portfolio website, answering questions about the developer's experience, technologies, and projects.
Be professional, elegant, helpful, and concise. Make the developer look good! Do not make up facts; refer strictly to the provided context. If you don't know something, guide them to the Contact page.

PORTFOLIO CONTEXT:
${portfolioContext}`;

      const messages = [
        { role: "system", content: systemInstruction },
        ...conversationHistory.map(msg => ({
          role: msg.sender === "visitor" ? "user" : "assistant",
          content: msg.text
        })),
        { role: "user", content: message }
      ];

      const text = await callGroqApi(messages, {
        temperature: 0.7,
        max_tokens: 350
      });

      return text;
    } catch (error) {
      console.warn("Groq AI chat failed (falling back to sandbox):", error);
      return getSimulatedResponse(message);
    }
  },

  // Generate a project description based on title and tags
  async generateProjectDescription(title, tags) {
    try {
      const messages = [
        {
          role: "system",
          content: "You are an expert technical resume and portfolio copywriter. Keep responses brief, punchy, and action-oriented."
        },
        {
          role: "user",
          content: `Generate a professional, high-impact 2-sentence project description for a developer portfolio.
Project Title: ${title}
Technologies Used: ${(Array.isArray(tags) ? tags : []).join(", ")}
Start directly with action verbs.`
        }
      ];

      const text = await callGroqApi(messages, {
        temperature: 0.8,
        max_tokens: 120
      });

      return text.trim();
    } catch (error) {
      console.warn("Groq description generator fallback:", error);
      return `A scalable ${title} application built leveraging ${(Array.isArray(tags) ? tags : []).join(", ") || "modern tech stacks"}.`;
    }
  },

  // Draft a response to a message
  async draftReplyToMessage(senderName, messageText) {
    const settings = Database.getSettings();
    const ownerName = settings.ownerName || "Arnav Jain";

    try {
      const messages = [
        {
          role: "system",
          content: `You are drafting an email reply on behalf of ${ownerName}. Keep it professional, friendly, and concise.`
        },
        {
          role: "user",
          content: `Draft a friendly, professional 1-paragraph email response to an inquiry.
Sender: ${senderName}
Inquiry Message: "${messageText}"
Sign off as ${ownerName}.`
        }
      ];

      const text = await callGroqApi(messages, {
        temperature: 0.7,
        max_tokens: 200
      });

      return text.trim();
    } catch (error) {
      console.warn("Groq email drafting fallback:", error);
      return `Hi ${senderName},\n\nThank you for reaching out! I appreciate you contacting me regarding: "${messageText.substring(0, 40)}...". I will review this and get back to you shortly.\n\nBest regards,\n${ownerName}`;
    }
  },

  // Analyze recruiter job description for alignment
  async analyzeJobFit(jobDescription) {
    try {
      const portfolioContext = compilePortfolioContext();
      
      const systemInstruction = `You are a senior technical recruiter evaluating a developer named Arnav Jain.
Evaluate if Arnav fits the provided job description.
You MUST output ONLY a valid JSON object matching this schema:
{
  "score": 85,
  "summary": "Arnav has strong experience with C++, Python and modern web frameworks which align well with the position.",
  "strengths": ["Strong foundational programming skills", "Practical project and full-stack development experience"],
  "gaps": ["No direct reference to specialized proprietary cloud tools in the JD context"],
  "projects": ["Global Nav Plexus"]
}
Keep summary to 2 sentences. Limit strengths/gaps/projects lists to 2-3 bullet items.`;

      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Evaluate this job description:\n"${jobDescription}"\n\nCandidate portfolio context:\n${portfolioContext}` }
      ];

      const text = await callGroqApi(messages, {
        temperature: 0.2,
        max_tokens: 400,
        json: true
      });

      const parsed = JSON.parse(text);
      return parsed;
    } catch (error) {
      console.warn("Groq job-fit analysis failed:", error);
      return this.analyzeJobFitOffline(jobDescription);
    }
  },

  // Generate blog article outline
  async generateBlogOutline(title) {
    try {
      const messages = [
        {
          role: "system",
          content: "You are a senior technical writer. Output structured markdown outlines with ### headers and bullet points."
        },
        {
          role: "user",
          content: `Create a brief professional article outline for the blog title: "${title}". Keep it compact.`
        }
      ];

      const text = await callGroqApi(messages, {
        temperature: 0.7,
        max_tokens: 250
      });

      return text;
    } catch (error) {
      console.warn("Groq blog outline generation fallback:", error);
      return `### 1. Introduction to ${title}\n- Core concepts and motivation\n\n### 2. Architecture & Design\n- Technical patterns and benchmarks\n\n### 3. Implementation Steps\n- Best practices and code structure\n\n### 4. Conclusion & Key Takeaways`;
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

