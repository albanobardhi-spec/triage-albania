// frontend/js/voice.js
// Web Speech API for voice greetings

class VoiceGreeting {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.preferredVoice = null;
    
    // Load voices
    if (this.synthesis) {
      setTimeout(() => {
        this.voices = this.synthesis.getVoices();
        this.preferredVoice = this.voices.find(v => 
          v.name.includes('Google UK') || 
          v.name.includes('Samantha') ||
          v.name.includes('Female')
        );
      }, 100);
    }
  }

  // Generate greeting based on time and user
  generateGreeting(name = '', timeOfDay = null) {
    const hour = timeOfDay || new Date().getHours();
    let greeting = '';
    
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    
    if (name) greeting += `, ${name}`;
    
    // Add Albanian flavor
    const albanianPhrases = [
      'Mirë se vini në Shqipëri!', // Welcome to Albania
      'Gëzuar që po na vizitoni!', // Happy you're visiting us
      'Shijoni bukuritë tona!',    // Enjoy our beauties
      'Zemra e Shqipërisë ju pret!' // The heart of Albania awaits you
    ];
    
    const randomPhrase = albanianPhrases[Math.floor(Math.random() * albanianPhrases.length)];
    const fullGreeting = `${greeting}! ${randomPhrase} The Land of Eagles welcomes you.`;
    
    return fullGreeting;
  }

  // Speak the greeting
  speak(greeting, options = {}) {
    if (!this.synthesis) {
      console.log('Speech synthesis not supported');
      return Promise.reject('Speech synthesis not supported');
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(greeting);
      
      // Configure voice
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.1;
      utterance.volume = options.volume || 1;
      utterance.lang = 'en-US';
      
      utterance.onend = resolve;
      utterance.onerror = resolve;
      
      this.synthesis.speak(utterance);
    });
  }

  // Quick welcome function
  async welcome(name = '') {
    const greeting = this.generateGreeting(name);
    await this.speak(greeting);
    return greeting;
  }

  // Cultural tip of the day
  async culturalTip() {
    const tips = [
      'In Albania, nodding your head means "no" and shaking means "yes" - it\'s the opposite of most countries!',
      'Coffee culture is sacred here - never rush a coffee meeting with locals.',
      'When invited to someone\'s home, bring a small gift like sweets or flowers.',
      'The double-headed eagle on the flag represents the north and south of Albania.',
      'Albanians nod to say no and shake their heads for yes - remember this!',
      'Besa is the Albanian code of honor - keeping promises is sacred.',
      'Iso-polyphony is UNESCO-listed and unique to Albania.'
    ];
    
    const tip = tips[Math.floor(Math.random() * tips.length)];
    await this.speak('Did you know? ' + tip);
    return tip;
  }
}

// Export singleton
const voice = new VoiceGreeting();
export default voice;