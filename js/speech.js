// js/speech.js – Web Speech API (IIFE namespace)
(function(exports) {
  'use strict';

  let frVoice = null;
  let voicesReady = false;

  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      frVoice = voices.find(v => v.lang === 'fr-FR') ||
                voices.find(v => v.lang.startsWith('fr')) || null;
      voicesReady = true;
    }
  }

  exports.initSpeech = function() {
    loadVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  };

  exports.speak = function(text) {
    if (!window.speechSynthesis) return null;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'fr-FR';
    utter.rate = 0.85;
    utter.pitch = 1.05;
    if (voicesReady && frVoice) utter.voice = frVoice;
    window.speechSynthesis.speak(utter);
    return utter;
  };

  exports.stopSpeech = function() { window.speechSynthesis.cancel(); };

})(window.Speech = window.Speech || {});
