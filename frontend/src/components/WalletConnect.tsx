'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-md">
        <div className="bg-green-100 px-4 py-2 rounded-lg">
          <p className="text-green-800 font-medium text-sm">
            ✅ {address?.slice(0, 8)}...{address?.slice(-6)}
          </p>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
    >
      Conectar Wallet
    </button>
  );
}