import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { CalculationRecord } from '../../types';
import {
  Calculator as CalcIcon,
  RotateCcw,
  History,
  ArrowRight,
  UserPlus,
  Save,
  Trash2,
  Bookmark,
  Delete,
  X,
  Search,
  Check,
} from 'lucide-react';

interface SmartCalculatorProps {
  onConvertToBill?: (items: { name: string; quantity: number; price: number; total: number }[]) => void;
  onNavigate?: (view: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const SmartCalculator: React.FC<SmartCalculatorProps> = ({
  onConvertToBill,
  onNavigate,
  isModal = false,
  onClose,
}) => {
  const { currentBusiness, currentUser } = useAuth();

  const [expression, setExpression] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<string>('0');
  const [previousResult, setPreviousResult] = useState<string>('');
  const [memory, setMemory] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [gtList, setGtList] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<CalculationRecord[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyCategory, setHistoryCategory] = useState<string>('All');

  // Breakdown items for "Convert to Bill"
  const [calculatedItems, setCalculatedItems] = useState<
    { id: string; name: string; quantity: number; price: number; total: number }[]
  >([]);

  // "Save to Customer" Modal state
  const [showSaveCustomerModal, setShowSaveCustomerModal] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [calcNote, setCalcNote] = useState<string>('');
  const [calcCategory, setCalcCategory] = useState<CalculationRecord['calculationType']>('General');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Load history from storage
  const loadHistory = useCallback(() => {
    const list = StorageService.getCalculations(currentBusiness.id);
    setHistoryList(list);
  }, [currentBusiness.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Sound feedback on button click if enabled
  const playClickSound = () => {
    const hw = StorageService.getHardwareSettings();
    if (hw.soundFeedback) {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch {
        // audio context blocked or unsupported
      }
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+') {
        inputOperator('+');
      } else if (e.key === '-') {
        inputOperator('-');
      } else if (e.key === '*') {
        inputOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        inputOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        evaluateEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleAllClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const inputDigit = (digit: string) => {
    playClickSound();
    if (currentValue === '0' || currentValue === 'Error') {
      setCurrentValue(digit);
    } else {
      setCurrentValue((prev) => prev + digit);
    }
  };

  const inputDecimal = () => {
    playClickSound();
    if (!currentValue.includes('.')) {
      setCurrentValue((prev) => prev + '.');
    }
  };

  const inputOperator = (op: string) => {
    playClickSound();
    if (expression && currentValue !== '0') {
      // Evaluate current segment first
      const val = parseFloat(currentValue) || 0;
      setExpression((prev) => `${prev} ${val} ${op}`);
      setCurrentValue('0');
    } else if (currentValue !== '0' || expression === '') {
      const val = parseFloat(currentValue) || 0;
      setExpression(`${val} ${op}`);
      setCurrentValue('0');
    }
  };

  const handleBackspace = () => {
    playClickSound();
    if (currentValue.length > 1 && currentValue !== 'Error') {
      setCurrentValue((prev) => prev.slice(0, -1));
    } else {
      setCurrentValue('0');
    }
  };

  const handleClear = () => {
    playClickSound();
    setCurrentValue('0');
  };

  const handleAllClear = () => {
    playClickSound();
    setExpression('');
    setCurrentValue('0');
    setPreviousResult('');
  };

  // Safe arithmetic evaluator
  const evaluateMathString = (str: string): number => {
    // Replace visual symbols
    const sanitized = str
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/[^0-9+\-*/.() ]/g, '');

    // Tokenized calculation
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (!isFinite(result) || isNaN(result)) throw new Error('Math error');
      return Math.round(result * 100) / 100;
    } catch {
      throw new Error('Invalid calculation');
    }
  };

  const evaluateEquals = () => {
    playClickSound();
    if (!expression && currentValue === '0') return;

    try {
      const fullExpr = expression ? `${expression} ${currentValue}` : currentValue;
      const res = evaluateMathString(fullExpr);

      setPreviousResult(`${fullExpr} = ${res}`);
      setCurrentValue(String(res));
      setExpression('');

      // Add to Grand Total (GT)
      setGrandTotal((prev) => prev + res);
      setGtList((prev) => [...prev, res]);

      // Automatically record in breakdown list for "Convert to Bill"
      setCalculatedItems((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}`,
          name: `Item #${prev.length + 1} (${fullExpr})`,
          quantity: 1,
          price: res,
          total: res,
        },
      ]);

      // Save to auto history
      const record: CalculationRecord = {
        id: `calc_${Date.now()}`,
        businessId: currentBusiness.id,
        userId: currentUser.id,
        expression: fullExpr,
        result: res,
        calculationType: 'General',
        category: 'Quick Calculation',
        createdAt: new Date().toISOString(),
      };
      StorageService.saveCalculation(record);
      loadHistory();
    } catch {
      setCurrentValue('Error');
    }
  };

  // Percentage %
  const handlePercentage = () => {
    playClickSound();
    try {
      const val = parseFloat(currentValue) || 0;
      const res = Math.round((val / 100) * 10000) / 10000;
      setCurrentValue(String(res));
    } catch {
      setCurrentValue('Error');
    }
  };

  // Markup (MU) function: e.g. Cost = 100, MU 20% => Selling = 100 / (1 - 0.20) = 125
  const handleMarkup = () => {
    playClickSound();
    try {
      const val = parseFloat(currentValue) || 0;
      const markupRate = 20; // 20% standard retail margin
      const price = Math.round((val / (1 - markupRate / 100)) * 100) / 100;
      setPreviousResult(`MU 20% on ${val} = ${price}`);
      setCurrentValue(String(price));
    } catch {
      setCurrentValue('Error');
    }
  };

  // Add GST/Tax (+ Tax %)
  const handleAddGST = () => {
    playClickSound();
    try {
      const val = parseFloat(currentValue) || 0;
      const taxRate = currentBusiness.defaultTaxRate > 0 ? currentBusiness.defaultTaxRate : 18; // default 18% standard GST
      const taxAmount = (val * taxRate) / 100;
      const totalWithTax = Math.round((val + taxAmount) * 100) / 100;
      setPreviousResult(`${val} + ${taxRate}% GST = ${totalWithTax}`);
      setCurrentValue(String(totalWithTax));
    } catch {
      setCurrentValue('Error');
    }
  };

  // Remove GST/Tax (- Tax %) to get base price
  const handleRemoveGST = () => {
    playClickSound();
    try {
      const val = parseFloat(currentValue) || 0;
      const taxRate = currentBusiness.defaultTaxRate > 0 ? currentBusiness.defaultTaxRate : 18;
      const baseAmount = Math.round((val / (1 + taxRate / 100)) * 100) / 100;
      setPreviousResult(`${val} - ${taxRate}% GST base = ${baseAmount}`);
      setCurrentValue(String(baseAmount));
    } catch {
      setCurrentValue('Error');
    }
  };

  // Memory functions
  const handleMemoryAdd = () => {
    playClickSound();
    const val = parseFloat(currentValue) || 0;
    setMemory((prev) => prev + val);
    setPreviousResult(`M+ added ${val}`);
  };

  const handleMemorySub = () => {
    playClickSound();
    const val = parseFloat(currentValue) || 0;
    setMemory((prev) => prev - val);
    setPreviousResult(`M- subtracted ${val}`);
  };

  const handleMemoryRecallClear = () => {
    playClickSound();
    if (currentValue === String(memory)) {
      // Second press clears memory
      setMemory(0);
      setPreviousResult('Memory Cleared (MC)');
    } else {
      setCurrentValue(String(memory));
      setPreviousResult(`MRC Recalled: ${memory}`);
    }
  };

  // Grand Total recall
  const handleGrandTotalRecall = () => {
    playClickSound();
    setCurrentValue(String(grandTotal));
    setPreviousResult(`GT (${gtList.length} items) = ${grandTotal}`);
  };

  // Convert to POS Bill
  const handleConvertToBill = () => {
    let itemsToPass = calculatedItems;
    const currentNum = parseFloat(currentValue);

    // If breakdown list is empty but calculator shows a valid positive number
    if (itemsToPass.length === 0 && currentNum > 0) {
      itemsToPass = [
        {
          id: 'manual_calc_1',
          name: 'Calculated Items Total',
          quantity: 1,
          price: currentNum,
          total: currentNum,
        },
      ];
    }

    if (itemsToPass.length === 0) {
      return;
    }

    if (onConvertToBill) {
      onConvertToBill(itemsToPass);
    } else if (onNavigate) {
      onNavigate('pos');
    }

    if (isModal && onClose) {
      onClose();
    }
  };

  // Save to Customer Action
  const handleSaveToCustomer = () => {
    const currentNum = parseFloat(currentValue);
    if (!currentNum || currentNum <= 0) return;

    setShowSaveCustomerModal(true);
  };

  const confirmSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(currentValue) || 0;
    if (val <= 0) return;

    const customers = StorageService.getCustomers(currentBusiness.id);
    const selectedCust = customers.find((c) => c.id === selectedCustomerId);

    const record: CalculationRecord = {
      id: `calc_${Date.now()}`,
      businessId: currentBusiness.id,
      userId: currentUser.id,
      expression: previousResult || `Customer Estimate: ${val}`,
      result: val,
      calculationType: calcCategory,
      category: selectedCust ? `Customer: ${selectedCust.name}` : 'Estimate',
      notes: calcNote || `Saved for ${selectedCust?.name || 'Customer'}`,
      isFavorite: true,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveCalculation(record);
    loadHistory();
    setShowSaveCustomerModal(false);
    setSaveSuccessMessage(`Calculation saved for ${selectedCust?.name || 'Customer'}`);
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  const customers = StorageService.getCustomers(currentBusiness.id);
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  const filteredHistory = historyList.filter((item) => {
    const matchesSearch =
      item.expression.toLowerCase().includes(historySearch.toLowerCase()) ||
      String(item.result).includes(historySearch) ||
      (item.notes && item.notes.toLowerCase().includes(historySearch.toLowerCase()));

    const matchesCat =
      historyCategory === 'All' || item.calculationType === historyCategory || item.category === historyCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${isModal ? 'p-2' : 'p-4 md:p-6'}`}>
      {/* Main Calculator Panel */}
      <div className="flex-1 max-w-xl mx-auto w-full">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                <CalcIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Smart Business Calculator</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Touch &amp; POS optimized with MU &amp; GST</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  showHistory
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
                <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] dark:bg-slate-800 font-bold">
                  {historyList.length}
                </span>
              </button>

              {isModal && onClose && (
                <button
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Feedback banner */}
          {saveSuccessMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Calculator Screen Display */}
          <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white shadow-inner font-mono select-none">
            {/* Indicators */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <div className="flex gap-2">
                {memory !== 0 && (
                  <span className="rounded bg-indigo-500/30 px-1.5 py-0.5 text-[10px] text-indigo-300 font-bold">
                    M: {memory}
                  </span>
                )}
                {grandTotal !== 0 && (
                  <span className="rounded bg-amber-500/30 px-1.5 py-0.5 text-[10px] text-amber-300 font-bold">
                    GT: {grandTotal}
                  </span>
                )}
              </div>
              <div className="truncate max-w-[220px] text-slate-400 text-right">
                {previousResult || 'Ready'}
              </div>
            </div>

            {/* Expression */}
            <div className="h-6 text-sm text-slate-400 text-right truncate">
              {expression || ' '}
            </div>

            {/* Current Number */}
            <div className="text-right text-3xl md:text-4xl font-bold tracking-tight text-white overflow-x-auto whitespace-nowrap py-1">
              {currentValue}
            </div>
          </div>

          {/* Business Specialized Function Row */}
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-xs font-bold">
            <button
              onClick={handleMarkup}
              className="rounded-xl bg-amber-50 border border-amber-200 py-2.5 text-amber-800 hover:bg-amber-100 transition active:scale-95 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              title="Markup 20% on cost"
            >
              MU
            </button>
            <button
              onClick={handleGrandTotalRecall}
              className="rounded-xl bg-amber-50 border border-amber-200 py-2.5 text-amber-800 hover:bg-amber-100 transition active:scale-95 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              title="Grand Total accumulation"
            >
              GT
            </button>
            <button
              onClick={handleMemoryAdd}
              className="rounded-xl bg-slate-100 py-2.5 text-slate-700 hover:bg-slate-200 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
              title="Memory Add"
            >
              M+
            </button>
            <button
              onClick={handleMemorySub}
              className="rounded-xl bg-slate-100 py-2.5 text-slate-700 hover:bg-slate-200 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
              title="Memory Subtract"
            >
              M-
            </button>
            <button
              onClick={handleMemoryRecallClear}
              className="rounded-xl bg-slate-100 py-2.5 text-slate-700 hover:bg-slate-200 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
              title="Memory Recall / Clear"
            >
              MRC
            </button>
            <button
              onClick={handleAddGST}
              className="rounded-xl bg-indigo-50 border border-indigo-200 py-2.5 text-indigo-700 hover:bg-indigo-100 transition active:scale-95 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 col-span-2 sm:col-span-1"
              title="Add GST tax rate"
            >
              +GST
            </button>
            <button
              onClick={handleRemoveGST}
              className="rounded-xl bg-indigo-50 border border-indigo-200 py-2.5 text-indigo-700 hover:bg-indigo-100 transition active:scale-95 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 col-span-2 sm:col-span-1"
              title="Extract base price without GST"
            >
              -GST
            </button>
          </div>

          {/* Standard Numeric Keypad */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-lg font-bold">
            {/* Row 1 */}
            <button
              onClick={handleAllClear}
              className="rounded-2xl bg-rose-50 border border-rose-200 py-3.5 text-rose-700 hover:bg-rose-100 transition active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              AC
            </button>
            <button
              onClick={handleClear}
              className="rounded-2xl bg-slate-100 py-3.5 text-slate-700 hover:bg-slate-200 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
            >
              C
            </button>
            <button
              onClick={handlePercentage}
              className="rounded-2xl bg-slate-100 py-3.5 text-slate-700 hover:bg-slate-200 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
            >
              %
            </button>
            <button
              onClick={() => inputOperator('÷')}
              className="rounded-2xl bg-indigo-100 text-indigo-800 py-3.5 hover:bg-indigo-200 transition active:scale-95 dark:bg-indigo-900/60 dark:text-indigo-200"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              onClick={() => inputDigit('7')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              7
            </button>
            <button
              onClick={() => inputDigit('8')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              8
            </button>
            <button
              onClick={() => inputDigit('9')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              9
            </button>
            <button
              onClick={() => inputOperator('×')}
              className="rounded-2xl bg-indigo-100 text-indigo-800 py-4 hover:bg-indigo-200 transition active:scale-95 dark:bg-indigo-900/60 dark:text-indigo-200"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              onClick={() => inputDigit('4')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              4
            </button>
            <button
              onClick={() => inputDigit('5')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              5
            </button>
            <button
              onClick={() => inputDigit('6')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              6
            </button>
            <button
              onClick={() => inputOperator('-')}
              className="rounded-2xl bg-indigo-100 text-indigo-800 py-4 hover:bg-indigo-200 transition active:scale-95 dark:bg-indigo-900/60 dark:text-indigo-200"
            >
              -
            </button>

            {/* Row 4 */}
            <button
              onClick={() => inputDigit('1')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              1
            </button>
            <button
              onClick={() => inputDigit('2')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              2
            </button>
            <button
              onClick={() => inputDigit('3')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              3
            </button>
            <button
              onClick={() => inputOperator('+')}
              className="rounded-2xl bg-indigo-100 text-indigo-800 py-4 hover:bg-indigo-200 transition active:scale-95 dark:bg-indigo-900/60 dark:text-indigo-200"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              onClick={() => inputDigit('0')}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              0
            </button>
            <button
              onClick={inputDecimal}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 hover:bg-slate-50 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            >
              .
            </button>
            <button
              onClick={handleBackspace}
              className="rounded-2xl border border-slate-200 bg-white py-4 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
              title="Backspace"
            >
              <Delete className="h-5 w-5" />
            </button>
            <button
              onClick={evaluateEquals}
              className="rounded-2xl bg-indigo-600 text-white py-4 shadow-md shadow-indigo-300 hover:bg-indigo-700 transition active:scale-95 dark:shadow-none"
            >
              =
            </button>
          </div>

          {/* Action Row: Save to Customer & Convert to Bill */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSaveToCustomer}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white py-3 px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-98 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>SAVE TO CUSTOMER</span>
            </button>

            <button
              onClick={handleConvertToBill}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-98"
            >
              <span>CONVERT TO BILL</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History Side Panel */}
      {showHistory && (
        <div className="w-full lg:w-96 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Calculation History</h3>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear all calculation history?')) {
                  StorageService.clearCalculations(currentBusiness.id);
                  loadHistory();
                }
              }}
              className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search calculation..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
              {['All', 'General', 'Customer', 'GST', 'Markup'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setHistoryCategory(cat)}
                  className={`rounded-lg px-2 py-1 font-medium transition whitespace-nowrap ${
                    historyCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* History records list */}
          <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No calculation records found
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs transition hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.category || item.calculationType}
                    </span>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="font-mono text-slate-600 dark:text-slate-300 truncate">
                    {item.expression}
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      = {currentBusiness.currencySymbol} {item.result.toLocaleString()}
                    </span>

                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setCurrentValue(String(item.result));
                          setPreviousResult(`${item.expression} = ${item.result}`);
                        }}
                        className="rounded-lg bg-indigo-50 px-2 py-1 font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300"
                        title="Load result to calculator"
                      >
                        Reuse
                      </button>
                      <button
                        onClick={() => {
                          StorageService.deleteCalculation(item.id);
                          loadHistory();
                        }}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Save to Customer Modal */}
      {showSaveCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Bookmark className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Save Calculation to Customer</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Amount: {currentBusiness.currencySymbol} {currentValue}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveCustomerModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={confirmSaveCustomer} className="mt-4 space-y-4">
              {/* Customer selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Customer:
                </label>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white mb-2"
                />

                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 dark:border-slate-700 dark:divide-slate-800">
                  {filteredCustomers.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`flex w-full items-center justify-between p-2 text-left text-xs transition ${
                        selectedCustomerId === cust.id
                          ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div>{cust.name}</div>
                        <div className="text-[10px] text-slate-400">{cust.phone}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400">Due:</span>{' '}
                        <span className={cust.totalDue > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                          {currentBusiness.currencySymbol} {cust.totalDue.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Calculation Category:
                </label>
                <select
                  value={calcCategory}
                  onChange={(e) => setCalcCategory(e.target.value as CalculationRecord['calculationType'])}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Customer">Customer Estimate</option>
                  <option value="Shopping">Shopping List</option>
                  <option value="General">General Bill</option>
                  <option value="GST">Tax / GST Calculation</option>
                  <option value="Markup">Profit / Markup Quote</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 bags cement + delivery charges"
                  value={calcNote}
                  onChange={(e) => setCalcNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveCustomerModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
