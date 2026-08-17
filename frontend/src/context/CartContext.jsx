import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "raritone_cart";

function readCart() {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);

    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Failed to read cart:", error);
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((currentCart) => {
      const productId = product._id;

      const existingProduct = currentCart.find(
        (item) => item.productId === productId
      );

      const stock = Number(product.stock) || 999;

      if (existingProduct) {
        return currentCart.map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(
              item.quantity + quantity,
              stock
            ),
            stock,
          };
        });
      }

      return [
        ...currentCart,
        {
          productId,
          name: product.name,
          image: product.image,
          price: Number(product.price) || 0,
          quantity,
          stock,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const stock = Number(item.stock) || 999;

        const newQuantity = Math.max(
          1,
          Math.min(Number(quantity), stock)
        );

        return {
          ...item,
          quantity: newQuantity,
        };
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.productId !== productId
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal,
    }),
    [cart, cartCount, cartTotal]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}