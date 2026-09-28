import React from 'react';
import { ShoppingCart, Zap, Shield, Coffee, BookOpen, Check, Lock, X } from 'lucide-react';
import { UpgradeItem } from '../types/game';
import { soundManager } from '../utils/audio';

interface UpgradesShopProps {
  money: number;
  upgrades: UpgradeItem[];
  isOpen: boolean;
  onClose: () => void;
  onBuyUpgrade: (id: string, cost: number) => void;
}

export const UpgradesShop: React.FC<UpgradesShopProps> = ({
  money,
  upgrades,
  isOpen,
  onClose,
  onBuyUpgrade,
}) => {
  if (!isOpen) return null;

  const handleBuy = (item: UpgradeItem) => {
    if (money >= item.cost && item.level < item.maxLevel) {
      soundManager.playChaChing();
      onBuyUpgrade(item.id, item.cost);
    } else {
      soundManager.playHangUp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-neutral-900 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl box-glow-amber">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h2 className="font-pixel text-sm md:text-base text-amber-400 text-glow-amber">
              BLACK-MARKET TECH SHOP
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Display */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-400">AVAILABLE FUNDS:</span>
          <span className="font-pixel text-emerald-400 text-base md:text-lg text-glow-green">
            ${money.toLocaleString()}
          </span>
        </div>

        {/* Upgrade Items List */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {upgrades.map((item) => {
            const isMax = item.level >= item.maxLevel;
            const canAfford = money >= item.cost && !isMax;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  isMax
                    ? 'bg-neutral-950/60 border-neutral-800 opacity-70'
                    : canAfford
                    ? 'bg-neutral-950 border-neutral-700 hover:border-amber-500/50'
                    : 'bg-neutral-950/80 border-neutral-800'
                } flex items-center justify-between gap-3`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-100">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-800 text-amber-300 rounded">
                        LVL {item.level}/{item.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford || isMax}
                  className={`px-3 py-1.5 rounded-lg font-pixel text-xs shrink-0 cursor-pointer transition-all ${
                    isMax
                      ? 'bg-neutral-800 text-emerald-400 cursor-default'
                      : canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold hover:scale-105'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {isMax ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> MAX
                    </span>
                  ) : (
                    `$${item.cost.toLocaleString()}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-mono text-xs cursor-pointer"
          >
            RETURN TO TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
};
