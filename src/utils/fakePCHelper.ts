import { Caller, CallerPCData, FakePCFolder, FakePCFile } from '../types/game';

// Curated high quality puppy & pet photos with reliable CDNs
const DOG_PHOTOS = [
  {
    name: 'Barnaby_Sleeping_Pup.jpg',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=700&auto=format&fit=crop&q=80',
    caption: 'Little Barnaby curled up asleep on his favorite fluffy rug after an hour of playing fetch. Such an angel!',
    date: 'Yesterday, 3:14 PM',
    size: '1.8 MB',
  },
  {
    name: 'Daisy_Golden_Retriever.jpg',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=700&auto=format&fit=crop&q=80',
    caption: 'Daisy smiling at the park! Look at those brown eyes and floppy ears. Best companion in the world.',
    date: '3 days ago',
    size: '2.4 MB',
  },
  {
    name: 'Corgi_Pup_Curious.jpg',
    url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=700&auto=format&fit=crop&q=80',
    caption: 'Tilt of the head when you whisper the word "T-R-E-A-T"! Can never stay mad at this face.',
    date: 'Last week',
    size: '2.1 MB',
  },
  {
    name: 'Buster_In_Raincoat.jpg',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=700&auto=format&fit=crop&q=80',
    caption: 'Buster ready for his rainy morning walk. He refuses to step in puddles without his jacket.',
    date: '2 weeks ago',
    size: '1.9 MB',
  },
  {
    name: 'Two_Puppies_In_Grass.jpg',
    url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=700&auto=format&fit=crop&q=80',
    caption: 'Tired out after running laps in the backyard! Brother and sister taking an afternoon snooze.',
    date: 'Last month',
    size: '3.2 MB',
  },
];

const FAMILY_PHOTOS = [
  {
    name: 'Grandkids_Summer_Picnic.jpg',
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=700&auto=format&fit=crop&q=80',
    caption: 'Fourth of July barbecue with Tommy and little Lily! Tommy won the watermelon eating contest.',
    date: 'July 4, 2025',
    size: '2.7 MB',
  },
  {
    name: 'Garden_Spring_Blooms.jpg',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=700&auto=format&fit=crop&q=80',
    caption: 'The hydrangeas and peonies bloomed early this spring! Buster was sniffing every petal.',
    date: 'May 12, 2025',
    size: '3.1 MB',
  },
];

export function generateFakePCData(caller: Caller): CallerPCData {
  const isMale = caller.gender === 'male';
  const lastName = caller.name.split(' ').slice(1).join(' ') || 'User';
  const firstName = caller.name.split(' ')[0] || 'User';
  const bankNames = ['Chase Bank NA', 'Wells Fargo Federal Bank', 'Bank of America Wealth', 'Citibank Consumer', 'First National Horizon'];
  const bankName = bankNames[Math.abs(caller.avatarSeed) % bankNames.length];

  const routingNum = '0' + (10000000 + Math.floor(Math.random() * 89999999)).toString();
  const checkingAccNum = (1000000000 + Math.floor(Math.random() * 8999999999)).toString();
  const checkingBal = caller.card.balance || 1850;
  const savingsBal = Math.floor(checkingBal * 1.8 + 2400);
  const pin = String(1000 + Math.floor(Math.random() * 8999));
  const ssn = `${100 + Math.floor(Math.random() * 899)}-${10 + Math.floor(Math.random() * 89)}-${1000 + Math.floor(Math.random() * 8999)}`;

  // Determine personality pet name
  const petNames = ['Barnaby', 'Buster', 'Daisy', 'Milo', 'Bella', 'Charlie', 'Cooper', 'Teddy'];
  const petName = petNames[Math.abs(caller.avatarSeed) % petNames.length];
  const petBreed = caller.personality.includes('Elderly') || caller.personality.includes('Sweet') 
    ? 'Golden Retriever' 
    : caller.personality.includes('Analytical') 
    ? 'Border Collie' 
    : 'Corgi';

  // Desktop Wallpaper
  const wallpaperUrl = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&auto=format&fit=crop&q=80';
  const wallpaperTitle = `${petName} the ${petBreed} (Puppy Days)`;

  // Folder 1: Banking & Financial Records
  const bankingFiles: FakePCFile[] = [
    {
      id: 'file_bank_checking',
      name: `${bankName.split(' ')[0]}_Checking_Acc_Details.txt`,
      type: 'bank',
      badge: 'FINANCIAL',
      dateModified: 'Today, 9:15 AM',
      size: '2.4 KB',
      content: `=====================================================
${bankName.toUpperCase()} - SECURE ACCOUNT RECORD
PRIMARY CHECKING ACCOUNT DETAILS
=====================================================
ACCOUNT HOLDER:     ${caller.name.toUpperCase()}
ROUTING NUMBER:     ${routingNum}
CHECKING ACC NO:    ${checkingAccNum}
AVAILABLE BALANCE:  $${checkingBal.toLocaleString()}.00 USD
PENDING TRANSACTIONS: $0.00
MONTHLY OVERDRAFT:   ENABLED ($1,000 LIMIT)
ONLINE USERNAME:    ${firstName.toLowerCase()}.${lastName.toLowerCase()}2026
EMERGENCY PIN:      ${pin}
SECURITY CHALLENGE: "What was your childhood dog's name?" -> "${petName}"
BRANCH CODE:        #4028 (Downtown Metro Branch)
=====================================================
CONFIDENTIAL: Keep this text document secure. Do not share with callers.`,
    },
    {
      id: 'file_bank_credit_card',
      name: 'Credit_Card_Emergency_Copy.txt',
      type: 'bank',
      badge: 'CARD',
      dateModified: 'Yesterday, 4:20 PM',
      size: '1.8 KB',
      content: `=====================================================
EMERGENCY CREDIT CARD RECORD (WALLET BACKUP)
=====================================================
CARD TYPE:          ${caller.card.brand}
CARDHOLDER:         ${caller.card.cardholder}
FULL 16-DIGIT NO:   ${caller.card.fullNumber}
EXPIRATION DATE:    ${caller.card.expiry}
3-DIGIT CVV CODE:   ${caller.card.cvv}
CARD LIMIT:         $${(caller.card.balance + 1500).toLocaleString()}.00
BILLING ZIP CODE:   ${90210 + (Math.abs(caller.avatarSeed) % 8000)}
TELEPHONE HOTLINE:  1-800-555-CARD
=====================================================
NOTE: Kept in case wallet is lost during grocery shopping.`,
    },
    {
      id: 'file_bank_taxes_ssn',
      name: 'Tax_Year_2025_and_SSN.txt',
      type: 'credentials',
      badge: 'SSN',
      dateModified: 'Jan 15, 2026',
      size: '1.2 KB',
      content: `FEDERAL TAX FILING SUMMARY - TAX YEAR 2025
NAME:             ${caller.name}
SOCIAL SECURITY:  ${ssn}
DATE OF BIRTH:    ${(Math.abs(caller.avatarSeed) % 11) + 1}/14/${1945 + (Math.abs(caller.avatarSeed) % 45)}
STATUS:           ${caller.age > 62 ? 'RETIRED (Social Security Pension Active)' : 'EMPLOYED'}
PENSION DEPOSIT:  $${(1800 + (Math.abs(caller.avatarSeed) % 1200)).toLocaleString()}.00 / month
ACCOUNTANT:       Miller & Associates Tax Advisory`,
    },
    {
      id: 'file_bank_statement_pdf',
      name: 'Monthly_Bank_Statement_May.pdf',
      type: 'pdf',
      badge: 'PDF',
      dateModified: 'May 31, 2026',
      size: '348 KB',
      content: `[PREVIEW OF PDF STATEMENT - ${bankName}]
Summary of Account Activity for ${caller.name}
Starting Balance: $${(checkingBal + 350).toLocaleString()}.00
Direct Deposits: +$2,450.00 (Social Security Administration)
Debits / Outflows:
- Kroger Supermarket: -$142.18
- City Water & Power: -$88.40
- Chewy.com (${petName} Puppy Kibble & Chews): -$74.99
- Pharmacy Co-pay: -$25.00
Ending Settled Balance: $${checkingBal.toLocaleString()}.00`,
    },
  ];

  // Folder 2: Cute Dogs & Puppies (Requested specifically by user)
  const dogFiles: FakePCFile[] = [
    {
      id: 'dog_photo_1',
      name: DOG_PHOTOS[0].name,
      type: 'image',
      imageUrl: DOG_PHOTOS[0].url,
      caption: DOG_PHOTOS[0].caption,
      badge: 'CUTE PUPPY',
      dateModified: DOG_PHOTOS[0].date,
      size: DOG_PHOTOS[0].size,
    },
    {
      id: 'dog_photo_2',
      name: DOG_PHOTOS[1].name,
      type: 'image',
      imageUrl: DOG_PHOTOS[1].url,
      caption: DOG_PHOTOS[1].caption,
      badge: 'GOOD BOY',
      dateModified: DOG_PHOTOS[1].date,
      size: DOG_PHOTOS[1].size,
    },
    {
      id: 'dog_photo_3',
      name: DOG_PHOTOS[2].name,
      type: 'image',
      imageUrl: DOG_PHOTOS[2].url,
      caption: DOG_PHOTOS[2].caption,
      badge: 'ADORABLE',
      dateModified: DOG_PHOTOS[2].date,
      size: DOG_PHOTOS[2].size,
    },
    {
      id: 'dog_photo_4',
      name: DOG_PHOTOS[3].name,
      type: 'image',
      imageUrl: DOG_PHOTOS[3].url,
      caption: DOG_PHOTOS[3].caption,
      badge: 'SWEET DOG',
      dateModified: DOG_PHOTOS[3].date,
      size: DOG_PHOTOS[3].size,
    },
    {
      id: 'dog_photo_5',
      name: DOG_PHOTOS[4].name,
      type: 'image',
      imageUrl: DOG_PHOTOS[4].url,
      caption: DOG_PHOTOS[4].caption,
      badge: 'PUPPY PLAY',
      dateModified: DOG_PHOTOS[4].date,
      size: DOG_PHOTOS[4].size,
    },
    {
      id: 'dog_notes_vet',
      name: `${petName}_Vet_Health_Record.txt`,
      type: 'text',
      badge: 'VET NOTES',
      dateModified: '3 days ago',
      size: '1.5 KB',
      content: `=====================================================
PET MEDICAL & HEALTH RECORD
PET NAME:         ${petName}
BREED:            ${petBreed}
AGE:              8 Months Old
FAVORITE THINGS:  Peanut butter spoonfuls, chasing tennis balls, belly scratches.
FEARS:            The loud vacuum cleaner, thunderstorm rumblings.
MICROCHIP ID:     985-140-928-112
VET CLINIC:       Sunny Paws Animal Hospital (Dr. Thompson)
NEXT VACCINE:     Due in October (Rabies Booster & Heartworm)
SPECIAL NOTE:     "He is the gentlest puppy in the neighborhood. Must give 2 treats before bedtime!"`,
    },
    {
      id: 'dog_recipe',
      name: 'Homemade_Puppy_Treats_Recipe.txt',
      type: 'text',
      badge: 'RECIPE',
      dateModified: 'Last Sunday',
      size: '950 B',
      content: `HOMEMADE CRUNCHY DOGGY COOKIES:
1. 2 cups rolled oats (blended into flour)
2. 1 cup pure pumpkin puree (NOT pie mix!)
3. 1/2 cup creamy unsalted peanut butter (NO xylitol)
4. 1 egg
Bake at 350 F for 25 minutes until golden brown. ${petName} goes crazy whenever the oven timer dings!`,
    },
  ];

  // Folder 3: Family & Memories
  const familyFiles: FakePCFile[] = [
    {
      id: 'fam_photo_1',
      name: FAMILY_PHOTOS[0].name,
      type: 'image',
      imageUrl: FAMILY_PHOTOS[0].url,
      caption: FAMILY_PHOTOS[0].caption,
      badge: 'FAMILY',
      dateModified: FAMILY_PHOTOS[0].date,
      size: FAMILY_PHOTOS[0].size,
    },
    {
      id: 'fam_photo_2',
      name: FAMILY_PHOTOS[1].name,
      type: 'image',
      imageUrl: FAMILY_PHOTOS[1].url,
      caption: FAMILY_PHOTOS[1].caption,
      badge: 'SPRING',
      dateModified: FAMILY_PHOTOS[1].date,
      size: FAMILY_PHOTOS[1].size,
    },
    {
      id: 'fam_notes',
      name: 'Birthday_List_and_Gifts.txt',
      type: 'text',
      badge: 'NOTES',
      dateModified: 'May 2, 2026',
      size: '1.1 KB',
      content: `UPCOMING BIRTHDAYS:
- Tommy (Grandson): June 14 -> Buy Lego Space Shuttle set
- Lily (Granddaughter): August 22 -> Art watercolor painting kit
- Sister Carol: November 4 -> Lavender hand lotion & cozy knit socks
Remember to mail birthday cards 4 days early with a $20 bill inside!`,
    },
  ];

  // Folder 4: Passwords & Secret Logins
  const passwordFiles: FakePCFile[] = [
    {
      id: 'pass_notes',
      name: 'ALL_PASSWORDS_DO_NOT_LOSE.txt',
      type: 'credentials',
      badge: 'PASSWORDS',
      dateModified: 'Last Tuesday',
      size: '1.4 KB',
      content: `=====================================================
MY DESKTOP PASSWORD REMINDER LIST
(Written down because I always forget!)
=====================================================
WINDOWS LOGIN:         ${firstName}2026!
${bankName.toUpperCase()}:  ${petName}Puppy${caller.age}!
ONLINE EMAIL:          ${petName}Lover99@webmail.net
AMAZON SHOPPING:       Fluffy${petName}123#
NETFLIX ACCOUNT:       GoldenPuppies2024
ROUTING NUMBER:        ${routingNum}
BANK ACCOUNT:          ${checkingAccNum}
SECURITY PIN:          ${pin}
=====================================================
NOTE: Grandson Tommy said not to keep passwords on the desktop, but who else would ever read this?`,
    },
  ];

  // Folder 5: Recycle Bin (Hilarious discarded files)
  const trashFiles: FakePCFile[] = [
    {
      id: 'trash_1',
      name: 'Spam_Amazon_Renewal_Invoice_FAKE.txt',
      type: 'text',
      badge: 'DELETED',
      dateModified: 'May 10, 2026',
      size: '800 B',
      content: `DELETED EMAIL:
Subject: Warning! Your Geek Total Tech auto-renewed for $499.00!
"Dear Customer, if you did not authorize this charge call 1-800-SCAM immediately."
Note: I thought this looked fishy so I moved it to the trash!`,
    },
    {
      id: 'trash_2',
      name: 'Cancelled_Chewy_Order_Receipt.pdf',
      type: 'pdf',
      badge: 'RECEIPT',
      dateModified: 'April 20, 2026',
      size: '120 KB',
      content: `Chewy.com Order #99104 - Status: Delivered
Items: 1x Extra Large Plush Dog Bed, 2x Squeaky Rubber Duckies for ${petName}. Total: $54.20`,
    },
  ];

  const folders: FakePCFolder[] = [
    {
      id: 'folder_banking',
      name: 'Banking & Financials',
      iconType: 'folder-bank',
      description: 'Account statements, routing numbers, and credit cards',
      badgeCount: bankingFiles.length,
      files: bankingFiles,
    },
    {
      id: 'folder_dogs',
      name: `Cute Dogs & ${petName} 🐶`,
      iconType: 'folder-dog',
      description: `Adorable photos, puppy memories, and vet health notes for ${petName}`,
      badgeCount: dogFiles.length,
      files: dogFiles,
    },
    {
      id: 'folder_family',
      name: 'Family & Grandkids',
      iconType: 'folder-family',
      description: 'Grandchildren snapshots, picnic memories, and birthday lists',
      badgeCount: familyFiles.length,
      files: familyFiles,
    },
    {
      id: 'folder_passwords',
      name: 'Passwords & Logins',
      iconType: 'folder-passwords',
      description: 'Saved credentials and security question reminders',
      badgeCount: passwordFiles.length,
      files: passwordFiles,
    },
    {
      id: 'folder_trash',
      name: 'Recycle Bin',
      iconType: 'folder-trash',
      description: 'Recently deleted invoices, spam alerts, and draft emails',
      badgeCount: trashFiles.length,
      files: trashFiles,
    },
  ];

  return {
    osName: caller.age > 65 ? 'Windows 10 Home (Legacy Build)' : 'Windows 11 Home Edition',
    computerName: `${firstName.toUpperCase()}-DESKTOP`,
    ipAddress: `192.168.1.${100 + (Math.abs(caller.avatarSeed) % 150)}`,
    themeTitle: `${petName} the ${petBreed}`,
    wallpaperUrl,
    wallpaperType: 'cute_puppy',
    folders,
    stickyNote: {
      title: `📝 Sticky Note: ${petName} & Chores`,
      text: `1. Call vet about ${petName}'s ear drops\n2. Water the front yard hydrangeas\n3. Bank Routing: ${routingNum}\n4. PIN: ${pin}`,
      color: 'bg-amber-100 border-amber-300 text-amber-950',
    },
    bankAccount: {
      bankName,
      accountNumber: checkingAccNum,
      routingNumber: routingNum,
      checkingBalance: checkingBal,
      savingsBalance: savingsBal,
      loginUsername: `${firstName.toLowerCase()}.${lastName.toLowerCase()}2026`,
      securityQuestionAnswer: petName,
      pin,
    },
  };
}
