'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Dirección del contrato (reemplazar con la real después del deploy)
const EVENT_FACTORY_ADDRESS = "0x..."; 

export function EventCreator() {
  const { address, isConnected } = useAccount();
  const [eventName, setEventName] = useState('');
  const [ticketPrice, setTicketPrice] = useState('0.001');
  const [maxTickets, setMaxTickets] = useState(100);

  const { 
    data: hash,
    writeContract,
    error,
    isPending 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const createEvent = async () => {
    if (!isConnected || !eventName) return;

    writeContract({
      address: EVENT_FACTORY_ADDRESS,
      abi: [
        {
          name: 'createEvent',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { type: 'string', name: '_name' },
            { type: 'string', name: '_symbol' },
            { type: 'uint256', name: '_ticketPrice' },
            { type: 'uint256', name: '_maxTickets' },
            { type: 'uint256', name: '_minGoal' },
            { type: 'uint256', name: '_maxGoal' },
            { type: 'string', name: '_baseTokenURI' }
          ],
          outputs: [{ type: 'uint256' }]
        }
      ],
      functionName: 'createEvent',
      args: [
        eventName,
        "TICKET", // symbol
        ethers.parseEther(ticketPrice),
        maxTickets,
        ethers.parseEther("0.1"), // minGoal
        ethers.parseEther("1"),   // maxGoal
        "https://zity.pop/api/metadata/"
      ]
    });
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">Conecta tu wallet para crear eventos</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">
        Crear Evento Cultural
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Evento
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Festival Cultural Latino"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio (ETH)
            </label>
            <input
              type="text"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máx. Tickets
            </label>
            <input
              type="number"
              value={maxTickets}
              onChange={(e) => setMaxTickets(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <button
          onClick={createEvent}
          disabled={isPending || isConfirming || !eventName}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 px-4 rounded-md transition-colors"
        >
          {isPending ? 'Creando...' : 
           isConfirming ? 'Confirmando...' : 
           'Crear Evento Cultural'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">Error: {error.message}</p>
          </div>
        )}

        {isConfirmed && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">¡Evento creado exitosamente!</p>
            <p className="text-green-700 text-sm mt-1">
              Transacción: {hash?.slice(0, 10)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}