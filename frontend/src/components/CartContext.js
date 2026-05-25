import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart([]);
        setLoading(false);
        return;
      }
      const res = await axios.get('http://localhost:5000/api/cart', {
        headers: { 'x-auth-token': token }
      });
      if (res.data.success) {
        // Filter out items with null serviceId (deleted/re-seeded services)
        const validItems = (res.data.data.items || []).filter(item => item.serviceId != null);
        setCart(validItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (service) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 'error';

      const alreadyInCart = cart.find(item => item.serviceId && item.serviceId._id === service._id);
      if (alreadyInCart) return 'already';

      const res = await axios.post('http://localhost:5000/api/cart/add',
        { serviceId: service._id, quantity: 1 },
        { headers: { 'x-auth-token': token } }
      );
      if (res.data.success) {
        const validItems = (res.data.data.items || []).filter(item => item.serviceId != null);
        setCart(validItems);
        return 'added';
      }
      return 'error';
    } catch (error) {
      console.error('Failed to add to cart:', error?.response?.data || error?.message);
      return 'error';
    }
  };

  const updateQuantity = async (serviceId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/cart/update',
        { serviceId, quantity },
        { headers: { 'x-auth-token': token } }
      );
      if (res.data.success) {
        setCart(res.data.data.items);
      }
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (serviceId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/cart/remove/${serviceId}`, {
        headers: { 'x-auth-token': token }
      });
      if (res.data.success) {
        setCart(res.data.data.items);
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/cart/clear', {
        headers: { 'x-auth-token': token }
      });
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + ((item.serviceId?.price || 0) * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartItemCount,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
