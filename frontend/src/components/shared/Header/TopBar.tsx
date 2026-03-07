import { useState } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

const TopBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { contact_phone } = useSettings();

  if (!isVisible || !contact_phone) return null;

  return (
    <div className="bg-top_bar text-white text-sm">
      <div className="max-w-[1920px] mx-auto px-4 flex items-center justify-between">
        <div className="flex-1" />
        
        <div className="flex items-center justify-center text-center">
          <span>For queries, call us at <a href={`tel:${contact_phone}`} className="font-semibold hover:underline">{contact_phone}</a></span>
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