"use client";

interface StoreButtonProps {
  type: "apple" | "google";
  url?: string;
  onUnavailableClick?: () => void;
}

export default function StoreButton({ type, url, onUnavailableClick }: StoreButtonProps) {
  const isAvailable = !!url;

  const appleIcon = (
    <svg viewBox="0 0 384 512" width="26" height="26" fill="#fff">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-111.1-59.4-139.8zM256 64.4c0-22.1-8.1-41-24.3-56.7C215.6 8.1 198.3 0 177.9 0c-.7 0-3.1.2-4.6.8-16.8 5.5-30 16.8-39.2 33.4-9.2 16.6-13.3 33.9-12.3 51.8.7 19.1 7.9 35.6 21.5 49.4 13.2 13.2 29.2 20.4 48.2 21.1.4 0 .9.1 1.4.1 18.6 0 34.7-6.8 48.6-20.4 12.3-12.2 19.5-27.3 21.4-45.3z"/>
    </svg>
  );

  const googleIcon = (
    <svg viewBox="0 0 73 73" width="26" height="26">
      <path d="M36.68,34.37l-18.85,20h0c.58,2.18,2.57,3.77,4.92,3.77.94,0,1.82-.25,2.58-.71l.05-.04,21.21-12.23-9.93-10.82h.02v.02Z" fill="#ea4335"/>
      <path d="M55.74,30.98h-.02l-9.15-5.33-10.32,9.19,10.35,10.35,9.12-5.26c1.59-.87,2.67-2.55,2.67-4.48s-1.06-3.61-2.66-4.46h0v-.02Z" fill="#fbbc04"/>
      <path d="M17.82,16.43c-.11.42-.18.85-.18,1.31v35.35c0,.46.05.89.18,1.31l19.49-19.49s-19.49-18.48-19.49-18.48Z" fill="#4285f4"/>
      <path d="M36.82,35.4l9.75-9.75-21.19-12.28c-.76-.46-1.66-.73-2.64-.73-2.35,0-4.34,1.61-4.92,3.77h0l18.99,18.98h0v.02Z" fill="#34a853"/>
    </svg>
  );

  return (
    <button
      onClick={() => {
        if (isAvailable && url) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          onUnavailableClick?.();
        }
      }}
      disabled={false}
      aria-label={type === "apple" ? "Baixar na App Store" : "Baixar no Google Play"}
      className={`
        relative inline-flex items-center gap-3 px-4 py-3 rounded-[12px] bg-black text-white
        border border-white/20
        transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-white/30
        ${isAvailable
          ? "cursor-pointer hover:bg-gray-900 hover:scale-[1.02] active:scale-[0.98]"
          : "cursor-not-allowed opacity-50"
        }
      `}
    >
      {type === "apple" ? appleIcon : googleIcon}
      <div className="flex flex-col items-start text-left leading-none">
        <span className="text-[11px] sm:text-[12px] font-medium text-white/70">
          {type === "apple" ? "Baixe na" : "Disponível no"}
        </span>
        <span className="text-[18px] sm:text-[20px] font-semibold text-white -mt-0.5 whitespace-nowrap">
          {type === "apple" ? "App Store" : "Google Play"}
        </span>
      </div>
      {!isAvailable && (
        <span className="absolute -top-2 -right-2 bg-[#FF6B00] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
          Em breve
        </span>
      )}
    </button>
  );
}
