// ═══════════════════════════════════════════════════════════════════
//  Groq-Powered AI Quantum Tutor — with offline fallback
// ═══════════════════════════════════════════════════════════════════

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

import { explainCircuit } from './quantum.js';

// Fallback responses for offline / error scenarios
const FALLBACK_RESPONSES = {
  qubit: "A **qubit** is the basic unit of quantum information. Unlike a classical bit (0 or 1), a qubit can exist in a **superposition** of both states simultaneously: |ψ⟩ = α|0⟩ + β|1⟩, where |α|² + |β|² = 1. When measured, it collapses to either |0⟩ or |1⟩ with probabilities |α|² and |β|² respectively.",
  superposition: "**Superposition** means a qubit can be in a combination of |0⟩ and |1⟩ at the same time. Think of a coin spinning in the air — it's neither heads nor tails until it lands. The Hadamard gate H creates superposition: H|0⟩ = (|0⟩+|1⟩)/√2 = |+⟩",
  entanglement: "**Quantum entanglement** means two or more qubits become correlated such that measuring one instantly determines the state of the other, no matter how far apart. A Bell state (|00⟩+|11⟩)/√2 is a perfect example — measuring the first qubit as |0⟩ means the second is also |0⟩.",
  hadamard: "The **Hadamard gate** H creates superposition:\n- H|0⟩ = (|0⟩+|1⟩)/√2 = |+⟩\n- H|1⟩ = (|0⟩-|1⟩)/√2 = |−⟩\n\nMatrix: H = (1/√2) [[1,1],[1,-1]]\n\nApplying H twice returns to the original state: HH = I",
  measurement: "**Quantum measurement** collapses a qubit from superposition to a definite state. For state α|0⟩ + β|1⟩:\n- Probability of measuring |0⟩ = |α|²\n- Probability of measuring |1⟩ = |β|²\n\nAfter measurement, the state collapses — you cannot 'unmeasure' a qubit.",
  default: "Great question! I'm your AI quantum tutor. Ask me about any quantum computing topic — qubits, gates, circuits, algorithms, Qiskit, QML, or anything from your current module. I'm here to explain, give hints, and help you understand your mistakes.",
};

/**
 * Generate a rich structured offline AI explanation for a circuit
 */
export function generateOfflineCircuitExplanation(ops, nQubits) {
  const sorted = [...ops].filter(o => o.gate !== 'M').sort((a, b) => a.col - b.col);
  if (sorted.length === 0) return null;

  const analysis = explainCircuit(ops, nQubits);
  if (!analysis) return null;

  const gateCount = sorted.length;
  const gatesUsed = Array.from(new Set(sorted.map(o => o.gate))).join(', ');

  let summaryText = `This circuit operates on **${nQubits} qubit${nQubits > 1 ? 's' : ''}** with **${gateCount} gate operation${gateCount > 1 ? 's' : ''}** (\`${gatesUsed}\`).`;

  const hasH = sorted.some(o => o.gate === 'H');
  const hasCNOT = sorted.some(o => o.gate === 'CNOT');
  const hasX = sorted.some(o => o.gate === 'X');
  const hasRot = sorted.some(o => ['Rx', 'Ry', 'Rz'].includes(o.gate));

  if (hasH && hasCNOT) {
    summaryText += ` It creates **quantum entanglement** between qubits, generating a highly correlated multi-qubit superposition state (such as a **Bell state**).`;
  } else if (hasH) {
    summaryText += ` It uses the **Hadamard gate** to put qubit(s) into **superposition**, placing them in a linear combination of |0⟩ and |1⟩.`;
  } else if (hasCNOT) {
    summaryText += ` It utilizes conditional quantum logic (**CNOT**) to perform controlled bit flips.`;
  } else if (hasRot) {
    summaryText += ` It uses continuous rotation gates (**Rx/Ry/Rz**) to rotate qubit state vectors on the **Bloch sphere**.`;
  }

  let stepsMarkdown = '';
  analysis.transformations.forEach((t, i) => {
    if (i === 0) {
      stepsMarkdown += `1. **Initial State**: |ψ₀⟩ = \`${t.state}\`\n`;
    } else {
      stepsMarkdown += `${i + 1}. **Apply ${t.step}**: State transforms to |ψ${i}⟩ = \`${t.state}\`\n`;
    }
  });

  let conceptsMarkdown = '';
  analysis.concepts.forEach(c => {
    conceptsMarkdown += `- ${c}\n`;
  });

  return `### 🎯 Executive Summary
${summaryText}

### ⚡ Step-by-Step Quantum Transformations
${stepsMarkdown}

### 🔬 Key Quantum Phenomena
${conceptsMarkdown}

### 💡 Applications & Technical Insights
- **Circuit Depth**: ${Math.max(0, ...ops.map(o => o.col)) + 1}
- **Active Gates**: \`${gatesUsed}\`
- **Tip**: Switch to the **⟨ψ| State** tab for exact Dirac notation or **Matrices** for explicit unitary matrices.`;
}

/**
 * Build the system prompt for the Groq LLM
 */
function buildSystemPrompt(currentModule, currentTopic) {
  let context = '';
  if (currentModule) context += `\nThe student is currently on Module ${currentModule}.`;
  if (currentTopic) context += ` Topic: "${currentTopic}".`;

  return `You are an expert AI quantum computing tutor embedded in "QuantumLearn", an interactive quantum learning platform.

CRITICAL FORMATTING REQUIREMENTS:
- ALWAYS format your response in clean, highly-structured Markdown.
- Use clear section headers with relevant emojis (e.g. ### 🎯 Overview, ### ⚡ Step-by-Step, ### 💡 Key Insights, ### 💻 Code Example).
- Use bold text (**concept**) to highlight key terms.
- Use bullet points (- item) or numbered lists (1. item) for step-by-step explanations.
- Use Dirac notation (|0⟩, |1⟩, |ψ⟩) when referring to quantum states.
- Wrap Python/Qiskit code in fenced code blocks (\`\`\`python ... \`\`\`).
- Keep responses engaging, structured, and easy to read.
${context}`;
}

/**
 * Get a fallback response using keyword matching (used when API is unavailable)
 */
function getFallbackResponse(message, currentModule, currentTopic) {
  const msg = message.toLowerCase();
  let response = FALLBACK_RESPONSES.default;

  if (msg.includes('qubit')) response = FALLBACK_RESPONSES.qubit;
  else if (msg.includes('superposition')) response = FALLBACK_RESPONSES.superposition;
  else if (msg.includes('entangl')) response = FALLBACK_RESPONSES.entanglement;
  else if (msg.includes('hadamard') || msg.includes(' h gate')) response = FALLBACK_RESPONSES.hadamard;
  else if (msg.includes('measur')) response = FALLBACK_RESPONSES.measurement;
  else if (msg.includes('hint')) {
    response = currentTopic
      ? `💡 **Hint for ${currentTopic}:** Think about what operation creates superposition first, then how to use that as a control. Work step by step through the circuit from left to right.`
      : `💡 **Hint:** Break the problem into small steps. What is the goal state? What gates achieve each transformation? Check prerequisites!`;
  }

  if (currentModule && response === FALLBACK_RESPONSES.default) {
    response = `I see you're working on Module ${currentModule}. ${response}\n\nFor this module, focus on: understanding the core concept, working through the examples, and trying the interactive demos. What specific aspect would you like help with?`;
  }

  return response;
}

const CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

/**
 * Clean AI response content (e.g. remove reasoning <think> tags)
 */
function cleanResponseContent(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Send a message to Groq API and get an AI response
 * @param {string} userMessage - The user's message
 * @param {Array} chatHistory - Previous messages [{role: 'user'|'ai', text: string}]
 * @param {string|null} currentModule - Current module ID
 * @param {string|null} currentTopic - Current topic name
 * @returns {Promise<string>} AI response text
 */
export async function getGroqResponse(userMessage, chatHistory = [], currentModule = null, currentTopic = null) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  // If no API key configured, use fallback
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return getFallbackResponse(userMessage, currentModule, currentTopic);
  }

  // Build messages array for the API
  const messages = [
    { role: 'system', content: buildSystemPrompt(currentModule, currentTopic) },
  ];

  // Include last 10 messages for context (to keep token usage reasonable)
  const recentHistory = chatHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  // Add the current user message
  messages.push({ role: 'user', content: userMessage });

  let lastErrorStatus = null;

  // Try candidate models in order until one succeeds
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (!response.ok) {
        lastErrorStatus = response.status;
        if (response.status === 401) {
          return '⚠️ **API Key Invalid** — Please check your AI API key configuration in the environment file.';
        }
        console.warn(`Groq model ${model} failed with status ${response.status}. Trying next candidate...`);
        continue;
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      const cleaned = cleanResponseContent(rawText);

      if (cleaned) {
        return cleaned;
      }
    } catch (error) {
      console.warn(`Groq request failed for model ${model}:`, error);
    }
  }

  if (lastErrorStatus === 429) {
    return '⏳ **Rate Limited** — Too many requests. Please wait a moment and try again.\n\n' + getFallbackResponse(userMessage, currentModule, currentTopic);
  }

  return getFallbackResponse(userMessage, currentModule, currentTopic);
}

// Keep the sync version for backward compatibility
export function getAIResponse(message, currentModule = null, currentTopic = null) {
  return getFallbackResponse(message, currentModule, currentTopic);
}

/**
 * Generate a real-time AI explanation of a quantum circuit using Groq API
 */
export async function explainCircuitWithGroq(ops, nQubits) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  const sorted = [...ops].filter(o => o.gate !== 'M').sort((a, b) => a.col - b.col);
  if (sorted.length === 0) return null;

  const gateSeqStr = sorted.map((op, idx) => {
    if (op.gate === 'CNOT') return `Step ${idx + 1}: CNOT (control: q[${op.control}], target: q[${op.target}])`;
    if (op.gate === 'SWAP') return `Step ${idx + 1}: SWAP (q[${op.target}], q[${op.control}])`;
    if (op.angle !== undefined) return `Step ${idx + 1}: ${op.gate}(${(op.angle * 180 / Math.PI).toFixed(0)}°) on q[${op.target}]`;
    return `Step ${idx + 1}: ${op.gate} gate on q[${op.target}]`;
  }).join('\n');

  const prompt = `Explain the following ${nQubits}-qubit quantum circuit in an engaging, educational, and intuitive way:

Gate Sequence:
${gateSeqStr}

Please structure your explanation using Markdown:
- ### 🎯 Executive Summary (What does this circuit do?)
- ### ⚡ Step-by-Step Quantum Mechanics (What happens physically & mathematically at each step?)
- ### 🔬 Key Quantum Phenomena (Superposition, Entanglement, Phase Shift, Interference, etc.)
- ### 💡 Real-World Applications & Next Steps`;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return generateOfflineCircuitExplanation(ops, nQubits);
  }

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert Quantum Computing AI Tutor embedded in QuantumLearn. You provide clear, beautiful, structured quantum circuit explanations in markdown.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      const cleaned = cleanResponseContent(rawText);
      if (cleaned) return cleaned;
    } catch (err) {
      console.warn(`Groq circuit explanation failed for model ${model}:`, err);
    }
  }

  return generateOfflineCircuitExplanation(ops, nQubits);
}

