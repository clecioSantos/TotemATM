"use client";
import "./styles.css";

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="welcome-container" onClick={onStart}>
      <div className="welcome-content">
        <div className="tap-to-start">
          <span>TOQUE PARA INICIAR</span>
        </div>
      </div>
    </div>
  );
}
