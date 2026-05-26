"use client";

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div 
      className="relative flex h-screen w-screen cursor-pointer flex-col items-center justify-between bg-brand-light p-12 text-brand-dark transition-all duration-300 select-none overflow-hidden"
      onClick={onStart}
    >
      {/* Background soft image overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop')" }}
      />
      
      {/* Top Section: Logo */}
      <div className="relative z-10 flex flex-col items-center mt-12">
        <span className="text-xs font-bold tracking-widest text-brand-muted uppercase">Bem-vindo ao</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2 flex items-center gap-1 text-brand-dark">
          NexOrder
          <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
        </h1>
      </div>

      {/* Middle Section: Premium visual element */}
      <div className="relative z-10 flex max-w-sm flex-col items-center text-center px-6">
        <div className="relative h-64 w-64 md:h-72 md:w-72 overflow-hidden rounded-full border-[6px] border-white shadow-xl shadow-stone-200">
          <img 
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop" 
            alt="Delicioso hambúrguer"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
        <p className="mt-8 text-lg font-medium text-stone-700">
          Sabor irresistível preparado em poucos toques.
        </p>
      </div>

      {/* Bottom Section: Tap to Start button */}
      <div className="relative z-10 mb-12 animate-bounce">
        <div className="flex items-center justify-center rounded-full bg-brand-accent px-10 py-5 shadow-lg shadow-yellow-500/10 hover:bg-brand-accentHover transition-colors duration-200">
          <span className="text-lg font-black tracking-wider text-brand-dark uppercase">
            Toque para iniciar
          </span>
        </div>
      </div>
    </div>
  );
}
