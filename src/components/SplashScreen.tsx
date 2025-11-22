import React, { useEffect } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  useEffect(() => {
    const id = setTimeout(onDone, 1200); // 1.2s splash
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center">
      {/* Crown / logo */}
      <img
        src="/images/empire-logo.png" // put a logo file here
        alt="Empire VC"
        className="w-32 h-32 object-contain animate-fade-in"
      />
      <div className="mt-3 text-amber-300 font-semibold tracking-[0.25em] text-xs uppercase">
        WORKOUT HUB
      </div>
    </div>
  );
};

export default SplashScreen;
