export interface Companion {
  id: string;
  userId?: string;
  name: string;
  createdAt?: string;
  age: number;
  location: string;
  bio: string;
  images: string[];
  services: string[];
  hourlyRate: number;
  overnightRate: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  gender: "female" | "male" | "non-binary";
  online: boolean;
}

export interface Booking {
  id: string;
  companionId: string;
  companionName: string;
  date: string;
  service: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  price: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "voice";
}

export interface ChatThread {
  id: string;
  companionId: string;
  companionName: string;
  companionImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}

const SERVICE_TAGS = [
  "Dinner Date", "Travel Companion", "Party Partner", "City Tour",
  "Event Plus-One", "Weekend Getaway", "Wine & Dine", "Art Gallery",
  "Concert Buddy", "Business Event"
];

export const companions: Companion[] = [
  {
    id: "1", name: "Valentina", age: 26, location: "Miami, FL",
    bio: "World traveler with a passion for fine dining and deep conversation. Let me be your perfect evening companion.",
    images: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
             "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop"],
    services: ["Dinner Date", "Travel Companion", "Wine & Dine"],
    hourlyRate: 250, overnightRate: 1500, rating: 4.9, reviewCount: 47,
    verified: true, featured: true, gender: "female", online: true
  },
  {
    id: "2", name: "Marcus", age: 29, location: "New York, NY",
    bio: "Sophisticated gentleman who knows every hidden jazz bar in the city. Your perfect plus-one for any occasion.",
    images: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop",
             "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"],
    services: ["Event Plus-One", "Business Event", "Concert Buddy"],
    hourlyRate: 200, overnightRate: 1200, rating: 4.8, reviewCount: 32,
    verified: true, featured: true, gender: "male", online: false
  },
  {
    id: "3", name: "Aria", age: 24, location: "Los Angeles, CA",
    bio: "Actress and model who brings magic to every moment. Adventure awaits with me by your side.",
    images: ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
             "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop"],
    services: ["Party Partner", "City Tour", "Art Gallery"],
    hourlyRate: 300, overnightRate: 1800, rating: 5.0, reviewCount: 61,
    verified: true, featured: true, gender: "female", online: true
  },
  {
    id: "4", name: "Sofia", age: 27, location: "Las Vegas, NV",
    bio: "The perfect blend of elegance and excitement. From high-end dinners to VIP nightlife.",
    images: ["https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop"],
    services: ["Dinner Date", "Party Partner", "Weekend Getaway"],
    hourlyRate: 275, overnightRate: 1600, rating: 4.7, reviewCount: 28,
    verified: true, featured: false, gender: "female", online: true
  },
  {
    id: "5", name: "James", age: 31, location: "Chicago, IL",
    bio: "Charming conversationalist and gourmet enthusiast. Let's make unforgettable memories together.",
    images: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop"],
    services: ["Dinner Date", "Business Event", "Wine & Dine"],
    hourlyRate: 225, overnightRate: 1300, rating: 4.6, reviewCount: 19,
    verified: false, featured: false, gender: "male", online: false
  },
  {
    id: "6", name: "Luna", age: 25, location: "Miami, FL",
    bio: "Bilingual beauty with a love for art, culture, and spontaneous adventures under moonlight.",
    images: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop"],
    services: ["Art Gallery", "City Tour", "Travel Companion"],
    hourlyRate: 260, overnightRate: 1550, rating: 4.9, reviewCount: 38,
    verified: true, featured: false, gender: "female", online: false
  },
];

export const chatThreads: ChatThread[] = [
  { id: "t1", companionId: "1", companionName: "Valentina", companionImage: companions[0].images[0],
    lastMessage: "Looking forward to Saturday! 🥂", lastMessageTime: "2 min ago", unread: 2, online: true },
  { id: "t2", companionId: "3", companionName: "Aria", companionImage: companions[2].images[0],
    lastMessage: "That gallery sounds amazing", lastMessageTime: "1 hr ago", unread: 0, online: true },
  { id: "t3", companionId: "2", companionName: "Marcus", companionImage: companions[1].images[0],
    lastMessage: "I know the perfect spot", lastMessageTime: "3 hrs ago", unread: 1, online: false },
];

export const chatMessages: ChatMessage[] = [
  { id: "m1", senderId: "1", text: "Hey! I saw you're interested in a dinner date 🍷", timestamp: "7:30 PM", status: "read", type: "text" },
  { id: "m2", senderId: "me", text: "Yes! I'd love to explore some fine dining options", timestamp: "7:32 PM", status: "read", type: "text" },
  { id: "m3", senderId: "1", text: "I know this incredible rooftop restaurant with a stunning view", timestamp: "7:33 PM", status: "read", type: "text" },
  { id: "m4", senderId: "me", text: "That sounds perfect. What about Saturday evening?", timestamp: "7:35 PM", status: "read", type: "text" },
  { id: "m5", senderId: "1", text: "Looking forward to Saturday! 🥂", timestamp: "7:36 PM", status: "delivered", type: "text" },
];

export const bookings: Booking[] = [
  { id: "b1", companionId: "1", companionName: "Valentina", date: "2026-04-18", service: "Dinner Date", status: "accepted", price: 500 },
  { id: "b2", companionId: "3", companionName: "Aria", date: "2026-04-20", service: "Art Gallery", status: "pending", price: 600 },
  { id: "b3", companionId: "2", companionName: "Marcus", date: "2026-04-10", service: "Business Event", status: "completed", price: 400 },
];

export const SERVICE_OPTIONS = SERVICE_TAGS;
