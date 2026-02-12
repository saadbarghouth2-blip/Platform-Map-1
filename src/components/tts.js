export function speakArabic(text){
  try{
    if(!("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices?.() || [];
    const ar = voices.find(v => (v.lang || "").toLowerCase().startsWith("ar"));
    if(ar) u.voice = ar;
    u.lang = ar?.lang || "ar-EG";
    u.rate = 0.95;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
    return true;
  }catch{
    return false;
  }
}

export function stopSpeak(){
  try{ window.speechSynthesis.cancel(); }catch{}
}
