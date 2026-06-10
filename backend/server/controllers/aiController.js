exports.tripPlan = (req, res) => {
  try {
    const destination = req.body && req.body.destination;

    if (!destination) {
      return res.status(400).json({
        message: 'Destination is required',
      });
    }

    res.json({
      destination: String(destination).trim(),

      days: 3,

      activities: ['city tour', 'local food', 'nature exploration'],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate trip plan',
    });
  }
};

exports.luggage = (req, res) => {
  try {
    const destination = req.body && req.body.destination;

    if (!destination) {
      return res.status(400).json({
        message: 'Destination is required',
      });
    }

    res.json({
      items: ['passport', 'phone charger', 'camera', 'powerbank', 'extra clothes'],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate luggage checklist',
    });
  }
};

const buildFallbackReply = (messages = []) => {
  const latestUserMessage = [...messages].reverse().find((item) => item.role === 'user');
  const text =
    latestUserMessage && latestUserMessage.content ? String(latestUserMessage.content) : '';

  return `I can help with that. I currently cannot reach the AI provider. Here is a quick travel-focused suggestion for your request: ${text || 'Share your destination, budget, and number of days.'}`;
};

const parseOpenAIErrorPayload = (rawText) => {
  if (!rawText) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawText);
    return parsed && parsed.error ? parsed.error : null;
  } catch (error) {
    return null;
  }
};

const createProviderError = (status, rawText) => {
  const parsedError = parseOpenAIErrorPayload(rawText);
  const providerMessage =
    parsedError && parsedError.message
      ? String(parsedError.message)
      : `OpenAI request failed with status ${status}`;

  const error = new Error(providerMessage);
  error.status = status;
  error.code = parsedError && parsedError.code ? String(parsedError.code) : null;
  error.type = parsedError && parsedError.type ? String(parsedError.type) : null;
  return error;
};

const createChatCompletion = async (messages) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      usedFallback: true,
      content: buildFallbackReply(messages),
    };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  const payload = {
    model,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content:
          'You are TravelGPT, a practical travel assistant. Give concise, actionable answers with clear steps and useful tips.',
      },
      ...messages,
    ],
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw createProviderError(response.status, text);
  }

  const data = await response.json();
  const content =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;

  if (!content) {
    throw new Error('OpenAI response did not include message content');
  }

  return {
    usedFallback: false,
    content: String(content),
  };
};

exports.chat = async (req, res) => {
  try {
    const rawMessages = req.body && req.body.messages;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return res.status(400).json({
        message: 'messages array is required',
      });
    }

    const normalizedMessages = rawMessages
      .map((item) => ({
        role: item && item.role ? String(item.role) : '',
        content: item && item.content ? String(item.content).trim() : '',
      }))
      .filter((item) => item.content && (item.role === 'user' || item.role === 'assistant'))
      .slice(-12);

    if (normalizedMessages.length === 0) {
      return res.status(400).json({
        message: 'At least one valid chat message is required',
      });
    }

    const completion = await createChatCompletion(normalizedMessages);

    res.json({
      reply: completion.content,
      fallback: completion.usedFallback,
    });
  } catch (error) {
    const messageText = String(error && error.message ? error.message : '');
    const statusCode = Number(error && error.status);
    const errorCode = String(error && error.code ? error.code : '');
    const errorType = String(error && error.type ? error.type : '');

    const quotaExceeded =
      errorCode === 'insufficient_quota' ||
      errorType === 'insufficient_quota' ||
      messageText.toLowerCase().includes('exceeded your current quota');

    if (quotaExceeded) {
      console.warn('AI chat fallback: OpenAI quota exceeded');
      return res.json({
        reply:
          'AI service is temporarily unavailable because API quota is exhausted. Please try again later or update billing credits.',
        fallback: true,
      });
    }

    const rateLimited =
      statusCode === 429 ||
      errorType === 'rate_limit_exceeded' ||
      errorCode === 'rate_limit_exceeded';

    if (rateLimited) {
      console.warn('AI chat fallback: OpenAI rate limited request');
      return res.json({
        reply: 'AI service is busy right now. Please retry in a few moments.',
        fallback: true,
      });
    }

    console.error('AI chat error:', messageText || 'Unknown AI provider error');

    res.json({
      reply: buildFallbackReply(req.body && req.body.messages),
      fallback: true,
    });
  }
};
