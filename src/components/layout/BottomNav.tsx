import React from 'react';
import { LayoutDashboard, Calculator, Zap, Users, Menu } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate, onOpenMenu }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-[#DED7CB] bg-[#F7F4EE]/95 backdrop-blur-md px-2 py-1 md:hidden shadow-lg">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-0.5 rounded-lg py-1 px-2.5 transition ${
          activeView === 'dashboard'
            ? 'text-[#2B2520] font-bold'
            : 'text-[#7A7268] hover:text-[#2B2520]'
        }`}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onNavigate('calculator')}
        className={`flex flex-col items-center gap-0.5 rounded-lg py-1 px-2.5 transition ${
          activeView === 'calculator'
            ? 'text-[#2B2520] font-bold'
            : 'text-[#7A7268] hover:text-[#2B2520]'
        }`}
      >
        <Calculator className="h-5 w-5" />
        <span className="text-[10px]">Calc</span>
      </button>

      {/* Center prominent Quick Sale POS button */}
      <button
        onClick={() => onNavigate('pos')}
        className="flex -translate-y-3 flex-col items-center justify-center rounded-full bg-[#8E7963] p-3 text-white shadow-lg shadow-[#8E7963]/30 transition active:scale-95 border border-[#7A6753]"
      >
        <Zap className="h-6 w-6 stroke-[2.5]" />
      </button>

      <button
        onClick={() => onNavigate('customers')}
        className={`flex flex-col items-center gap-0.5 rounded-lg py-1 px-2.5 transition ${
          activeView === 'customers'
            ? 'text-[#2B2520] font-bold'
            : 'text-[#7A7268] hover:text-[#2B2520]'
        }`}
      >
        <Users className="h-5 w-5" />
        <span className="text-[10px]">Customers</span>
      </button>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-0.5 rounded-lg py-1 px-2.5 text-[#7A7268] hover:text-[#2B2520]"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px]">Menu</span>
      </button>
    </nav>
  );
};
