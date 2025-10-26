'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Cambiar la direccion 
const EVENT_FACTORY_ADDRESS = "0x0000000000000000000000000000000000000000";

export function EventList() {
  const { address, isConnected } = useAccount();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simular datos para demo 
  useEffect(() => {
    if (isConnected) {
      setTimeout(() => {
        setEvents([
          {
            id: 1,
            name: "🎸 Festival Latino ZITY",
            organizer: "0x742...35Cc2",
            ticketPrice: "0.001",
            maxTickets: 100,
            ticketsSold: 45,
            fundsRaised: "0.045",
            minGoal: "0.08",
            isActive: true
          },
          {
            id: 2, 
            name: "🖼️ Feria Arte Digital",
            organizer: "0x8a3...91Fd4",
            ticketPrice: "0.002",
            maxTickets: 50,
            ticketsSold: 28,
            fundsRaised: "0.056", 
            minGoal: "0.06",
            isActive: true
          }
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="glass-effect rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Eventos Culturales Activos</h3>
        <p className="text-purple-200/60">Conecta tu wallet para ver eventos</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Cargando eventos...</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl p-6">
      <h3 className="text-2xl font-bold text-white mb-6">🎪 Eventos Culturales Activos</h3>
      
      <div className="space-y-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        
        {events.length === 0 && (
          <div className="text-center py-8">
            <p className="text-purple-200/60 text-lg">No hay eventos activos</p>
            <p className="text-purple-200/40 text-sm mt-2">
              Sé el primero en crear un evento cultural
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const { writeContract, isPending } = useWriteContract();
  const progress = (event.ticketsSold / event.maxTickets) * 100;
  const goalProgress = (parseFloat(event.fundsRaised) / parseFloat(event.minGoal)) * 100;

  const handlePurchase = () => {
    // Simular compra - integrar con contrato real después
    alert(`🎫 Comprando ticket para: ${event.name}\nPrecio: ${event.ticketPrice} ETH`);
    
    // Aquí irá la integración real:
    // writeContract({
    //   address: EVENT_ADDRESS,
    //   abi: [...],
    //   functionName: 'purchaseTicket',
    //   value: ethers.parseEther(event.ticketPrice)
    // });
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover-lift transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-xl font-bold text-white mb-2">{event.name}</h4>
          <p className="text-purple-200/60 text-sm">
            Por: {event.organizer.slice(0, 8)}...{event.organizer.slice(-6)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{event.ticketPrice} ETH</div>
          <div className="text-purple-200/60 text-sm">por ticket</div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-sm text-purple-200/80 mb-1">
            <span>Tickets vendidos</span>
            <span>{event.ticketsSold} / {event.maxTickets}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-purple-200/80 mb-1">
            <span>Meta de financiamiento</span>
            <span>{event.fundsRaised} ETH / {event.minGoal} ETH</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(goalProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <button
        onClick={handlePurchase}
        disabled={isPending || !event.isActive}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-400 disabled:to-pink-400 text-white font-bold py-3 px-4 rounded-lg transition-all hover:scale-105 disabled:cursor-not-allowed"
      >
        {isPending ? 'Procesando...' : '🎫 Comprar Ticket'}
      </button>
    </div>
  );
}