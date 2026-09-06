import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { Camera, Mic, PenTool, LogOut, Orbit, Flower2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isFeatureMenuOpen, setIsFeatureMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [moodData, setMoodData] = useState({
    insight: "A golden thought emerged about balance.",
    colors: ['#f59e0b', '#047857', '#9a3412', '#ca8a04'],
    concepts: ['Mindfulness', 'Project X', 'Nature Walk', 'Focus']
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (!isSending && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant') {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isSending]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone access is blocked or unsupported by this browser.");
      return;
    }
    
    try {
      if (isListening) {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
      } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        setIsListening(true);
        recognition.start();
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setMessage(prev => prev + (prev ? " " : "") + transcript);
          setIsListening(false);
        };
        recognition.onerror = (e: any) => {
          setIsListening(false);
          if (e.error === 'no-speech') {
            // Harmless timeout error when no one speaks. Silently handle it.
            return;
          }
          console.error("Speech Error: ", e.error);
          if (e.error === 'not-allowed') alert("Microphone permission denied. Note: The app preview may not have permission to use the mic. Please try opening the app in a new tab.");
        };
        recognition.onend = () => setIsListening(false);
      }
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    
    // Client-side compression to massively speed up uploads and Gemini processing
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      
      try {
        if (!user) return;
        const token = await user.getIdToken(); 
        const response = await fetch('/api/vision/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ imageBase64: compressedBase64 })
        });
        
        if (!response.ok) {
          throw new Error('Server returned ' + response.status);
        }
        
        const data = await response.json();
        if (data.text) {
          setMessage(prev => prev + (prev ? " " : "") + data.text);
        }
      } catch (err) {
        console.error("Scan error:", err);
        alert("Vision scan failed.");
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // reset input
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      setIsScanning(false);
      alert("Failed to read image.");
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleArchiveAndClear = async () => {
    if (!user || chatHistory.length === 0 || isSending) return;
    setIsSending(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript: chatHistory })
      });
      if (response.ok) {
        setChatHistory([]);
        setMoodData({
          insight: 'The spirit, poised at the threshold of expression, seeks its proper channel.',
          colors: ['#e2e8f0', '#fef08a', '#fdf8ff', '#f1f5f9'],
          concepts: ['Anticipation', 'New Beginning', 'Reflection', 'Silence']
        });
      }
    } catch (error) {
      console.error('Error archiving journal:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || isSending) return;

    const userMessage = message;
    setMessage('');
    setIsSending(true);
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch (e) {
          // Ignore JSON parse error if there is none
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      if (data.colors && data.insight && data.concepts) {
        setMoodData({
          insight: data.insight,
          colors: data.colors,
          concepts: data.concepts
        });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: error.message || "Sorry, I couldn't process that request." }]);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#1a362d] flex items-center justify-center text-[#f4eedf] font-serif text-xl tracking-widest">Awakening...</div>;
  }

  if (!user) {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-black">
        <div 
          className="absolute inset-0 z-0 opacity-50 blur-sm scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519682577862-22b62b24e493?auto=format&fit=crop&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 z-0 bg-black/40" />
        
        <div className="relative z-10 bg-[#e8ddcb]/80 backdrop-blur-xl border border-[#e8ddcb]/30 shadow-2xl rounded-2xl p-12 text-center max-w-md mx-4 noise-bg">
          <h1 className="text-4xl font-serif text-[#143026] mb-4">The Whispering Pages</h1>
          <p className="text-[#143026]/70 mb-8 font-sans">Open your digital grimoire.</p>
          <button 
            onClick={handleSignIn}
            className="bg-[#143026] text-[#e8ddcb] px-8 py-3 rounded-full hover:bg-[#1a362d] transition-colors font-serif tracking-wider shadow-lg"
          >
            Enter Sanctuary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', fontFamily: 'serif' }}>
      {/* 1. ABSOLUTE ROOT WRAPPER (Defeats global dark mode overrides) */}
      
      {/* 2. THE MAIN GLASSMORPHIC APP CONTAINER */}
      <div className="bg-[#e8ddcb] lg:bg-[linear-gradient(to_right,#1a362d_20%,#e8ddcb_20%)] relative" style={{ 
        width: '95vw', maxWidth: '1200px', 
        height: '90vh', maxHeight: '850px',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        overflow: 'hidden'
      }}>
        
        {/* Sign out button (moved to root for mobile access) */}
        <button 
          onClick={handleArchiveAndClear}
          disabled={isSending}
          className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 text-[#143026]/60 hover:text-[#143026] transition-colors disabled:opacity-50 z-50"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: MEMORY Loom */}
        <div className="hidden lg:flex flex-col justify-between relative h-full w-[20%] p-8 text-[#e8ddcb] z-0">
          
          <div className="text-center flex-col items-center mt-6 hidden lg:flex">
            <div className="text-lg font-serif mb-1 tracking-wide" style={{ textTransform: 'capitalize' }}>Memory Loom</div>
            <div className="text-[10px] font-sans tracking-widest uppercase text-[#e8ddcb]/70">PAST ECHOES</div>
          </div>
          
          {/* Tree Composite Graphic */}
          <div className="relative w-full flex-1 my-4 flex items-center justify-center">
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 400" preserveAspectRatio="none">
              {/* Organic Curved Trunk and Branches */}
              <path d="M 100 360 C 90 300, 110 250, 100 150 C 90 50, 120 20, 100 0" stroke="#8b6b4a" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Curved Branches */}
              <path d="M 98 250 C 80 230, 50 250, 40 220" stroke="#8b6b4a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 102 210 C 140 200, 150 160, 160 140" stroke="#8b6b4a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 95 160 C 70 140, 50 120, 40 80" stroke="#8b6b4a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 103 280 C 130 300, 160 270, 180 250" stroke="#8b6b4a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 100 320 C 70 330, 40 310, 30 290" stroke="#8b6b4a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            
            {/* Glowing Orbs positioned at branch ends (matched to new paths) */}
            <div className="absolute top-[55%] left-[20%] w-8 h-8 -ml-4 -mt-4 rounded-full bg-[radial-gradient(circle_at_center,_#e2e8f0_0%,_#94a3b8_100%)] shadow-[0_0_25px_10px_rgba(253,224,139,0.3)] backdrop-blur-sm" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '0s' }} />
            <div className="absolute top-[35%] left-[80%] w-10 h-10 -ml-5 -mt-5 rounded-full bg-[radial-gradient(circle_at_center,_#fef08a_0%,_#ca8a04_100%)] shadow-[0_0_25px_10px_rgba(253,224,139,0.3)] backdrop-blur-sm" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '1s' }} />
            <div className="absolute top-[20%] left-[20%] w-8 h-8 -ml-4 -mt-4 rounded-full bg-[radial-gradient(circle_at_center,_#fdf8ff_0%,_#d8b4fe_100%)] shadow-[0_0_25px_10px_rgba(253,224,139,0.3)] backdrop-blur-sm" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '2s' }} />
            <div className="absolute top-[62%] left-[90%] w-12 h-12 -ml-6 -mt-6 rounded-full bg-[radial-gradient(circle_at_center,_#fde08b_0%,_#d97706_100%)] shadow-[0_0_25px_10px_rgba(253,224,139,0.3)] backdrop-blur-sm" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '0.5s' }} />
            <div className="absolute top-[10%] left-[50%] w-10 h-10 -ml-5 -mt-5 rounded-full bg-[radial-gradient(circle_at_center,_#ccfbf1_0%,_#0d9488_100%)] shadow-[0_0_25px_10px_rgba(253,224,139,0.3)] backdrop-blur-sm" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '1.5s' }} />
            <div className="absolute top-[72%] left-[15%] w-10 h-10 -ml-5 -mt-5 rounded-full bg-[radial-gradient(circle_at_center,_#e2e8f0_0%,_#64748b_100%)] shadow-[0_0_25px_10px_rgba(253,224,139,0.3)] backdrop-blur-sm" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '2.5s' }} />
            
          </div>
          
          <div className="text-center flex-col items-center mb-6 hidden lg:flex">
            <div className="text-[10px] font-sans tracking-widest uppercase text-[#e8ddcb]/70">FUTURE SEEDS</div>
          </div>
        </div>

        {/* CENTER COLUMN: THE WHISPERING PAGES */}
        <div className="w-full px-2 lg:px-4 py-4 lg:py-4 z-10" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          <h1 className="text-xl lg:text-3xl text-center text-[#143026] mb-4 lg:mb-6 tracking-widest" style={{ flexShrink: 0, fontFamily: 'serif' }}>THE WHISPERING PAGES</h1>
          
          {/* THE PARCHMENT CARD */}
          <div className="bg-[#f4eedf]/95 lg:bg-[#f4eedf] backdrop-blur-sm lg:backdrop-blur-none" style={{ flex: 1, minHeight: 0, borderRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 2px 15px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '20px', border: '1px solid #dfd6c2', isolation: 'isolate', position: 'relative' }}>
            
            {/* THE ARCHIVIST'S FLOWER (FEATURE MENU) */}
            <div className="absolute top-2 right-4 z-50">
              <button 
                onClick={() => setIsFeatureMenuOpen(!isFeatureMenuOpen)}
                className="p-1 text-[#143026]/70 hover:text-[#d9a05b] transition-colors drop-shadow-sm"
                title="Features"
              >
                {/* Delicate Lotus/Flower SVG */}
                <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C12 2 15 6 15 10C15 13 12 15 12 15C12 15 9 13 9 10C9 6 12 2 12 2ZM12 22C12 22 15 18 15 14C15 11 12 9 12 9C12 9 9 11 9 14C9 18 12 22 12 22ZM2 12C2 12 6 9 10 9C13 9 15 12 15 12C15 12 13 15 10 15C6 15 2 12 2 12ZM22 12C22 12 18 9 14 9C11 9 9 12 9 12C9 12 11 15 14 15C18 15 22 12 22 12Z" opacity="0.8"/>
                  <circle cx="12" cy="12" r="2" fill="#d9a05b"/>
                </svg>
              </button>
              
              {/* TRANSPARENT HUE WINDOW */}
              {isFeatureMenuOpen && (
                <div className="absolute top-10 right-0 w-48 bg-[#e8ddcb]/30 backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl overflow-hidden py-1 animate-fade-in">
                  <button 
                    className="w-full text-left px-4 py-3 text-sm font-serif text-[#143026] hover:bg-white/40 transition-colors"
                    onClick={() => alert("Chat History UI opening...")}
                  >
                    The Archives
                  </button>
                  <button 
                    className="w-full text-left px-4 py-3 text-sm font-serif text-[#143026]/50 hover:bg-white/30 transition-colors"
                    disabled
                  >
                    Visual Whispers (v2)
                  </button>
                </div>
              )}
            </div>

            {/* MOOD LANDSCAPE HEADER */}
            <div className="backdrop-blur-xl border-b border-white/20" style={{ height: '70px', flexShrink: 0, background: '#e8ddcb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
                <div className="absolute inset-0 bg-[#f4eedf]/50 blur-xl z-0" />
                <div className="absolute -top-10 -left-10 w-48 h-48 rounded-[40%_60%_70%_30%] mix-blend-multiply blur-[20px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[0], animationDuration: '4s' }} />
                <div className="absolute top-0 left-1/4 w-56 h-40 rounded-[60%_40%_30%_70%] mix-blend-multiply blur-[25px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[1], animationDuration: '5s' }} />
                <div className="absolute -bottom-10 right-1/4 w-48 h-48 rounded-[30%_70%_70%_30%] mix-blend-multiply blur-[20px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[2], animationDuration: '6s' }} />
                <div className="absolute -top-12 -right-10 w-56 h-56 rounded-[50%_50%_20%_80%] mix-blend-multiply blur-[25px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[3], animationDuration: '7s' }} />
                <div className="z-10 font-sans text-xs tracking-[0.2em] uppercase text-[#143026]/70">Mood Landscape</div>
            </div>

            {/* CHAT SCROLL AREA */}
            <div className="p-4 lg:p-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#f4eedf] to-transparent z-10 pointer-events-none" />
                
                <div className="flex-1 flex flex-col justify-center">
                  {chatHistory.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center opacity-70 my-auto pb-[10vh]">
                        <span className="font-serif text-[22px] text-[#143026] tracking-widest uppercase text-center">WRITE YOUR DAILY WHISPER</span>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => {
                      const isLast = idx === chatHistory.length - 1;
                      return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        ref={isLast ? lastMessageRef : null}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'user' ? (
                          <div 
                            className="text-base leading-relaxed text-[#2c2822] bg-[#dfd6c2] px-5 py-3 rounded-2xl rounded-tr-sm max-w-[75%] self-end text-left shadow-sm"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", textTransform: 'none', letterSpacing: 'normal', fontVariant: 'normal', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
                          >
                            {msg.content}
                          </div>
                        ) : (
                          <div 
                            className="text-lg leading-loose text-[#143026] text-left max-w-[90%]"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", textTransform: 'none', letterSpacing: 'normal', fontVariant: 'normal', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
                          >
                            {msg.content}
                          </div>
                        )}
                      </motion.div>
                      );
                    })
                  )}
                  {isSending && (
                    <div className="flex justify-start px-3 py-3">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-[#143026]/40 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-[#143026]/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-[#143026]/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
            </div>

            {/* INPUT AREA */}
            <div style={{ padding: '16px', background: '#f4eedf', borderTop: '1px solid transparent', flexShrink: 0 }}>
               <div className="transition-all duration-200" style={{ position: 'relative', background: '#fff9f0', borderRadius: '16px', boxShadow: '0 0 15px 3px rgba(253,224,139,0.5)', padding: '4px', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
                  
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                        }
                      }
                    }}
                    placeholder="Whisper to the pages..."
                    className="w-full bg-transparent resize-none focus:outline-none text-base lg:text-lg leading-relaxed text-[#2c2822] placeholder-[#8c8273] pl-4 lg:pl-6 pr-[140px] lg:pr-[150px] py-4 lg:py-5 min-h-[60px] max-h-[65vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", textTransform: 'none', letterSpacing: 'normal', fontVariant: 'normal', wordBreak: 'normal' }}
                    rows={1}
                    disabled={isSending}
                  />
                  
                  {/* Action Icons absolutely positioned */}
                  <div className="absolute bottom-4 lg:bottom-5 right-3 lg:right-5 flex items-center gap-2 lg:gap-4 px-3">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    
                    {isScanning ? (
                      <span className="text-xs text-[#d9a05b] animate-pulse self-center uppercase tracking-widest mr-2 font-serif">Scanning...</span>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:scale-110 transition-transform duration-300 ease-out"
                        title="Lens Scan"
                      >
                        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-6deg)', filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.15))' }}>
                          <rect x="3" y="3" width="18" height="20" rx="1" fill="#F4EEDF" stroke="#D1C7B7" strokeWidth="0.5" />
                          <rect x="5" y="5" width="14" height="11" fill="#2C363F" />
                          <circle cx="12" cy="10.5" r="3.5" fill="#1A1F24" stroke="#4A5568" strokeWidth="1" />
                          <circle cx="13" cy="9.5" r="1" fill="#FFFFFF" opacity="0.6" />
                          <circle cx="17" cy="7" r="0.8" fill="#E53E3E" />
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={toggleListening}
                      className={`transition-all duration-300 ease-out ${isListening ? 'scale-110' : 'hover:scale-110'}`}
                      title="Voice Whisper"
                    >
                      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.15))' }}>
                        <rect x="8" y="2" width="8" height="13" rx="4" fill={isListening ? "#e53e3e" : "#3A5A40"} />
                        <path d="M8 6H16" stroke={isListening ? "#c53030" : "#2C402E"} strokeWidth="1" />
                        <path d="M8 10H16" stroke={isListening ? "#c53030" : "#2C402E"} strokeWidth="1" />
                        <path d="M6 10C6 13.3137 8.68629 16 12 16C15.3137 16 18 13.3137 18 10" stroke="#8B6B4A" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M12 16V20" stroke="#8B6B4A" strokeWidth="1.5" />
                        <path d="M9 22H15" stroke="#8B6B4A" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="12" cy="5" r="1.5" fill={isListening ? "#fff5f5" : "#4A6A50"} />
                      </svg>
                    </button>
                    <div className="w-px h-6 bg-[#143026]/10 mx-1" />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                      className="hover:scale-110 transition-transform duration-300 ease-out disabled:opacity-40 disabled:hover:scale-100"
                      title="Send Whisper"
                    >
                      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(6deg)', filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.15))' }}>
                        <rect x="4" y="3" width="12" height="18" rx="0.5" fill="#E8DDCB" stroke="#D1C7B7" strokeWidth="0.5" />
                        <path d="M4 7H16" stroke="#D1C7B7" strokeWidth="0.5" />
                        <path d="M4 11H16" stroke="#D1C7B7" strokeWidth="0.5" />
                        <path d="M4 15H16" stroke="#D1C7B7" strokeWidth="0.5" />
                        <path d="M4 19H16" stroke="#D1C7B7" strokeWidth="0.5" />
                        <path d="M3 4H5" stroke="#4A5568" strokeWidth="1" strokeLinecap="round" />
                        <path d="M3 8H5" stroke="#4A5568" strokeWidth="1" strokeLinecap="round" />
                        <path d="M3 12H5" stroke="#4A5568" strokeWidth="1" strokeLinecap="round" />
                        <path d="M3 16H5" stroke="#4A5568" strokeWidth="1" strokeLinecap="round" />
                        <path d="M3 20H5" stroke="#4A5568" strokeWidth="1" strokeLinecap="round" />
                        <path d="M18 5L20 7L16 19L14 17L18 5Z" fill="#D69E2E" stroke="#B7791F" strokeWidth="0.5" strokeLinejoin="round" />
                        <path d="M14 17L16 19L13.5 20.5L14 17Z" fill="#ECC94B" stroke="#B7791F" strokeWidth="0.5" strokeLinejoin="round" />
                        <path d="M13.7 19L13.5 20.5L14.7 19.3L13.7 19Z" fill="#2D3748" />
                      </svg>
                    </button>
                  </div>
               </div>
            </div>

          </div> {/* END PARCHMENT CARD */}

          {/* AI INSIGHTS PILL (BOTTOM OF CENTER COLUMN) */}
          <div style={{ margin: '0 auto', flexShrink: 0, width: '85%', maxWidth: '400px', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', borderRadius: '999px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.5)', textAlign: 'center', color: '#143026', zIndex: 10 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>AI Insights</div>
            <div className="whitespace-normal break-words text-center leading-snug px-2 pb-1" style={{ fontSize: '0.85rem' }}>{moodData.insight}</div>
          </div>

        </div> {/* END CENTER COLUMN */}

        {/* RIGHT COLUMN: CONCEPT BLOSSOMS */}
        <div className="hidden lg:flex flex-col justify-between relative h-full w-[20%] p-8 text-[#143026] z-0">
          
          <div className="text-center flex-col items-center mt-6 hidden lg:flex">
            <div className="text-lg font-serif mb-1 tracking-wide" style={{ textTransform: 'capitalize' }}>Concept Blossoms</div>
          </div>
          
          {/* Vine Composite Graphic */}
          <div className="relative w-full flex-1 my-4 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 400" preserveAspectRatio="none">
              {/* Organic Curved Vine Path */}
              <path d="M 120 400 C 140 300, 70 250, 100 150 C 120 50, 100 20, 110 0" stroke="#4a5d23" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Curved Branches to leaves */}
              <path d="M 115 320 C 130 310, 150 300, 160 280" stroke="#4a5d23" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 95 240 C 60 230, 40 200, 50 160" stroke="#4a5d23" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 102 120 C 130 110, 140 90, 150 80" stroke="#4a5d23" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 118 360 C 90 350, 70 340, 60 340" stroke="#4a5d23" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>

            {/* Tag Nodes (Leaves) absolutely positioned */}
            <div className="absolute top-[65%] left-[75%] w-20 h-20 -ml-10 -mt-10 bg-[#2c4a3b] text-[#f4eedf] font-sans text-[12px] flex items-center justify-center text-center shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] p-4 transition-all duration-700 hover:scale-105" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}>
              {moodData.concepts[0] || 'Mindfulness'}
            </div>
            <div className="absolute top-[35%] left-[25%] w-24 h-24 -ml-12 -mt-12 bg-[#8b4531] text-[#f4eedf] font-sans text-[12px] flex items-center justify-center text-center shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] p-4 transition-all duration-700 hover:scale-105" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}>
              {moodData.concepts[1] || 'Project X'}
            </div>
            <div className="absolute top-[15%] left-[80%] w-[88px] h-[88px] -ml-[44px] -mt-[44px] bg-[#7a825b] text-[#f4eedf] font-sans text-[12px] flex items-center justify-center text-center shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] p-4 transition-all duration-700 hover:scale-105" style={{ borderRadius: '50% 50% 20% 80% / 25% 80% 20% 75%' }}>
              {moodData.concepts[2] || 'Nature Walk'}
            </div>
            <div className="absolute top-[85%] left-[30%] w-[72px] h-[72px] -ml-[36px] -mt-[36px] bg-[#8b4531] text-[#f4eedf] font-sans text-[12px] flex items-center justify-center text-center shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] p-4 transition-all duration-700 hover:scale-105" style={{ borderRadius: '70% 30% 50% 50% / 30% 50% 50% 70%' }}>
              {moodData.concepts[3] || 'Focus'}
            </div>
          </div>
          
          <div className="h-10"></div>
        </div>

      </div>
    </div>
  );
}
