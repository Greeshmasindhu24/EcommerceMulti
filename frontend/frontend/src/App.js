import React, { useState, useEffect } from "react";
import axios from "axios";
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetails from "./pages/ProductDetails";
import CartCheckout from "./pages/CartCheckout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ChatAgent from "./components/ChatAgent";

import "./index.css";

const API = "http://127.0.0.1:5000"; // Assuming local flask for development

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  // Check login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    if (token && email) {
      setUser({ email });
    }
  }, []);

  const addToCart = (p) => {
    const exist = cart.find(i => i.id === p.id);
=======
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import Cart from "./Cart";
import Checkout from "./Checkout";
import Dashboard from "./Dashboard";
import ChatAgent from "./components/ChatAgent";

// ✅ Backend URL
const API = "https://ecommerceagent-app.onrender.com";

export default function App() {
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]); // ✅ NEW

  // ✅ Check login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ email: "user@example.com" });
    }
  }, []);

  // ✅ Fetch products
  useEffect(() => {
    axios.get(`${API}/products/${category}`)
      .then(res => setProducts(res.data))
      .catch(err => console.error("Error fetching products:", err));
  }, [category]);

  // ✅ Add to cart
  const addToCart = (p) => {
    const exist = cart.find(i => i.id === p.id);

>>>>>>> 3d02b33b310cc7780fd9298f6e256189842c90cc
    if (exist) {
      setCart(cart.map(i =>
        i.id === p.id ? { ...i, qty: (i.qty || 1) + 1 } : i
      ));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
  };

<<<<<<< HEAD
  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} setUser={setUser} cartCount={cart.reduce((a, c) => a + (c.qty || 1), 0)} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/products/:category" element={<ProductList addToCart={addToCart} />} />
            <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />


            <Route path="/cart" element={<CartCheckout cart={cart} setCart={setCart} setOrders={setOrders} user={user} />} />

            <Route path="/dashboard" element={user ? <Dashboard user={user} orders={orders} /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <footer style={{ textAlign: "center", padding: "40px 20px", background: "var(--card-bg)", marginTop: "40px", borderTop: "1px solid var(--border-color)" }}>
          <p>© 2026 StyleTech Store. All rights reserved.</p>
        </footer>

        <ChatAgent />
=======
  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <Router>
      <div style={{ fontFamily: "sans-serif" }}>

        {/* 🔥 HEADER */}
        {user && (
          <div style={{
            background: "#2874f0",
            padding: "10px",
            color: "white",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <h2>🛒 Welcome to MyStore</h2>

            <div style={{ display: "flex", gap: "15px" }}>
              <Link to="/" style={{ color: "white" }}>Home</Link>
              <Link to="/cart" style={{ color: "white" }}>Cart ({cart.length})</Link>
              <Link to="/dashboard" style={{ color: "white" }}>Dashboard</Link>

              <button onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}

        <Routes>

          {/* 🔐 REGISTER */}
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" />}
          />

          {/* 🏠 HOME */}
          <Route
            path="/"
            element={
              !user ? (
                <Login setUser={setUser} />
              ) : (
                <div style={{ padding: "20px" }}>

                  {/* CATEGORY FILTER */}
                  <div style={{ marginBottom: "20px" }}>
                    {["all", "grocery", "electronics", "fashion"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                          margin: "5px",
                          padding: "8px 15px",
                          background: category === cat ? "#2874f0" : "white",
                          color: category === cat ? "white" : "#2874f0",
                          border: "1px solid #2874f0",
                          borderRadius: "20px"
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* PRODUCTS */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "20px"
                  }}>
                    {products.map(p => (
                      <div key={p.id} style={{
                        padding: "15px",
                        borderRadius: "10px",
                        boxShadow: "0 0 10px rgba(0,0,0,0.1)"
                      }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: "100%", height: "200px", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/200";
                          }}
                        />

                        <h3>{p.name}</h3>
                        <p>₹{p.price}</p>

                        <button onClick={() => addToCart(p)}>
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              )
            }
          />

          {/* 🛒 CART */}
          <Route
            path="/cart"
            element={user ? <Cart cart={cart} /> : <Navigate to="/" />}
          />

          {/* 💳 CHECKOUT */}
          <Route
            path="/checkout"
            element={
              user
                ? <Checkout cart={cart} setOrders={setOrders} setCart={setCart} />
                : <Navigate to="/" />
            }
          />

          {/* 📊 DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              user
                ? <Dashboard user={user} orders={orders} />
                : <Navigate to="/" />
            }
          />

        </Routes>

        {/* 🤖 CHAT */}
        {user && <ChatAgent />}

>>>>>>> 3d02b33b310cc7780fd9298f6e256189842c90cc
      </div>
    </Router>
  );
}