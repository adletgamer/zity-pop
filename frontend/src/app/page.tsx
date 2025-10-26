'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { EventCreator } from '@/components/EventCreator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden particle-bg">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float delay-1000"></div>
      </div>
      
      <div className="relative z-10">
        {/* Header Hero */}
        <header className="pt-20 pb-16 px-4 text-center animate-slide-in">
          <div className="max-w-6xl mx-auto">
            {/* Logo mejorado */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center shadow-2xl hover-lift cursor-pointer">
                <span className="text-white font-black text-3xl">ZP</span>
              </div>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black gradient-text mb-6 leading-none">
              ZITY.POP
            </h1>
            
            <p className="text-2xl md:text-3xl text-purple-100 mb-6 max-w-4xl mx-auto leading-relaxed font-light">
              Donde la <span className="font-semibold text-white">cultura</span> encuentra{' '}
              <span className="gradient-text font-semibold">blockchain</span>
            </p>
            
            <p className="text-lg md:text-xl text-purple-200/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              La plataforma Web3 que revoluciona la gestión de eventos culturales en Latinoamérica. 
              Transparencia, automatización y comunidad en cada experiencia.
            </p>
          </div>
        </header>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-16 px-4">
          <div className="glass-effect-dark rounded-2xl p-8 shadow-2xl hover-lift">
            <WalletConnect />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 pb-24">
          {/* Event Creator */}
          <div className="glass-effect rounded-3xl p-8 md:p-12 mb-20 shadow-2xl hover-lift">
            <EventCreator />
          </div>

          {/* Features Grid Mejorado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: "🎪",
                title: "Eventos Inteligentes",
                description: "Smart contracts en Scroll que automatizan financiamiento y distribución de ingresos.",
                gradient: "from-purple-500/20 to-pink-500/20",
                border: "border-purple-400/30"
              },
              {
                icon: "💫", 
                title: "NFTs con Propósito",
                description: "Tickets digitales coleccionables que certifican tu participación y dan beneficios.",
                gradient: "from-blue-500/20 to-cyan-500/20",
                border: "border-blue-400/30"
              },
              {
                icon: "📊",
                title: "Economía Justa",
                description: "95% para artistas, 5% para la plataforma. Transparencia radical en cada transacción.",
                gradient: "from-green-500/20 to-emerald-500/20", 
                border: "border-green-400/30"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`group bg-gradient-to-br ${feature.gradient} backdrop-blur-md border ${feature.border} rounded-2xl p-8 shadow-2xl hover-lift transition-all duration-500`}
              >
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-purple-100/80 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Section Mejorada */}
          <div className="text-center mb-20">
            <div className="inline-flex flex-wrap justify-center gap-12 glass-effect-dark rounded-3xl p-12">
              {[
                { value: "95%", label: "Para artistas", color: "text-green-400" },
                { value: "0%", label: "Intermediarios", color: "text-red-400" },
                { value: "100%", label: "Transparente", color: "text-blue-400" },
                { value: "🚀", label: "Web3 Native", color: "text-purple-400" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-4xl font-black mb-2 ${stat.color}`}>{stat.value}</div>
                  <div className="text-purple-200/70 text-sm font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Mejorado */}
        <footer className="border-t border-white/10 py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-purple-200/60 text-lg">
              Construido con 💜 para la cultura latinoamericana • 
              <span className="text-purple-300 font-medium"> Scroll L2 • Web3 • DeFi</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}