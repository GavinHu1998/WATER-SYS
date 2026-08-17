const talkButton = document.getElementById('talkButton');
const statusEl = document.getElementById('status');
const answerEl = document.getElementById('answer');
const heardEl = document.getElementById('heard');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

if (!SpeechRecognition) {
  statusEl.textContent = 'Unsupported browser';
  answerEl.textContent = 'Please use Google Chrome or another browser that supports Speech Recognition.';
  talkButton.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    listening = true;
    talkButton.classList.add('listening');
    statusEl.textContent = 'Listening';
    answerEl.textContent = '';
    heardEl.textContent = 'Speak now...';
  };

  recognition.onresult = async (event) => {
    const question = event.results[0][0].transcript.trim();
    heardEl.textContent = `You: ${question}`;
    await askAI(question);
  };

  recognition.onerror = (event) => {
    statusEl.textContent = 'Error';
    answerEl.textContent = event.error === 'not-allowed'
      ? 'Microphone permission was denied.'
      : `Speech recognition error: ${event.error}`;
    resetButton();
  };

  recognition.onend = () => {
    listening = false;
    talkButton.classList.remove('listening');
  };
}

talkButton.addEventListener('click', () => {
  if (!recognition || listening) return;
  window.speechSynthesis.cancel();
  heardEl.textContent = '';
  try {
    recognition.start();
  } catch (error) {
    console.error(error);
  }
});

async function askAI(question) {
  statusEl.textContent = 'Thinking';
  talkButton.disabled = true;

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');

    answerEl.textContent = data.answer;
    speak(data.answer);
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'Error';
    answerEl.textContent = 'I could not connect to the AI service. Please check the server console.';
    resetButton();
  }
}

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    statusEl.textContent = 'Speaking';
  };

  utterance.onend = () => {
    resetButton();
  };

  utterance.onerror = () => {
    resetButton();
  };

  window.speechSynthesis.speak(utterance);
}

function resetButton() {
  talkButton.disabled = false;
  talkButton.classList.remove('listening');
  listening = false;
  if (statusEl.textContent !== 'Error') statusEl.textContent = 'Ready';
}
