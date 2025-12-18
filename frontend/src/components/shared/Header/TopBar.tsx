import { useState } from "react";
import { X } from "lucide-react";

const TopBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-top_bar text-white text-sm">
      <div className="max-w-[1920px] mx-auto px-4 flex items-center justify-between">
        <div className="flex-1" />
        
        <div className="flex items-center justify-center text-center">
          <span>For Store and Scheme Queries - 9562-916-916</span>
        </div>
        
        <div className="flex-1 flex items-center justify-end">
          <button 
            onClick={() => setIsVisible(false)}
            className="hover:opacity-80 transition-opacity p-1 ml-4"
            aria-label="Close announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;