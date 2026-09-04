import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const CANDIDATE_MODELS = [
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY is not configured on the server.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { userMessage, chatHistory = [], currentModule = null, currentTopic = null, ops = null, nQubits = null, mode = 'chat' } = await req.json();

    let systemPrompt = `You are an expert AI quantum computing tutor embedded in "QuantumLearn", an interactive quantum learning platform.

CRITICAL FORMATTING REQUIREMENTS:
- ALWAYS format your response in clean, highly-structured Markdown.
- Use clear section headers with relevant emojis (e.g. ### 🎯 Overview, ### ⚡ Step-by-Step, ### 💡 Key Insights, ### 💻 Code Example).
- Use bold text (**concept**) to highlight key terms.
- Use bullet points (- item) or numbered lists (1. item) for step-by-step explanations.
- Use Dirac notation (|0⟩, |1⟩, |ψ⟩) when referring to quantum states.
- Wrap Python/Qiskit code in fenced code blocks (\`\`\`python ... \`\`\`).
- Keep responses engaging, structured, and easy to read.`;

    if (currentModule) systemPrompt += `\nThe student is currently on Module ${currentModule}.`;
    if (currentTopic) systemPrompt += ` Topic: "${currentTopic}".`;

    let messages = [{ role: 'system', content: systemPrompt }];

    if (mode === 'explain_circuit' && ops && nQubits) {
      const sorted = [...ops].filter((o: any) => o.gate !== 'M').sort((a: any, b: any) => a.col - b.col);
      const gateSeqStr = sorted.map((op: any, idx: number) => {
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

      messages = [
        { role: 'system', content: 'You are an expert Quantum Computing AI Tutor embedded in QuantumLearn. You provide clear, beautiful, structured quantum circuit explanations in markdown.' },
        { role: 'user', content: prompt }
      ];
    } else {
      const recentHistory = chatHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text || msg.content || '',
        });
      }
      messages.push({ role: 'user', content: userMessage || '' });
    }

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey.trim()}`,
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

        if (!response.ok) continue;

        const data = await response.json();
        let rawText = data.choices?.[0]?.message?.content || '';
        let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        if (cleaned) {
          return new Response(
            JSON.stringify({ text: cleaned }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      } catch (err) {
        console.warn(`Edge Function Groq request failed for model ${model}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate response from AI models.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
