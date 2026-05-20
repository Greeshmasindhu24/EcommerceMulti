import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../api';

const Cart = ({ cartItems, clearCart, isAuthenticated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [customerName, setCustomerName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(null);
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const shipping = total > 5000 ? 0 : 500;
  const totalAmount = total + shipping;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!customerName.trim() || !shippingAddress.trim()) {
      alert('Please enter your name and shipping address before checkout.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        total_amount: totalAmount,
        items: cartItems,
        payment_method: paymentMethod,
        customer_name: customerName,
        shipping_address: shippingAddress
      };
      
      const response = await placeOrder(orderData);
      setTrackingNumber(response.tracking_number || null);
      setSuccess(true);
      clearCart();
    } catch (error) {
      console.error("Checkout failed:", error);
      const message = error.response?.data?.error || error.response?.data?.msg || error.message || "Checkout failed. Please try again.";
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 24px' }}>
        <h1 style={{ color: 'var(--success)', marginBottom: '16px' }}>Order Placed Successfully!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Thank you for shopping with STYLE.</p>
        {customerName && <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Order will be delivered to <strong>{customerName}</strong> at <strong>{shippingAddress}</strong>.</p>}
        {trackingNumber && <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your tracking number is <strong>{trackingNumber}</strong>.</p>}
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>View Orders</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Your Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
          <p>Your cart is empty.</p>
          <button className="btn btn-primary" onClick={() => navigate('/shop')} style={{ marginTop: '24px' }}>Go to Shop</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {cartItems.map((item, index) => (
              <div key={index} className="cart-item glass-panel">
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{item.name}</h3>
                  <div style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '16px' }}>{item.category}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{item.price.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary glass-panel">
            <h2 style={{ marginBottom: '24px' }}>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : '₹500'}</span>
            </div>
            <div className="summary-row">
              <span>Tax (Included)</span>
              <span>₹0</span>
            </div>
            <div className="summary-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ marginBottom: '12px', fontWeight: 600 }}>Payment Method</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['Credit Card', 'Cash on Delivery'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '999px',
                      border: paymentMethod === method ? '2px solid #111' : '1px solid #ccc',
                      background: paymentMethod === method ? '#111' : 'white',
                      color: paymentMethod === method ? 'white' : 'black',
                      cursor: 'pointer'
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <span style={{ marginTop: '10px', color: '#555', fontSize: '0.9rem' }}>
                This is a dummy transaction flow. No real money will be charged.
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Recipient Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Shipping Address</label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '32px', padding: '16px' }}
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Checkout with ${paymentMethod}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
