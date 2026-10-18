import React, { createContext, useContext, useState, useEffect } from 'react';
import { GreenMarketItem, CartItem, OrderRecord, User } from '../../types';
import { saveUserOrder, getUserOrders } from '../../services/firebase';
import { useRewards } from '../rewards/RewardsContext';

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  totalAmount: number;
  totalCreditsReward: number;
  totalCo2Avoided: number;
  addToCart: (item: GreenMarketItem, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  checkout: (
    user: User,
    paymentMethod: string,
    onSuccessCallback?: (order: OrderRecord, creditsAwarded: number) => void
  ) => Promise<OrderRecord>;
  buyProductNow: (
    user: User,
    product: GreenMarketItem,
    paymentMethod?: string
  ) => Promise<OrderRecord>;
  orders: OrderRecord[];
  loadingOrders: boolean;
  refreshOrders: (uid: string) => Promise<void>;
  lastCelebratedOrder: OrderRecord | null;
  setLastCelebratedOrder: (order: OrderRecord | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'carbonlens_cart_items_v1';
const LOCAL_ORDERS_KEY = 'carbonlens_local_orders_v1';

export const CartProvider: React.FC<{ children: React.ReactNode; currentUser: User | null }> = ({
  children,
  currentUser,
}) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_ORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [lastCelebratedOrder, setLastCelebratedOrder] = useState<OrderRecord | null>(null);
  const { addRewardPoints } = useRewards();

  // Sync cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [items]);

  // Sync orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    } catch (err) {
      console.warn('Failed to save orders to localStorage', err);
    }
  }, [orders]);

  // Load orders on user change
  useEffect(() => {
    if (currentUser?.uid && !currentUser.isDemo) {
      refreshOrders(currentUser.uid);
    }
  }, [currentUser?.uid, currentUser?.isDemo]);

  const refreshOrders = async (uid: string) => {
    setLoadingOrders(true);
    try {
      const fetched = await getUserOrders(uid);
      if (fetched && fetched.length > 0) {
        // Merge with local orders, sorted newest first
        setOrders(fetched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.warn('Could not load orders from Firestore:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const addToCart = (product: GreenMarketItem, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = parseFloat(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );

  const totalCreditsReward = items.reduce(
    (sum, item) => sum + item.creditsReward * item.quantity,
    0
  );

  const totalCo2Avoided = parseFloat(
    items.reduce((sum, item) => sum + item.co2AvoidedKg * item.quantity, 0).toFixed(1)
  );

  const checkout = async (
    user: User,
    paymentMethod: string,
    onSuccessCallback?: (order: OrderRecord, creditsAwarded: number) => void
  ): Promise<OrderRecord> => {
    const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const verificationHash = `CL-VERIFIED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const orderRecord: OrderRecord = {
      order_id: orderId,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        credits_reward: i.creditsReward * i.quantity,
        type: i.type,
      })),
      total_amount: totalAmount,
      credits_earned: totalCreditsReward,
      co2_avoided_kg: totalCo2Avoided,
      verification_status: 'VERIFIED',
      verification_hash: verificationHash,
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
    };

    // 1. Immediately award credits to live RewardsContext (wallet + ledger)
    const itemsSummary = items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    await addRewardPoints(
      totalCreditsReward,
      itemsSummary,
      orderId,
      {
        itemName: items[0]?.name,
        co2AvoidedKg: totalCo2Avoided,
      }
    );

    // 2. Persist order record to Firestore if real user
    if (!user.isDemo) {
      try {
        await saveUserOrder(user.uid, orderRecord);
      } catch (err) {
        console.warn('Could not persist order to Firestore directly; keeping in session:', err);
      }
    }

    // 3. Add to orders list locally
    setOrders((prev) => [orderRecord, ...prev]);
    setLastCelebratedOrder(orderRecord);

    // 4. Clear cart
    clearCart();

    if (onSuccessCallback) {
      onSuccessCallback(orderRecord, totalCreditsReward);
    }

    return orderRecord;
  };

  const buyProductNow = async (
    user: User,
    product: GreenMarketItem,
    paymentMethod = 'CarbonLens Instant EcoPay'
  ): Promise<OrderRecord> => {
    const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const verificationHash = `CL-VERIFIED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const orderRecord: OrderRecord = {
      order_id: orderId,
      items: [
        {
          id: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          credits_reward: product.creditsReward,
          type: product.type,
        },
      ],
      total_amount: product.price,
      credits_earned: product.creditsReward,
      co2_avoided_kg: product.co2AvoidedKg,
      verification_status: 'VERIFIED',
      verification_hash: verificationHash,
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
    };

    // Immediately award credits to live RewardsContext (wallet + ledger)
    await addRewardPoints(
      product.creditsReward,
      product.name,
      orderId,
      {
        itemName: product.name,
        co2AvoidedKg: product.co2AvoidedKg,
      }
    );

    // Persist to Firestore if real user
    if (!user.isDemo) {
      try {
        await saveUserOrder(user.uid, orderRecord);
      } catch (err) {
        console.warn('Could not persist order to Firestore:', err);
      }
    }

    setOrders((prev) => [orderRecord, ...prev]);
    setLastCelebratedOrder(orderRecord);

    return orderRecord;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        totalAmount,
        totalCreditsReward,
        totalCo2Avoided,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkout,
        buyProductNow,
        orders,
        loadingOrders,
        refreshOrders,
        lastCelebratedOrder,
        setLastCelebratedOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
