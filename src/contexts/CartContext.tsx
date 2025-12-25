import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string;
  type: string;
  name: string;
  duration: string;
  price: number;
  addedDate: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "addedDate">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  total: number;
  itemCount: number;
  checkout: (paymentMethod: string) => Promise<boolean>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "hoc10k_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load cart from localStorage for anonymous users or from database for logged-in users
  useEffect(() => {
    if (user) {
      loadCartFromDatabase();
    } else {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      setItems(stored ? JSON.parse(stored) : []);
    }
  }, [user]);

  // Save to localStorage when items change (for anonymous users)
  useEffect(() => {
    if (!user) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user]);

  const loadCartFromDatabase = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("user_carts")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      const cartItems: CartItem[] = data.map((item) => ({
        id: item.program_id,
        type: item.program_type,
        name: item.program_name,
        duration: item.duration,
        price: item.price,
        addedDate: new Date(item.added_at).toLocaleDateString("vi-VN"),
      }));
      setItems(cartItems);
      
      // Merge localStorage cart with database cart
      const localCart = localStorage.getItem(CART_STORAGE_KEY);
      if (localCart) {
        const localItems: CartItem[] = JSON.parse(localCart);
        for (const localItem of localItems) {
          if (!cartItems.find((i) => i.id === localItem.id)) {
            await saveItemToDatabase(localItem);
          }
        }
        localStorage.removeItem(CART_STORAGE_KEY);
        loadCartFromDatabase();
        return;
      }
    }
    setLoading(false);
  };

  const saveItemToDatabase = async (item: CartItem) => {
    if (!user) return;
    
    await supabase.from("user_carts").upsert({
      user_id: user.id,
      program_id: item.id,
      program_type: item.type,
      program_name: item.name,
      duration: item.duration,
      price: item.price,
    });
  };

  const removeItemFromDatabase = async (programId: string) => {
    if (!user) return;
    
    await supabase
      .from("user_carts")
      .delete()
      .eq("user_id", user.id)
      .eq("program_id", programId);
  };

  const clearCartInDatabase = async () => {
    if (!user) return;
    
    await supabase
      .from("user_carts")
      .delete()
      .eq("user_id", user.id);
  };

  const addItem = useCallback(async (item: Omit<CartItem, "addedDate">) => {
    if (items.find((i) => i.id === item.id)) return;
    
    const newItem: CartItem = {
      ...item,
      addedDate: new Date().toLocaleDateString("vi-VN"),
    };
    
    setItems((prev) => [...prev, newItem]);
    
    if (user) {
      await saveItemToDatabase(newItem);
    }
  }, [items, user]);

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    
    if (user) {
      await removeItemFromDatabase(id);
    }
  }, [user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    
    if (user) {
      await clearCartInDatabase();
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [user]);

  const checkout = useCallback(async (paymentMethod: string): Promise<boolean> => {
    if (!user || items.length === 0) return false;
    
    setLoading(true);
    
    // Insert all items into purchase history
    const purchases = items.map((item) => ({
      user_id: user.id,
      program_id: item.id,
      program_type: item.type,
      program_name: item.name,
      duration: item.duration,
      price: item.price,
      payment_method: paymentMethod,
    }));

    const { error } = await supabase.from("purchase_history").insert(purchases);
    
    if (error) {
      setLoading(false);
      return false;
    }
    
    // Clear the cart after successful purchase
    await clearCartInDatabase();
    setItems([]);
    setLoading(false);
    
    return true;
  }, [user, items]);

  const isInCart = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, isInCart, total, itemCount, checkout, loading }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
