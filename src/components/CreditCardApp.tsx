import React, { useState } from 'react';
import { FakeCard, Caller } from '../types/game';
import { CreditCard, CheckCircle, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, FileText, DollarSign, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { gameplayRecorder } from '../utils/gameplayRecorder';
import confetti from 'canvas-confetti';

interface CreditCardAppProps {
  currentCaller: Caller | null;
  shiftDay?: number;
  onProcessSuccess: (amount: number, cardholder: string) => void;
}

interface TransactionRecord {
  id: string;
  timestamp: string;
  cardholder: string;
  maskedCard: string;
  amount: number;
  status: 'APPROVED' | 'DECLINED';
  authCode: string;
}

export const CreditCardApp: React.FC<CreditCardAppProps> = ({
  currentCaller,
  shiftDay = 1,
  onProcessSuccess,
}) => {
  // Form Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('1499');
  const [transactionType, setTransactionType] = useState<'CHARGE' | 'REFUND_FEE' | 'AUTH'>('CHARGE');

  // Terminal Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [incorrectField, setIncorrectField] = useState<'number' | 'cardholder' | 'expiry' | 'cvv' | 'amount' | null>(null);
  const [lastReceipt, setLastReceipt] = useState<TransactionRecord | null>(null);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'receipt' | 'history'>('terminal');

  // Detect Brand
  const detectBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean)) return 'MASTERCARD';
    if (/^3[47]/.test(clean)) return 'AMEX';
    if (/^6(?:011|5)/.test(clean)) return 'DISCOVER';
    return 'UNKNOWN';
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncorrectField(null);
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncorrectField(null);
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2, 4)}`;
    }
    setExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncorrectField(null);
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvv(val);
  };

  const handleCardholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncorrectField(null);
    setCardholder(e.target.value.toUpperCase());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncorrectField(null);
    setAmount(e.target.value);
  };

  // Process Card
  const handleProcessTransaction = () => {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    const cleanAmount = parseFloat(amount);
    setIncorrectField(null);

    if (!currentCaller) {
      setStatusMessage('INCORRECT: No active caller line connected. You must have a caller on the line.');
      soundManager.playHangUp();
      return;
    }

    if (cleanNum.length < 15) {
      setIncorrectField('number');
      setStatusMessage('INCORRECT CARD NUMBER: Invalid card number length (15-16 digits required).');
      soundManager.playHangUp();
      return;
    }

    // Verify 16-digit card number against caller
    const expectedNum = currentCaller.card.fullNumber.replace(/\s+/g, '');
    if (cleanNum !== expectedNum) {
      setIncorrectField('number');
      setStatusMessage('INCORRECT CARD NUMBER: The 16-digit card number is incorrect and does not match the caller\'s card!');
      soundManager.playHangUp();
      return;
    }

    // Verify Expiration Date
    const expectedExpiry = currentCaller.card.expiry.trim();
    if (!expiry || expiry.trim() !== expectedExpiry) {
      setIncorrectField('expiry');
      setStatusMessage('INCORRECT EXPIRATION DATE: Expiration date is incorrect or does not match caller\'s card!');
      soundManager.playHangUp();
      return;
    }

    // Verify CVV
    const expectedCvv = currentCaller.card.cvv.trim();
    if (!cvv || cvv.trim() !== expectedCvv) {
      setIncorrectField('cvv');
      setStatusMessage('INCORRECT CVV: The 3-digit security code is incorrect! Verification declined.');
      soundManager.playHangUp();
      return;
    }

    // Verify Cardholder Name
    const enteredName = cardholder.trim().toUpperCase();
    const callerNameUpper = currentCaller.name.trim().toUpperCase();
    const cardholderUpper = (currentCaller.card.cardholder || '').trim().toUpperCase();

    if (!enteredName) {
      setIncorrectField('cardholder');
      setStatusMessage('INCORRECT CARDHOLDER NAME: Cardholder name required! Ask caller for their full name.');
      soundManager.playHangUp();
      return;
    }

    const firstName = callerNameUpper.split(' ')[0];
    const lastName = callerNameUpper.split(' ').slice(-1)[0];
    const isNameMatch =
      enteredName.includes(firstName) ||
      enteredName.includes(lastName) ||
      cardholderUpper.includes(enteredName) ||
      enteredName.includes(cardholderUpper);

    if (!isNameMatch) {
      setIncorrectField('cardholder');
      setStatusMessage('INCORRECT CARDHOLDER NAME: Cardholder name does not match issuing bank records!');
      soundManager.playHangUp();
      return;
    }

    if (currentCaller.isDrained) {
      setIncorrectField('amount');
      setStatusMessage('TRANSACTION BLOCKED: Account balance has already been settled for this caller. Duplicate charge attempt blocked!');
      soundManager.playHangUp();
      return;
    }

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setIncorrectField('amount');
      setStatusMessage('INCORRECT AMOUNT: Please enter a valid transaction amount greater than $0.');
      soundManager.playHangUp();
      return;
    }

    // Day 1 cap: $2,000 maximum per transaction/overall
    const dayCap = (shiftDay || 1) <= 1 ? 2000 : (shiftDay || 1) === 2 ? 3800 : 8000;
    if (cleanAmount > dayCap) {
      setIncorrectField('amount');
      setStatusMessage(`INCORRECT AMOUNT - DAY #${shiftDay || 1} LIMIT: Gateway daily cap is $${dayCap.toLocaleString()}.00. Complete Day ${shiftDay || 1} to unlock higher tiers!`);
      soundManager.playHangUp();
      return;
    }

    if (cleanAmount > currentCaller.card.balance) {
      setIncorrectField('amount');
      setStatusMessage(`INCORRECT AMOUNT - NSF: Insufficient funds. Maximum available card balance is $${currentCaller.card.balance.toLocaleString()}.`);
      soundManager.playHangUp();
      return;
    }

    setIsProcessing(true);
    setStatusMessage('1/3 Contacting Apex Merchant Gateway...');
    soundManager.playKeyTone(6);

    gameplayRecorder.recordEvent(
      'charge_attempt',
      { amount: cleanAmount, appName: 'Credit Card POS Terminal' },
      currentCaller.name,
      currentCaller.archetype
    );

    setTimeout(() => {
      setStatusMessage('2/3 Verifying CVV2 & Cardholder AVS Billing...');
      soundManager.playKeyTone(8);
    }, 700);

    setTimeout(() => {
      setStatusMessage('3/3 Requesting instant settlement from issuing bank...');
      soundManager.playKeyTone(9);
    }, 1400);

    setTimeout(() => {
      setIsProcessing(false);
      soundManager.playChaChing();

      gameplayRecorder.recordEvent(
        'charge_success',
        { amount: cleanAmount, appName: 'Credit Card POS Terminal' },
        currentCaller.name,
        currentCaller.archetype
      );

      const authCode = 'AUTH_' + Math.floor(100000 + Math.random() * 900000);
      const record: TransactionRecord = {
        id: 'TX_' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toLocaleTimeString(),
        cardholder: cardholder || currentCaller.name.toUpperCase(),
        maskedCard: `${cardNumber.substring(0, 4)} **** **** ${cardNumber.slice(-4)}`,
        amount: cleanAmount,
        status: 'APPROVED',
        authCode: authCode,
      };

      setLastReceipt(record);
      setHistory((prev) => [record, ...prev]);
      setActiveTab('receipt');
      setStatusMessage(`SUCCESS: Approved $${cleanAmount.toLocaleString()} (${authCode})`);

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      onProcessSuccess(cleanAmount, record.cardholder);
    }, 2100);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 font-sans text-xs select-none">
      {/* Sub-header navigation */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'terminal' ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Virtual Terminal
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            disabled={!lastReceipt}
            className={`px-3 py-1 rounded font-medium transition-colors disabled:opacity-40 ${
              activeTab === 'receipt' ? 'bg-neutral-800 text-cyan-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Terminal Receipt
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'history' ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Batch Ledger ({history.length})
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GATEWAY: ONLINE (256-BIT TLS)</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'terminal' && (
          <div className="max-w-md mx-auto space-y-3">
            {/* Terminal Form Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-100">Apex POS Gateway v4.8</div>
                    <div className="text-[10px] text-neutral-400">Direct Merchant Settlement Protocol</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-neutral-800 text-emerald-400 rounded text-[10px] font-mono font-bold">
                    {detectBrand(cardNumber)}
                  </span>
                </div>
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  16-Digit Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4532 8910 2341 8912"
                    className={`w-full bg-neutral-950 border rounded px-3 py-2 text-sm font-mono tracking-widest text-neutral-100 focus:outline-none transition-colors ${
                      incorrectField === 'number'
                        ? 'border-red-500 bg-red-950/30 ring-2 ring-red-500/50 text-red-200'
                        : 'border-neutral-700 focus:border-emerald-500'
                    }`}
                  />
                  <div className="absolute right-3 top-2.5 text-neutral-500 text-[10px] font-mono">
                    {cardNumber.replace(/\s+/g, '').length}/16
                  </div>
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase">
                    Cardholder Name
                  </label>
                  {currentCaller && !currentCaller.nameRevealed && (
                    <span className="text-[10px] font-mono text-amber-400">
                      🔒 Ask caller for full name
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={cardholder}
                  onChange={handleCardholderChange}
                  placeholder={currentCaller?.nameRevealed ? currentCaller.name.toUpperCase() : "ASK CALLER FOR FULL NAME"}
                  className={`w-full bg-neutral-950 border rounded px-3 py-1.5 text-xs font-mono text-neutral-100 focus:outline-none transition-colors ${
                    incorrectField === 'cardholder'
                      ? 'border-red-500 bg-red-950/30 ring-2 ring-red-500/50 text-red-200'
                      : 'border-neutral-700 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    Expires (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="08/28"
                    className={`w-full bg-neutral-950 border rounded px-3 py-1.5 text-xs font-mono text-center text-neutral-100 focus:outline-none transition-colors ${
                      incorrectField === 'expiry'
                        ? 'border-red-500 bg-red-950/30 ring-2 ring-red-500/50 text-red-200'
                        : 'border-neutral-700 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    Security Code (CVV)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="•••"
                    className={`w-full bg-neutral-950 border rounded px-3 py-1.5 text-xs font-mono text-center tracking-widest text-amber-400 focus:outline-none transition-colors ${
                      incorrectField === 'cvv'
                        ? 'border-red-500 bg-red-950/30 ring-2 ring-red-500/50'
                        : 'border-neutral-700 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Amount & Transaction Type */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CHARGE">Authorization Charge</option>
                    <option value="REFUND_FEE">Cancellation Fee</option>
                    <option value="AUTH">Identity Verification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    Amount ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-neutral-500 font-mono">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="1499"
                      className={`w-full bg-neutral-950 border rounded pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none transition-colors ${
                        incorrectField === 'amount'
                          ? 'border-red-500 bg-red-950/30 ring-2 ring-red-500/50 text-red-200'
                          : 'border-neutral-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status or Error Message (Clear INCORRECT feedback) */}
              {statusMessage && (
                <div
                  className={`p-2.5 rounded-lg text-[11px] font-mono cartoon-card-sm ${
                    statusMessage.includes('SUCCESS')
                      ? 'bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300'
                      : statusMessage.toUpperCase().includes('INCORRECT') || statusMessage.includes('DECLINED') || statusMessage.includes('ERROR')
                      ? 'bg-red-950/95 border-2 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-fast'
                      : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                  }`}
                >
                  {statusMessage.toUpperCase().includes('INCORRECT') ? (
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none">⚠️</span>
                      <div>
                        <div className="font-bold text-red-400 tracking-wider text-[11px] flex items-center gap-1">
                          <span>INCORRECT TERMINAL INPUT</span>
                        </div>
                        <div className="mt-0.5 text-red-200 text-[11px] leading-relaxed">
                          {statusMessage}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span>{statusMessage}</span>
                  )}
                </div>
              )}

              {/* Drained / Settled alert banner */}
              {currentCaller?.isDrained && (
                <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-600/70 text-amber-300 font-mono text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold block">TRANSACTION SETTLED - CARD LIMIT EXHAUSTED</span>
                    <span className="text-[10px] text-amber-200/80">Funds were already extracted from this caller. Dial next caller on phone to process new cardholder transactions.</span>
                  </div>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcessTransaction}
                disabled={isProcessing || Boolean(currentCaller?.isDrained)}
                className={`w-full py-2.5 font-bold rounded-lg text-xs font-mono tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                  currentCaller?.isDrained
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer'
                }`}
              >
                {currentCaller?.isDrained ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>CARD LIMIT DEPLETED (ALREADY REDEEMED)</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AUTHORIZING SETTLEMENT...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>PROCESS TRANSACTION (${parseFloat(amount || '0').toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Terminal Thermal Receipt */}
        {activeTab === 'receipt' && lastReceipt && (
          <div className="max-w-xs mx-auto bg-neutral-100 text-neutral-900 p-5 rounded font-mono text-[11px] shadow-2xl space-y-3 select-text">
            <div className="text-center border-b border-dashed border-neutral-400 pb-2">
              <div className="font-bold text-sm tracking-wider">APEX MERCHANT SERVICES</div>
              <div className="text-[10px] text-neutral-600">TERMINAL ID: #APX-9014</div>
              <div className="text-[10px] text-neutral-600">{lastReceipt.timestamp}</div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>CARDHOLDER:</span>
                <span className="font-bold">{lastReceipt.cardholder}</span>
              </div>
              <div className="flex justify-between">
                <span>ACCOUNT:</span>
                <span className="font-bold">{lastReceipt.maskedCard}</span>
              </div>
              <div className="flex justify-between">
                <span>ENTRY METHOD:</span>
                <span>KEYED MANUAL</span>
              </div>
              <div className="flex justify-between">
                <span>AUTH CODE:</span>
                <span className="font-bold text-emerald-800">{lastReceipt.authCode}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-neutral-400 py-2 flex justify-between text-sm font-bold">
              <span>TOTAL PROCESSED:</span>
              <span className="text-emerald-700">${lastReceipt.amount.toLocaleString()}</span>
            </div>

            <div className="text-center text-[10px] text-neutral-600 pt-1">
              STATUS: TRANSACTION APPROVED
              <br />
              FUNDS TRANSFERRED TO OPERATOR ACCOUNT
            </div>

            <button
              onClick={() => setActiveTab('terminal')}
              className="w-full mt-2 py-1.5 bg-neutral-900 text-white rounded text-xs font-mono font-bold cursor-pointer hover:bg-neutral-800"
            >
              Back to Virtual Terminal
            </button>
          </div>
        )}

        {/* Tab 3: History Ledger */}
        {activeTab === 'history' && (
          <div className="space-y-2 max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono pb-1 border-b border-neutral-800">
              <span>PROCESSED CARDS LEDGER</span>
              <span className="text-emerald-400 font-bold">
                TOTAL: ${history.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 text-neutral-600 font-mono">
                No cards processed this shift yet.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-neutral-800 rounded p-2.5 flex items-center justify-between font-mono text-xs"
                >
                  <div>
                    <div className="font-bold text-neutral-200">{item.cardholder}</div>
                    <div className="text-[10px] text-neutral-500">
                      {item.maskedCard} • {item.timestamp} • {item.authCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">+${item.amount.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">SETTLED</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
