export interface FakeCard {
  brand: string;
  fullNumber: string;
  maskedNumber: string;
  expiry: string;
  cvv: string;
  balance: number;
  cardholder: string;
  revealedDigits: number;
  cvvRevealed: boolean;
  expiryRevealed: boolean;
  numberRevealed: boolean;
}

export interface FakePCFile {
  id: string;
  name: string;
  type: 'text' | 'image' | 'pdf' | 'bank' | 'credentials';
  content?: string;
  imageUrl?: string;
  caption?: string;
  badge?: string;
  dateModified?: string;
  size?: string;
}

export interface FakePCFolder {
  id: string;
  name: string;
  iconType: 'folder-bank' | 'folder-dog' | 'folder-family' | 'folder-work' | 'folder-passwords' | 'folder-trash';
  description: string;
  badgeCount?: number;
  files: FakePCFile[];
}

export interface CallerPCData {
  osName: string;
  computerName: string;
  ipAddress: string;
  themeTitle: string;
  wallpaperUrl: string;
  wallpaperType: 'cute_puppy' | 'dogs_playing' | 'cozy_garden' | 'family_retiree' | 'retro_windows';
  folders: FakePCFolder[];
  stickyNote?: {
    title: string;
    text: string;
    color: string;
  };
  bankAccount: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    checkingBalance: number;
    savingsBalance: number;
    loginUsername: string;
    securityQuestionAnswer: string;
    pin: string;
  };
}

export interface Caller {
  id: string;
  name: string;
  gender: 'male' | 'female';
  nameRevealed: boolean;
  archetype: string;
  personality: string;
  personalityDescription?: string;
  age: number;
  voice: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

  avatarSeed: number;
  avatarColor: string;
  hook: string;
  connectionCode: string;
  connectionCodeRevealed: boolean;
  card: FakeCard;
  suspicion: number; // 0 - 100
  gullibility: number; // 0 - 100
  patience: number; // in seconds
  dialogueHistory: { role: 'caller' | 'player'; text: string }[];

  // Glitch fix: prevents duplicate transactions/redemptions on same caller
  isDrained?: boolean;
  drainedAmount?: number;
  drainedAt?: string;
  drainedReason?: string;

  // Remote desktop PC data for AnyViewer
  pcData?: CallerPCData;
}

export interface PlayerStats {
  money: number;
  streak: number;
  totalScammed: number;
  callersHandled: number;
  shiftDay: number;
  reputation: string;
}

export interface DialogueOption {
  id: string;
  category: 'tech' | 'card' | 'soothe' | 'lottery';
  text: string;
  risk: 'low' | 'medium' | 'high';
  successHint: string;
}

export interface UpgradeItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
}
