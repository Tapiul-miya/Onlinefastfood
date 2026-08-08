export type FoodCategory = 'all' | 'biryani' | 'burgers' | 'pizza' | 'chicken' | 'sides' | 'drinks' | 'desserts';

export interface FoodOptionChoice {
  id: string;
  name: string;
  price: number;
}

export interface FoodOptionGroup {
  id: string;
  title: string;
  required?: boolean;
  type: 'single' | 'multiple';
  choices: FoodOptionChoice[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  image: string;
  calories: number;
  prepTimeMinutes: number;
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
  isSpicy?: boolean;
  isVeg?: boolean;
  isOffer?: boolean;
  discountPercentage?: number;
  optionGroups?: FoodOptionGroup[];
}

export interface SelectedOption {
  groupId: string;
  groupTitle: string;
  choiceId: string;
  choiceName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: SelectedOption[];
  specialInstructions?: string;
  itemTotalPrice: number;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'on_the_way'
  | 'arriving'
  | 'delivered'
  | 'cancelled';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  photo: string;
  vehicleType: 'scooter' | 'bike' | 'car';
  vehiclePlate: string;
  rating: number;
  tripsCompleted: number;
  batteryLevel?: number;
}

export interface OrderLog {
  id: string;
  timestamp: string;
  status: OrderStatus;
  message: string;
  detail?: string;
  actor: 'system' | 'kitchen' | 'driver' | 'customer';
}

export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryMinutes: number;
  etaTimestamp: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    location: GeoPoint;
  };
  customerLocation: GeoPoint;
  driver: Driver;
  currentDriverLocation: GeoPoint;
  routeCoordinates: GeoPoint[];
  progressPercentage: number;
  orderLogs: OrderLog[];
  driverDistanceKm: number;
  driverSpeedKmh: number;
  chatMessages?: ChatMessage[];
  ratingSubmitted?: {
    foodRating: number;
    driverRating: number;
    feedback?: string;
  };
}

export type UserRole = 'customer' | 'driver' | 'kitchen' | 'admin';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'driver';
  text: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
  address?: string;
  avatar?: string;
  isLoggedIn: boolean;
  restaurantId?: string;
  vehicleNumber?: string;
  employeeId?: string;
  tripsCompleted?: number;
  rating?: number;
  assignedHub?: string;
  isDutyActive?: boolean;
  securityKey?: string;
}

