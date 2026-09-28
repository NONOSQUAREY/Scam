import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { PERSONALITIES_DATABASE, getRandomPersonality } from './src/utils/personalities.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Primary model requested by user: Gemini 2.5 Flash-Lite
const PRIMARY_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const GENERAL_MODEL = 'gemini-3.8-flash';
const TTS_MODEL = 'gemini-3.1-flash-tts-preview';

// Helper to safely call Gemini with fallback
async function callGeminiGenerate(prompt: string, systemInstruction?: string, responseSchema?: any) {
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL, GENERAL_MODEL];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {
        temperature: 0.9,
      };
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (responseSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Attempt with ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate content with Gemini');
}

// Procedural Fallback Generator using 100+ authentic characters
function generateRandomCallerProcedural(shiftDay: number = 1) {
  const chosen = getRandomPersonality();
  const cardBrands = ['Visa Signature', 'Mastercard World Elite', 'Chase Sapphire', 'Capital One Venture', 'Amex Gold', 'Discover It'];
  const randomBrand = cardBrands[Math.floor(Math.random() * cardBrands.length)];

  // Generate realistic dummy 16-digit card number (test ranges)
  const part1 = '4' + Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(1000 + Math.random() * 9000).toString();
  const part3 = Math.floor(1000 + Math.random() * 9000).toString();
  const part4 = Math.floor(1000 + Math.random() * 9000).toString();
  const fullCardNumber = `${part1} ${part2} ${part3} ${part4}`;
  
  const expMonth = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
  const expYear = String(26 + Math.floor(Math.random() * 6));
  const cvv = String(Math.floor(100 + Math.random() * 900));

  // Day-based earnings cap: Day 1 capped at $2,000, Day 2 at $3,800, etc.
  let balance = 1800;
  if (shiftDay <= 1) {
    balance = Math.floor(650 + Math.random() * 1350); // Capped at $2,000 for Day 1
  } else if (shiftDay === 2) {
    balance = Math.floor(1500 + Math.random() * 2300); // Up to $3,800 for Day 2
  } else if (shiftDay === 3) {
    balance = Math.floor(2800 + Math.random() * 3700); // Up to $6,500 for Day 3
  } else {
    balance = Math.floor(4500 + Math.random() * 10500); // Day 4+
  }

  const code1 = Math.floor(100 + Math.random() * 900);
  const code2 = Math.floor(100 + Math.random() * 900);
  const connectionCode = `${code1}-${code2}`;

  // Strict gender-based voice mapping per user request:
  // Male name -> Male voice ('Fenrir', 'Zephyr', 'Charon')
  // Female name -> Female voice ('Kore', 'Puck')
  let selectedVoice = chosen.voice;
  if (chosen.gender === 'male' && (selectedVoice === 'Kore' || selectedVoice === 'Puck')) {
    selectedVoice = Math.random() > 0.5 ? 'Zephyr' : 'Fenrir';
  } else if (chosen.gender === 'female' && (selectedVoice === 'Fenrir' || selectedVoice === 'Zephyr' || selectedVoice === 'Charon')) {
    selectedVoice = Math.random() > 0.5 ? 'Kore' : 'Puck';
  }

  return {
    id: 'caller_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: chosen.name,
    gender: chosen.gender,
    nameRevealed: false, // Per user request: name is hidden so the player has to ask for it
    archetype: chosen.archetype,
    personality: chosen.personality,
    personalityDescription: chosen.personalityDescription,
    age: chosen.age,
    voice: selectedVoice,
    avatarSeed: Math.floor(Math.random() * 10000),
    avatarColor: ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'][Math.floor(Math.random() * 6)],
    hook: chosen.hook,
    connectionCode: connectionCode,
    connectionCodeRevealed: false,
    card: {
      brand: randomBrand,
      fullNumber: fullCardNumber,
      maskedNumber: `${part1} •••• •••• ${part4}`,
      expiry: `${expMonth}/${expYear}`,
      cvv: cvv,
      balance: balance,
      cardholder: chosen.name.toUpperCase(),
      revealedDigits: 4,
      cvvRevealed: false,
      expiryRevealed: false,
      numberRevealed: false,
    },
    suspicion: chosen.baseSuspicion,
    gullibility: chosen.gullibility || Math.floor(55 + Math.random() * 35),
    patience: chosen.patience || Math.floor(65 + Math.random() * 20),
    dialogueHistory: [{ role: 'caller', text: chosen.hook }],
  };
}

// 1. Generate New Caller Endpoint
app.post('/api/caller/new', async (req, res) => {
  try {
    const shiftDay = Number(req.body?.shiftDay) || 1;

    // Check if we should generate via procedural 100+ database or Gemini
    const useProcedural = Math.random() > 0.35;
    if (useProcedural) {
      return res.json(generateRandomCallerProcedural(shiftDay));
    }

    const sample = getRandomPersonality();
    const maxBalancePrompt = shiftDay === 1 ? 'between 600 and 2000' : shiftDay === 2 ? 'between 1500 and 3800' : 'between 3000 and 8000';
    const prompt = `Generate a realistic caller character for a social engineering / tech support call-center simulator game in the style of "Scam With Your Friends".
The tone should be realistic, diverse, and authentic.
We have over 100 character types: from smart engineers/accountants, to sweet grandparents, busy business owners, and cautious retirees.

GENDER & VOICE REQUIREMENT (STRICT):
- If the caller has a MALE name, gender must be "male", and voice MUST be one of ["Fenrir", "Zephyr", "Charon"].
- If the caller has a FEMALE name, gender must be "female", and voice MUST be one of ["Kore", "Puck"].

Generate JSON matching this structure:
- name: realistic full name (e.g. "${sample.name}" or another believable name)
- gender: "male" or "female"
- archetype: e.g. "${sample.archetype}"
- personality: e.g. "${sample.personality}"
- personalityDescription: 1 short sentence describing how they converse and react.
- age: number between 21 and 80
- voice: If male: "Zephyr", "Fenrir", or "Charon". If female: "Kore" or "Puck".
- hook: natural believable opening line on the phone (1-2 sentences).
- connectionCode: a 6-digit number formatted like "842-194"
- fakeCard:
  - brand: "Visa Signature" | "Mastercard" | "Chase Sapphire" | "Amex"
  - part1: 4 digits (e.g. 4532)
  - part2: 4 digits
  - part3: 4 digits
  - part4: 4 digits
  - expiry: MM/YY (between 26 and 31)
  - cvv: 3 digits
  - balance: integer ${maxBalancePrompt}
- suspicion: starting suspicion between 8 and 30 (keep initial suspicion gentle: 8-15 for sweet, 18-24 for busy/smart, 25-30 for cautious).
- gullibility: integer 40-95
- patience: integer 60-90

Respond ONLY in valid JSON.`;

    const systemInstruction = "You are the character engine for 'Scam With Your Friends' simulation. You must strictly match male voices ('Fenrir', 'Zephyr', 'Charon') to male characters, and female voices ('Kore', 'Puck') to female characters!";

    let rawJson: string;
    try {
      rawJson = await callGeminiGenerate(prompt, systemInstruction);
    } catch (err) {
      console.warn('Gemini caller generation failed, using procedural fallback:', err);
      return res.json(generateRandomCallerProcedural(shiftDay));
    }

    const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const isMale = parsed.gender === 'male' || !parsed.gender;
    let voice = parsed.voice;
    if (isMale && (voice === 'Kore' || voice === 'Puck')) {
      voice = Math.random() > 0.5 ? 'Zephyr' : 'Fenrir';
    } else if (!isMale && (voice === 'Fenrir' || voice === 'Zephyr' || voice === 'Charon')) {
      voice = Math.random() > 0.5 ? 'Kore' : 'Puck';
    }

    const fullNum = `${parsed.fakeCard?.part1 || '4521'} ${parsed.fakeCard?.part2 || '8910'} ${parsed.fakeCard?.part3 || '3341'} ${parsed.fakeCard?.part4 || '9902'}`;
    const masked = `${parsed.fakeCard?.part1 || '4521'} •••• •••• ${parsed.fakeCard?.part4 || '9902'}`;
    const connCode = parsed.connectionCode || `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

    // Clamp balance by shift day
    let rawBalance = Number(parsed.fakeCard?.balance) || 1600;
    if (shiftDay <= 1) rawBalance = Math.min(2000, Math.max(600, rawBalance));
    else if (shiftDay === 2) rawBalance = Math.min(3800, Math.max(1200, rawBalance));

    const caller = {
      id: 'caller_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: parsed.name || sample.name,
      gender: isMale ? 'male' : 'female',
      nameRevealed: false,
      archetype: parsed.archetype || sample.archetype,
      personality: parsed.personality || sample.personality,
      personalityDescription: parsed.personalityDescription || sample.personalityDescription,
      age: parsed.age || sample.age,
      voice: voice,
      avatarSeed: Math.floor(Math.random() * 10000),
      avatarColor: ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'][Math.floor(Math.random() * 6)],
      hook: parsed.hook || sample.hook,
      connectionCode: connCode,
      connectionCodeRevealed: false,
      card: {
        brand: parsed.fakeCard?.brand || 'Visa Signature',
        fullNumber: fullNum,
        maskedNumber: masked,
        expiry: parsed.fakeCard?.expiry || '08/28',
        cvv: String(parsed.fakeCard?.cvv || '412'),
        balance: rawBalance,
        cardholder: (parsed.name || sample.name).toUpperCase(),
        revealedDigits: 4,
        cvvRevealed: false,
        expiryRevealed: false,
        numberRevealed: false,
      },
      suspicion: Math.min(35, Math.max(8, Number(parsed.suspicion) || sample.baseSuspicion)),
      gullibility: Math.min(95, Math.max(30, Number(parsed.gullibility) || sample.gullibility)),
      patience: Math.min(90, Math.max(45, Number(parsed.patience) || sample.patience)),
      dialogueHistory: [{ role: 'caller', text: parsed.hook || sample.hook }],
    };

    res.json(caller);
  } catch (error: any) {
    console.error('Caller creation error:', error);
    res.json(generateRandomCallerProcedural(1));
  }
});

// 2. Caller Dialogue Chat Endpoint (Grounded Scam With Your Friends AI)
app.post('/api/caller/chat', async (req, res) => {
  const { caller, playerMessage } = req.body || {};
  if (!caller || !playerMessage) {
    return res.status(400).json({ error: 'Missing caller or player message' });
  }

  try {
    const isAskingForName = /(name|who are you|speaking with|who is this|identify yourself|call me|what should i call you|what is your)/i.test(playerMessage);

    const systemPrompt = `You are roleplaying as "${caller.name}", a ${caller.age}-year-old ${caller.archetype} in an authentic call-center simulation game ("Scam With Your Friends").
Personality: "${caller.personality || 'Sharp & Analytical'}".
Cognitive Style: "${caller.personalityDescription || 'Observant, polite, and sensible'}".
Current Suspicion Level: ${caller.suspicion}/100.
Current Gullibility Level: ${caller.gullibility}/100.
Your fictional details:
- Name: "${caller.name}" (Initially hidden until the operator asks for your name or identifies you)
- AnyViewer Connection Code: "${caller.connectionCode}"
- Card: ${caller.card.brand}, Number: ${caller.card.fullNumber}, Expiry: ${caller.card.expiry}, CVV: ${caller.card.cvv}, Balance: $${caller.card.balance}

The player is an operator on the support hotline attempting to resolve your billing or computer alert.

BALANCED PERSONALITY & BEHAVIOR GUIDELINES:
1. DO NOT BE OVERLY SUSPICIOUS! Be natural, grounded, and cooperative when treated respectfully.
2. IF SMART / TECH-SAVVY (e.g. Software Engineer, Accountant, Systems Admin, Professor):
   - You are intelligent and articulate. You might ask a smart technical question ("Is this reversal queued in Stripe or merchant ACH?", "Does the refund need my local token cleared?").
   - If the operator gives a competent, smart, or professional explanation (mentioning SSL tokens, merchant gateways, FDIC compliance, server clearing, or protocol): you are satisfied ("Ah, got it, that makes sense", "Understood. Let's do that.") and you readily provide the requested AnyViewer code or card digits! Suspicion drops by -10 to -20.
3. IF SWEET, GULLIBLE, OR BREEZY (Grandmother, Florist, Student):
   - You are warm, cheerful, and trusting. You readily share your name, AnyViewer code, and card details when politely asked.
4. IF BUSY OR DIRECT:
   - You value speed and efficiency. You provide what is requested to get off the phone quickly.
5. WHEN OPERATOR ASKS FOR YOUR NAME:
   - State your full name naturally ("Yes, my name is ${caller.name}." or "It's ${caller.name}.").
   - Set "revealName": true.
6. WHEN OPERATOR ASKS FOR ANYVIEWER CODE:
   - If spoken to professionally, read out your 6-digit code: "${caller.connectionCode}".
   - Set "revealCode": true.
7. WHEN OPERATOR ASKS FOR CARD DETAILS / REFUND REVERSAL:
   - If the operator explains that the card is needed to receive or reverse the refund, you cooperate and provide the numbers.
   - If they ask for the 3-digit CVV, a brief hesitation is okay, but if they explain it is for merchant authorization, provide it!
8. SUSPICION DELTAS:
   - Normal helpful/polite conversation: suspicion change 0 to -8.
   - Professional reassurance ("This is 100% insured", "I am cancelling this right now"): -10 to -20.
   - Smart technical answers to smart callers: -15.
   - Operator being pushy or confusing: slight increase +5 to +10.
   - Only hang up if suspicion reaches 100 or operator directly insults you.

Speak succinctly in 1-2 realistic sentences suitable for voice synthesis.

Return a JSON object with:
- "reply": your spoken response (1-2 realistic sentences).
- "suspicionDelta": integer between -20 (reassured/convinced) and +15 (uncertain).
- "revealName": boolean (did you state your name?)
- "revealCode": boolean (did you read out the AnyViewer code?)
- "revealNumber": boolean (did you state your 16 card numbers?)
- "revealExpiry": boolean (did you state your card expiration?)
- "revealCvv": boolean (did you state the 3 CVV digits?)
- "authorized": boolean (did you agree to authorize the transaction/refund?)
- "hungUp": boolean (did you terminate the call?)`;

    const responseText = await callGeminiGenerate(
      `Caller dialogue history: ${JSON.stringify(caller.dialogueHistory)}\nPlayer says: "${playerMessage}"\nRespond in JSON format as specified.`,
      systemPrompt
    );

    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);

    // If player asked for name and AI didn't set revealName, ensure it is set if name was mentioned
    if (isAskingForName || (result.reply && result.reply.toLowerCase().includes(caller.name.toLowerCase().split(' ')[0]))) {
      result.revealName = true;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Chat error:', error);
    const isAskingName = /(name|who are you|speaking with|who is this|identify yourself)/i.test(playerMessage);
    
    // Grounded fallback response taking personality into account
    let fallbackReply = "I see. Could you walk me through the next step to ensure this charge is cancelled?";
    let revealName = false;
    let suspicionDelta = 0;

    if (isAskingName) {
      revealName = true;
      fallbackReply = `Yes, my name is ${caller.name}. What is our next step to resolve this issue?`;
      suspicionDelta = -5;
    } else if (caller.personality?.includes('Tech') || caller.personality?.includes('Smart') || caller.personality?.includes('Analytical')) {
      fallbackReply = `Understood. I am monitoring the terminal window. Let me know which confirmation parameter you need.`;
      suspicionDelta = -5;
    } else if (caller.suspicion >= 70) {
      fallbackReply = "I just want to be certain this is legitimate before we proceed further. Can you verify this refund?";
      suspicionDelta = 2;
    }

    res.json({
      reply: fallbackReply,
      suspicionDelta: suspicionDelta,
      revealName: revealName,
      revealCode: false,
      revealNumber: false,
      revealExpiry: false,
      revealCvv: false,
      authorized: false,
      hungUp: false,
    });
  }
});

// 3. Realistic TTS Generation (Gemini TTS with high quality audio)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Puck' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    // Limit length for snappy game response
    const cleanText = text.substring(0, 300);

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        audio: base64Audio,
        mimeType: 'audio/pcm;rate=24000',
        sampleRate: 24000,
      });
    }

    res.status(502).json({ error: 'No audio generated by TTS' });
  } catch (error: any) {
    // Return friendly error allowing client to use Web Speech API fallback without breaking
    console.warn('TTS API unavailable, client fallback will be used:', error?.message || error);
    res.status(503).json({ error: 'TTS API unavailable', fallbackToWebSpeech: true });
  }
});

// 4. Boss AI Shift Review & Gameplay Clip Critique Endpoint
app.post('/api/boss/review', async (req, res) => {
  try {
    const { shiftDay = 1, totalMoneyEarned = 0, quota = 2000, quotaMet = false, clips = [], stats = {} } = req.body || {};

    const prompt = `You are Boss Vikram "The Hammer" Henderson, the volatile, funny, high-octane floor manager at an offshore call center simulation game ("Scam With Your Friends").
Your job is to review the operator's shift gameplay and recorded highlight clips!

SHIFT SUMMARY:
- Day: ${shiftDay}
- Quota Target: $${quota}
- Total Extracted: $${totalMoneyEarned}
- Quota Status: ${quotaMet ? 'PASSED (Quota Met)' : 'FAILED (Quota Missed)'}
- Recorded Gameplay Clips: ${JSON.stringify(clips)}

YOUR PERSONA & BEHAVIOR:
1. Volatile & Satirical:
   - When the operator extracted cash or tricked someone smoothly: Laugh hysterically! ("HAHAHAHA! [laughs hysterically] You told him his computer had digital termites and charged $1,500?! I love it!")
   - When the operator failed quota, hesitated, or spiked suspicion: Get furiously mad! ("[slams desk] ARE YOU KIDDING ME?! My grandmother scams faster than you! [screams] Why did you hang up without the CVV?!")
   - Use dynamic stage directions in brackets like [laughs hysterically], [slams desk with coffee mug], [wipes tears of laughter], [facepalms aggressively], or [rubs temples].
2. Review each clip specifically:
   - Give each clip a specific reaction ('laugh', 'mad', or 'proud') and 1-2 funny sentences evaluating that exact moment.

Return JSON ONLY with:
- "bossMood": "laughing_ecstatic" | "furious_screaming" | "smug_proud" | "disappointed_facepalm"
- "headline": punchy headline in ALL CAPS (e.g. "HAHAHA! YOU ABSOLUTE PIRATE!" or "DISASTER ON THE CALL FLOOR!")
- "quote": 1 memorable loud quote with actions in brackets like [laughs hysterically] or [slams desk]
- "overallReview": 2-3 sentences evaluating the shift performance
- "strengths": 2 bullet points on what they did good
- "roasts": 2 humorous roasts on their mistakes or blunders
- "clipCritiques": array of objects with { "clipId": string, "reaction": "laugh" | "mad" | "proud", "comment": string }`;

    const systemInstruction = "You are Boss Vikram Henderson from 'Scam With Your Friends'. You are either laughing uncontrollably at absurd successful tricks or violently mad at blunders. Never be boring or generic.";

    try {
      const rawJson = await callGeminiGenerate(prompt, systemInstruction);
      const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    } catch (aiErr) {
      console.warn('Gemini boss review failed, using grounded fallback:', aiErr);
    }

    // Procedural Fallback if Gemini is unavailable
    const isSuccess = Boolean(quotaMet);
    const fallbackReview = {
      bossMood: isSuccess ? 'laughing_ecstatic' : 'furious_screaming',
      headline: isSuccess ? 'HAHAHA! NOW THAT\'S HOW YOU STRIP A BANK ACCOUNT!' : 'WHAT IN THE NAME OF BROADBAND WAS THAT TRASH?!',
      quote: isSuccess
        ? '[laughs hysterically] HAHAHA! Look at that ledger! You swiped every cent while they thanked you for your customer service! [wipes tear]'
        : '[slams desk with coffee mug] YOU MISSED QUOTA BY MILES! Are you running a charity helpline or a revenue operation?! [facepalms]',
      overallReview: isSuccess
        ? `Day ${shiftDay} was a masterclass in aggressive persuasion. You brought in $${totalMoneyEarned.toLocaleString()} and crushed the $${quota.toLocaleString()} quota.`
        : `Unacceptable performance on Day ${shiftDay}. Target was $${quota.toLocaleString()}, you only scraped $${totalMoneyEarned.toLocaleString()}. You let too many callers off the hook.`,
      strengths: isSuccess
        ? ['Lightning-fast card validation before suspicion caught up', 'Great psychological handling of naive callers']
        : ['At least you stayed on the phone without rage quitting', 'Typed the authorization codes relatively quickly'],
      roasts: isSuccess
        ? ['You almost let that engineer smell the scam on line 2', 'Next time siphon their savings account too, don\'t be shy']
        : ['Hesitated on the 3-digit CVV like it was a live grenade', 'Took 4 minutes to ask for a basic full name'],
      clipCritiques: clips.map((c: any) => ({
        clipId: c.id,
        reaction: isSuccess ? 'laugh' : 'mad',
        comment: isSuccess
          ? `[laughs] Look at this play! Total bamboozle on ${c.callerName || 'the caller'}!`
          : `[screams] Look at this clip! You almost gave THEM money! Wake up!`,
      })),
    };

    res.json(fallbackReview);
  } catch (err: any) {
    console.error('Boss review endpoint error:', err);
    res.status(500).json({ error: 'Failed to generate boss review' });
  }
});

// Setup Vite middleware for development or Static files for production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Scam With Your Friends 2D] Server running on port ${PORT} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer();
