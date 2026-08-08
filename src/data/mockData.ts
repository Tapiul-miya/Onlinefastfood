import { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'f1',
    name: 'কলকাতা স্পেশাল খাসির বিরিয়ানি (Kolkata Mutton Biryani with Egg & Potato)',
    description: 'সুগন্ধি বাসমতি চাল, খাসির নরম তুলতুলে মাংস, সাথে বিশেষ সেদ্ধ আলু ও ডিম দিয়ে তৈরি কলকাতার বিখ্যাত পার্ক স্ট্রিট শাহী কাচ্চি বিরিয়ানি।',
    price: 3.80, // ~$3.80 => ₹310 INR
    category: 'biryani',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=800',
    calories: 850,
    prepTimeMinutes: 12,
    rating: 4.9,
    reviewsCount: 3420,
    isPopular: true,
    optionGroups: [
      {
        id: 'portion',
        title: 'পরিমাণ নির্বাচন (Portion Size)',
        required: true,
        type: 'single',
        choices: [
          { id: 'p1', name: 'হাফ প্লেট (১ পিস আলু + ১ পিস খাসির মাংস + ১ ডিম)', price: 0 },
          { id: 'p2', name: 'ফুল প্লেট (১ পিস আলু + ২ পিস খাসির মাংস + ১ ডিম)', price: 1.50 },
          { id: 'p3', name: 'ফ্যামিলি প্যাক (৪ জনের জন্য স্পেশাল বিরিয়ানি)', price: 6.00 },
        ],
      },
      {
        id: 'extras',
        title: 'সাইড ডিশ ও দই',
        type: 'multiple',
        choices: [
          { id: 'e1', name: 'ঠান্ডা মালাই লসি / রায়তা (২৫০ মি.লি.)', price: 0.60 },
          { id: 'e2', name: 'কলকাতার মিষ্টি দই', price: 0.50 },
          { id: 'e3', name: 'এক্সট্রা বিরিয়ানি আলু', price: 0.30 },
        ],
      },
    ],
  },
  {
    id: 'f2',
    name: 'স্ম্যাশ বিফ মনস্টার বার্গার (Triple Beef Smash Burger)',
    description: '৩টি চিজ স্ম্যাশড বিফ প্যাটি, ক্রিসপি বেকন, ক্যারেমেলাইজড পেঁয়াজ ও স্পেশাল ফাস্টবাইট সস দিয়ে তৈরি রসালো বার্গার।',
    price: 3.20, // ~$3.20 => ৳380 BDT / ₹260 INR
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    calories: 920,
    prepTimeMinutes: 10,
    rating: 4.9,
    reviewsCount: 1840,
    isPopular: true,
    optionGroups: [
      {
        id: 'cheese',
        title: 'এক্সট্রা চিজ ও সস',
        type: 'multiple',
        choices: [
          { id: 'c1', name: 'ডাবল চダー চিজ', price: 0.50 },
          { id: 'c2', name: 'স্পাইসি নাগা সস', price: 0.20 },
        ],
      },
    ],
  },
  {
    id: 'f3',
    name: 'স্পাইসি নাগা ক্রিসপি চিকেন রোল (Naga Chicken Roll)',
    description: 'মুচমুচে ভাজা চিকেন, তাজা সালাদ, মেয়োনিজ ও তীব্র নাগা মরিচের রসে মাখানো কলকাতার কোলকাটা হট কাঠি রোল।',
    price: 1.60, // ~$1.60 => ৳190 BDT / ₹130 INR
    category: 'chicken',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800',
    calories: 540,
    prepTimeMinutes: 8,
    rating: 4.8,
    reviewsCount: 1120,
    isPopular: true,
    isSpicy: true,
  },
  {
    id: 'f4',
    name: 'ডাবল চেডার পেপারোনি ও পনির পিজ্জা (12" Pizza)',
    description: 'হাতিয়ার হাত দিয়ে তৈরি নরম মেজ পিজ্জা বেস, সমৃদ্ধ টমেটো সস, ডাবল মোজারেলা, চেডার চিজ ও স্পাইসি পেপারোনি।',
    price: 5.50, // ~$5.50 => ৳650 BDT / ₹450 INR
    category: 'pizza',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800',
    calories: 1250,
    prepTimeMinutes: 15,
    rating: 4.9,
    reviewsCount: 2950,
    isPopular: true,
  },
  {
    id: 'f5',
    name: 'মুঘলাই পরোটা ও আলুর দম কম্বো (Mughlai Paratha Combo)',
    description: 'ডিম ও কিমা দিয়ে ভাঁজ করা মুচমুচে শাহী মুঘলাই পরোটা, ঝাল আলুর দম ও সালাদ।',
    price: 1.80, // ~$1.80 => ৳210 BDT / ₹150 INR
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
    calories: 610,
    prepTimeMinutes: 7,
    rating: 4.7,
    reviewsCount: 890,
  },
  {
    id: 'f6',
    name: 'কলকাতায় স্পেশাল বাটার চিকেন ও নান (Butter Chicken & Naan)',
    description: 'নরম তুলতুলে বাটার নান এবং ঘন কিসমিস-মাখনের ক্রিমি গ্রাভিতে রান্না করা তন্দুরি চিকেন।',
    price: 4.20, // ~$4.20 => ৳490 BDT / ₹350 INR
    category: 'chicken',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=800',
    calories: 780,
    prepTimeMinutes: 14,
    rating: 4.9,
    reviewsCount: 1670,
  },
  {
    id: 'f7',
    name: 'ঠান্ডা মালাই আম লসি (Fresh Mango Malai Lassi)',
    description: 'মিষ্টি দই, তাটা পাকা আমের পাল্প ও কিসমিস-কাঠবাদাম ছিটানো ঠান্ডা ক্রিমি লসি (৫০০ মি.লি.)।',
    price: 1.20, // ~$1.20 => ৳140 BDT / ₹100 INR
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800',
    calories: 320,
    prepTimeMinutes: 3,
    rating: 4.9,
    reviewsCount: 2410,
    isPopular: true,
  },
  {
    id: 'f8',
    name: 'গরম রসগোল্লা ও চকোলেট চুরোস (Rasgulla & Churros)',
    description: '৪ পিস স্পঞ্জ রসগোল্লা অথবা ক্রিসপি ডিপ ফ্রাইড চকোলেট ডিপিং চুরোস।',
    price: 1.50, // ~$1.50 => ৳175 BDT / ₹120 INR
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1624371414361-e670edf4898d?auto=format&fit=crop&q=80&w=800',
    calories: 410,
    prepTimeMinutes: 4,
    rating: 4.8,
    reviewsCount: 920,
  },
  {
    id: 'f9',
    name: 'কুড়মুড়ে নাগা ফ্রাইড চিকেন উইংস (6pcs Naga Wings)',
    description: 'মচমচে ফ্রাইড চিকেন উইংস, তীব্র নাগা সসে মাখানো সঙ্গে ক্রিসপি ফ্রেঞ্চ ফ্রাইজ।',
    price: 2.80, // ~$2.80 => ৳330 BDT / ₹230 INR
    category: 'chicken',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800',
    calories: 720,
    prepTimeMinutes: 10,
    rating: 4.8,
    reviewsCount: 1450,
    isSpicy: true,
  },
];
