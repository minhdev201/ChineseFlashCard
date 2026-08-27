// ==========================================
// Chinese Flashcard - Chrome Dark Theme Extension
// Default Synced Account: minhdev201@gmail.com
// ==========================================

const CONFIG = {
  SUPABASE_URL: 'https://mrqqmlslxoezuffvqzqa.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXFtbHNseG9lenVmZnZxenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNzU5MTcsImV4cCI6MjEwMDk1MTkxN30.lU5gwpR5Xpkjbw9OjznhXGbw_lawlV-kFKFV_xYdNVc',

  // Default Account Credentials for automatic background synchronization
  AUTH: {
    email: 'minhdev201@gmail.com',
    password: 'Minh040501a@A',
  },

  // Fallback words if offline and cache is empty
  FALLBACK_WORDS: [
    { hanzi: '海鲜', pinyin: 'hǎixiān', meaning: 'Hải sản' },
    { hanzi: '客厅', pinyin: 'Kètīng', meaning: 'Phòng khách' },
    { hanzi: '汉语', pinyin: 'hànyǔ', meaning: 'Tiếng Hán' },
    { hanzi: '学习', pinyin: 'xué xí', meaning: 'Học tập' },
    { hanzi: '中国', pinyin: 'zhōng guó', meaning: 'Trung Quốc' },
    { hanzi: '老师', pinyin: 'lǎo shī', meaning: 'Giáo viên' },
    { hanzi: '学生', pinyin: 'xué shēng', meaning: 'Học sinh' },
    { hanzi: '朋友', pinyin: 'péng yǒu', meaning: 'Bạn bè' },
    { hanzi: '吃饭', pinyin: 'chī fàn', meaning: 'Ăn cơm' },
    { hanzi: '喜欢', pinyin: 'xǐ huan', meaning: 'Thích' },
  ],

  CACHE_KEY_WORDS: 'cfc_unremembered_words_minhdev',
  CACHE_KEY_AUTH: 'cfc_auth_session_minhdev',
};

// ==========================================
// Storage Helper
// ==========================================
const Storage = {
  async get(key) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (res) => resolve(res[key] || null));
      });
    }
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set error:', e);
    }
  },

  async remove(key) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], resolve);
      });
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage remove error:', e);
    }
  },
};

// ==========================================
// DOM Elements (Only Interactive Vocabulary Elements)
// ==========================================
const elements = {
  vocabCardArea: document.getElementById('vocabCardArea'),
  loadingState: document.getElementById('loadingState'),
  vocabCard: document.getElementById('vocabCard'),
  hanzi: document.getElementById('hanzi'),
  pinyin: document.getElementById('pinyin'),
  meaning: document.getElementById('meaning'),
  blurArea: document.getElementById('blurArea'),

  speakBtn: document.getElementById('speakBtn'),
  markRememberedBtn: document.getElementById('markRememberedBtn'),
  nextBtn: document.getElementById('nextBtn'),
};

// ==========================================
// State
// ==========================================
let currentWord = null;
let wordPool = [];
let session = null;
let isRevealed = false;

// ==========================================
// TTS Audio Pronunciation
// ==========================================
function speakHanzi(text) {
  if (!text || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(
    (v) => v.lang.includes('zh') || v.lang.includes('cmn') || v.name.includes('Chinese')
  );
  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// ==========================================
// Supabase Background Authentication & Sync
// ==========================================

/**
 * Perform background sign-in
 */
async function autoSignIn() {
  const url = `${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: CONFIG.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: CONFIG.AUTH.email,
      password: CONFIG.AUTH.password,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to auto-authenticate');
  }

  const data = await res.json();
  const authData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  };

  session = authData;
  await Storage.set(CONFIG.CACHE_KEY_AUTH, authData);
  return authData;
}

/**
 * Fetch unremembered words from Supabase for minhdev201@gmail.com
 */
async function fetchUserUnrememberedWords(accessToken) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/vocab?select=id,hanzi,pinyin,meaning,memory_bucket&memory_bucket=eq.unremembered&order=created_at.desc`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      const newAuth = await autoSignIn();
      return fetchUserUnrememberedWords(newAuth.accessToken);
    }
    throw new Error(`HTTP Error ${res.status}`);
  }

  let words = await res.json();

  if (!words || words.length === 0) {
    const allUrl = `${CONFIG.SUPABASE_URL}/rest/v1/vocab?select=id,hanzi,pinyin,meaning,memory_bucket&limit=100`;
    const allRes = await fetch(allUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (allRes.ok) {
      words = await allRes.json();
    }
  }

  return words || [];
}

/**
 * Mark a word as remembered in Supabase
 */
async function markWordRememberedInSupabase(wordId, accessToken) {
  if (!wordId || !accessToken) return;
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/vocab?id=eq.${wordId}`;
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      memory_bucket: 'flashcard',
      last_reviewed_at: new Date().toISOString().slice(0, 10),
    }),
  });
}

// ==========================================
// UI Rendering
// ==========================================

function showVocabCard(word) {
  if (!word) return;

  currentWord = word;
  isRevealed = false;

  elements.hanzi.textContent = word.hanzi;
  elements.pinyin.textContent = word.pinyin;
  elements.meaning.textContent = word.meaning;

  // Reset blur states (both start blurred)
  elements.pinyin.classList.add('blurred');
  elements.pinyin.classList.remove('revealed');
  elements.meaning.classList.add('blurred');
  elements.meaning.classList.remove('revealed');

  elements.loadingState.classList.add('hidden');
  elements.vocabCard.classList.remove('hidden');
}

function getRandomWord() {
  const list = wordPool && wordPool.length > 0 ? wordPool : CONFIG.FALLBACK_WORDS;
  if (list.length === 1) return list[0];

  let nextWord;
  let attempts = 0;
  do {
    const idx = Math.floor(Math.random() * list.length);
    nextWord = list[idx];
    attempts++;
  } while (currentWord && nextWord.hanzi === currentWord.hanzi && attempts < 10);

  return nextWord;
}

function nextWord() {
  const word = getRandomWord();
  showVocabCard(word);
}

/**
 * Sync in background with Supabase
 */
async function backgroundSync() {
  try {
    if (!session || !session.accessToken) {
      await autoSignIn();
    }
    const words = await fetchUserUnrememberedWords(session.accessToken);
    if (words && words.length > 0) {
      wordPool = words;
      await Storage.set(CONFIG.CACHE_KEY_WORDS, words);
      if (!currentWord || CONFIG.FALLBACK_WORDS.some(w => w.hanzi === currentWord.hanzi && !words.some(uw => uw.hanzi === w.hanzi))) {
        nextWord();
      }
    }
  } catch (err) {
    console.warn('Background sync error:', err);
    try {
      const newAuth = await autoSignIn();
      const words = await fetchUserUnrememberedWords(newAuth.accessToken);
      if (words && words.length > 0) {
        wordPool = words;
        await Storage.set(CONFIG.CACHE_KEY_WORDS, words);
      }
    } catch (e) {
      console.warn('Auto-auth retry error:', e);
    }
  }
}

// ==========================================
// Event Handlers
// ==========================================

function handleSpeak() {
  if (currentWord && currentWord.hanzi) {
    speakHanzi(currentWord.hanzi);
  }
}

async function handleMarkRemembered() {
  if (!currentWord) return;

  const rememberedWord = currentWord;
  // Remove immediately from active wordPool
  wordPool = wordPool.filter((w) => w.hanzi !== rememberedWord.hanzi);
  await Storage.set(CONFIG.CACHE_KEY_WORDS, wordPool);

  // Next word
  nextWord();

  // Sync update to Supabase
  if (rememberedWord.id && session && session.accessToken) {
    try {
      await markWordRememberedInSupabase(rememberedWord.id, session.accessToken);
    } catch (e) {
      console.warn('Failed to update remembered status on server:', e);
    }
  }
}

function toggleRevealMeaning() {
  isRevealed = !isRevealed;
  if (isRevealed) {
    elements.pinyin.classList.remove('blurred');
    elements.pinyin.classList.add('revealed');
    elements.meaning.classList.remove('blurred');
    elements.meaning.classList.add('revealed');
  } else {
    elements.pinyin.classList.add('blurred');
    elements.pinyin.classList.remove('revealed');
    elements.meaning.classList.add('blurred');
    elements.meaning.classList.remove('revealed');
  }
}

function handleKeyboard(e) {
  // Next word on Space
  if (e.code === 'Space') {
    e.preventDefault();
    nextWord();
    return;
  }

  // Pronounce on P key
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    handleSpeak();
    return;
  }
}

// ==========================================
// Initialization
// ==========================================

async function init() {
  // Bind UI Events for vocabulary area
  elements.nextBtn.addEventListener('click', nextWord);
  elements.speakBtn.addEventListener('click', handleSpeak);
  elements.hanzi.addEventListener('click', handleSpeak);
  elements.blurArea.addEventListener('click', toggleRevealMeaning);
  elements.markRememberedBtn.addEventListener('click', handleMarkRemembered);

  document.addEventListener('keydown', handleKeyboard);

  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // 1. Immediately load and display cached words for instantaneous tab open
  try {
    session = await Storage.get(CONFIG.CACHE_KEY_AUTH);
    const cachedWords = await Storage.get(CONFIG.CACHE_KEY_WORDS);

    if (cachedWords && Array.isArray(cachedWords) && cachedWords.length > 0) {
      wordPool = cachedWords;
    } else {
      wordPool = CONFIG.FALLBACK_WORDS;
    }

    nextWord();
  } catch (e) {
    console.error('Init error:', e);
    wordPool = CONFIG.FALLBACK_WORDS;
    nextWord();
  }

  // 2. Perform silent background sync with Supabase
  backgroundSync();
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
