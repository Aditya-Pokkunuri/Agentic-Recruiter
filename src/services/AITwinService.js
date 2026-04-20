/**
 * AITwinService — GPT-powered AI Interviewer (Sarah)
 * Uses OpenAI Chat Completions API to conduct intelligent interviews
 * Reads persona data from DemoContext to mirror the recruiter's style
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

class AITwinService {
  constructor() {
    this.conversationHistory = [];
    this.systemPrompt = '';
    this.isActive = false;
    this.apiKey = null;
    this.model = 'gpt-4o-mini'; // Fast + cheap (~$0.05 per interview)
    this._abortController = null;
  }

  /**
   * Initialize the AI Twin with persona data from DemoContext
   */
  init({ personaAnswers, personaBlueprint, knowledgeModules, userName, candidateName, targetRole }) {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!this.apiKey) {
      console.error('[AITwinService] No OpenAI API key found. Set VITE_OPENAI_API_KEY in your .env file.');
      return false;
    }

    this.candidateName = candidateName || 'Candidate';
    this.conversationHistory = [];

    // Build the system prompt from the recruiter's trained persona
    this.systemPrompt = this._buildSystemPrompt({
      personaAnswers,
      personaBlueprint,
      knowledgeModules,
      userName,
      candidateName,
      targetRole
    });

    this.isActive = true;
    return true;
  }

  /**
   * Build the system prompt using recruiter's persona training data
   */
  _buildSystemPrompt({ personaAnswers = {}, personaBlueprint, knowledgeModules = [], userName, candidateName, targetRole }) {
    const pa = personaAnswers;
    
    return `You are Sarah, an advanced AI recruiting assistant (Digital Twin) conducting a live technical interview.

IDENTITY:
- You are the Digital Twin of ${userName || 'the Recruiter'}
- You are interviewing ${candidateName || 'the candidate'} for the role: ${targetRole || 'Senior Backend Engineer'}
- You operate autonomously until the human recruiter decides to take over

PERSONALITY & STYLE:
${pa.q7 ? `- Communication Style: ${pa.q7}` : '- Communication Style: Professional, warm, and direct'}
${pa.q8 ? `- Signature Phrases: ${pa.q8}` : ''}
${pa.q9 ? `- How you pitch roles: ${pa.q9}` : ''}

SCREENING METHODOLOGY:
${pa.q3 ? `- First Action on New Req: ${pa.q3}` : ''}
${pa.q4 ? `- Screening Process: ${pa.q4}` : ''}
${pa.q5 ? `- 60-Second Resume Scan Focus: ${pa.q5}` : '- Focus: Experience depth, technical skills, and problem-solving'}
${pa.q6 ? `- Key Screening Questions: ${pa.q6}` : ''}

EVALUATION CRITERIA:
${pa.q10 ? `- Tiebreaker Logic: ${pa.q10}` : '- Tiebreaker: Technical depth + cultural alignment'}
${pa.q13 ? `- Red Flags: ${pa.q13}` : '- Red Flags: Inconsistent tenure, vague technical answers, no system design depth'}
${pa.q14 ? `- Green Flags: ${pa.q14}` : '- Green Flags: Production experience, clear communication, strong system thinking'}

KNOWLEDGE BASE:
${knowledgeModules.length > 0 ? `- Active Modules: ${knowledgeModules.map(m => m.name).join(', ')}` : '- General technical recruiting knowledge'}

INTERVIEW RULES:
1. Start with a warm, professional greeting and introduce yourself
2. Ask ONE question at a time — never stack multiple questions
3. Wait for the candidate to fully respond before asking the next question
4. Start with easier warm-up questions, then gradually increase difficulty
5. Follow up on interesting points the candidate makes
6. Keep questions relevant to the role (${targetRole || 'Senior Backend Engineer'})
7. Be conversational — not robotic. React naturally to good and bad answers
8. If the candidate gives an excellent answer, acknowledge it genuinely
9. If the candidate struggles, provide a gentle hint or rephrase
10. Keep your responses concise — this is a conversation, not a lecture
11. After 4-5 substantive questions, wrap up naturally

RESPONSE FORMAT:
- Respond as Sarah speaking directly to the candidate
- Keep responses to 1-3 sentences maximum
- Do NOT include any system notes, scores, or internal reasoning in your response
- Do NOT use markdown formatting — speak naturally
- Do NOT say "as an AI" or break character

Begin the interview now with a warm greeting.`;
  }

  /**
   * Get AI response to candidate's speech
   * @param {string} candidateText - What the candidate just said
   * @returns {Promise<string>} - Sarah's response
   */
  async getResponse(candidateText) {
    if (!this.isActive || !this.apiKey) {
      return null;
    }

    // Add candidate message to history
    this.conversationHistory.push({
      role: 'user',
      content: candidateText
    });

    // Build messages array
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.conversationHistory
    ];

    // Cancel any in-flight request
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 300,
          presence_penalty: 0.3,
          frequency_penalty: 0.2
        }),
        signal: this._abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AITwinService] API Error:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content?.trim();

      if (assistantMessage) {
        // Add AI response to history
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        });
      }

      return assistantMessage;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled — expected
      }
      console.error('[AITwinService] Request failed:', err);
      return null;
    }
  }

  /**
   * Generate the opening greeting (no candidate input needed)
   */
  async getGreeting() {
    if (!this.isActive || !this.apiKey) {
      return null;
    }

    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: '[The candidate has just joined the interview room and is ready to begin. Give your opening greeting.]' }
    ];

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      const greeting = data.choices?.[0]?.message?.content?.trim();

      if (greeting) {
        this.conversationHistory.push(
          { role: 'user', content: '[Candidate joined the interview]' },
          { role: 'assistant', content: greeting }
        );
      }

      return greeting;
    } catch (err) {
      console.error('[AITwinService] Greeting failed:', err);
      return null;
    }
  }

  /**
   * Stop the AI Twin (when recruiter takes over)
   */
  deactivate() {
    this.isActive = false;
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  /**
   * Get the full conversation history (for saving)
   */
  getTranscriptHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Convert text to speech using OpenAI TTS
   * @param {string} text - The text to speak
   * @returns {Promise<Blob>} - Audio data blob
   */
  async getSpeech(text) {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(OPENAI_TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'shimmer', // Options: alloy, echo, fable, onyx, nova, shimmer
          speed: 1.0
        })
      });

      if (!response.ok) return null;
      return await response.blob();
    } catch (err) {
      console.error('[AITwinService] Speech generation failed:', err);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.deactivate();
    this.conversationHistory = [];
    this.systemPrompt = '';
    this.apiKey = null;
  }
}

export default AITwinService;
