const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

export const getHistory = async (userId) => {
  const response = await fetch(`${API_BASE}/chats/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch chat history');
  return response.json();
};

export const getMessages = async (chatId) => {
  if (!chatId || chatId === "undefined") {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE}/messages/${chatId}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Neural fetch error:", error);
    return [];
  }
};

export const askQuestion = async (messages, userId, chatId = null, mode = null) => {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      user_id: userId,
      chat_id: chatId,
      user_profile: {
        preferences: [],
        level: 'beginner'
      },
      mode: mode
    })
  });
  if (!response.ok) throw new Error('Neural interface communication failure');
  return response.json();
};

export const sendFeedback = async (userId, query, liked, type) => {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      query,
      liked,
      type: type || 'general'
    })
  });
  if (!response.ok) throw new Error('Feedback submission failed');
  return response.json();
};

export const getRecommendations = async (query) => {
  try {
    const response = await fetch(`${API_BASE}/recommendations?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Recommendations fetch error:", error);
    return [];
  }
};

