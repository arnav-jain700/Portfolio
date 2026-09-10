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
    context += `- ${tech.name} (Category: ${tech.category})\n`;
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
    return `Hello! I am the AI Representative for **${settings.ownerName || "Arnav Jain"}**. Feel free to ask about his technical proficiencies, portfolio projects, engineering background, or how to get in touch!`;
  }

  // Who are you / bio
  if (msg.includes("who are you") || msg.includes("about") || msg.includes("yourself") || msg.includes("bio")) {
    return `**${settings.ownerName || "Arnav Jain"}** is a Data Science and AI Developer. Summary: "${settings.ownerBio || "Dedicated to forging robust data architectures and building generative, intelligent models."}". Would you like to explore his skillset or featured projects?`;
  }

  // Projects inquiry
  if (msg.includes("project") || msg.includes("built") || msg.includes("portfolio")) {
    if (projects.length === 0) {
      return "No projects currently listed in the database. Please check back soon or add projects via the admin panel.";
    }
    let response = "Here are some of the key projects built by Arnav:\n\n";
    projects.forEach(p => {
      response += `• **${p.title}**: ${p.description} *(Technologies: ${(Array.isArray(p.tags) ? p.tags : []).join(", ")})*\n`;
    });
    return response;
  }

  // Tech stack / skillset inquiry
  if (msg.includes("skills") || msg.includes("skillset") || msg.includes("tech") || msg.includes("stack") || msg.includes("know") || msg.includes("language") || msg.includes("non-technical") || msg.includes("soft skills")) {
    if (techStacks.length === 0) {
      return "No skills currently listed in the database.";
    }
    const categories = {};
    techStacks.forEach(t => {
      if (!categories[t.category]) categories[t.category] = [];
      categories[t.category].push(t.name);
    });

    let response = "Here is an overview of Arnav's skillset and proficiencies by category:\n\n";
    for (const [cat, items] of Object.entries(categories)) {
      response += `✦ **${cat}**: ${items.join(", ")}\n`;
    }
    return response;
  }

  // Specific technology filter
  for (const tech of techStacks) {
    if (msg.includes(tech.name.toLowerCase())) {
      const matchingProjects = projects.filter(p => 
        (Array.isArray(p.tags) ? p.tags : []).some(tag => tag.toLowerCase() === tech.name.toLowerCase())
      );
      
      let response = `Arnav has strong hands-on experience with **${tech.name}**. `;
      if (matchingProjects.length > 0) {
        response += `It is utilized in projects such as: ${matchingProjects.map(p => p.title).join(", ")}.`;
      } else {
        response += "It is part of his core technical skillset for machine learning and system engineering.";
      }
      return response;
    }
  }

  // Contact info
  if (msg.includes("contact") || msg.includes("hire") || msg.includes("email") || msg.includes("message")) {
    return `You can connect directly with Arnav via the **Contact** page form or send an email to **${settings.email || "arnavjain1905@gmail.com"}**.`;
  }

  // Default response
  return `I am here to help you navigate ${settings.ownerName || "Arnav"}'s engineering portfolio, technical skills, projects, and certifications. Feel free to ask any specific question or head over to the Contact page to connect! ✦`;
}

export const AI = {
  // Chat with Groq Llama 3.3 70B
  async askAI(message, conversationHistory = []) {
    try {
      const portfolioContext = compilePortfolioContext();
      
      const systemInstruction = `You are the AI Assistant & Portfolio Representative for software engineer and data scientist Arnav Jain.
Your role is to interact with engineering leaders, recruiters, and visitors exploring this portfolio website, answering questions about Arnav's background, technical proficiencies, machine learning projects, and experience.
Maintain an articulate, intelligent, welcoming, and senior professional demeanor. Refer accurately to the provided context and avoid making assumptions or hallucinating details. If something is unknown, direct them to the Contact page.

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
  }
};

