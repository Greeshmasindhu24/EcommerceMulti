import os
import json
import random
import sqlite3
import psycopg2
from urllib.parse import urlparse, parse_qs, urlencode
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from google import genai

# ---------------- LOAD ENV ----------------
load_dotenv()

# ---------------- APP CONFIG ----------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
from datetime import timedelta

app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 24 * 7
jwt = JWTManager(app)

# ---------------- AI CONFIG ----------------
_ai_client = None

def get_ai_client():
    global _ai_client
    if _ai_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            _ai_client = genai.Client(api_key=api_key)
    return _ai_client

def generate_with_fallback(prompt):
    client = get_ai_client()
    
    # Try real API if client exists
    if client:
        models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]
        for model_name in models:
            try:
                response = client.models.generate_content(model=model_name, contents=prompt)
                if response and response.text:
                    return response.text
            except Exception as e:
                err_str = str(e)
                print(f"Model {model_name} failed: {e}")
    
    # Fallback: Generate dummy responses for testing
    print("\n⚠️  Using fallback test responses (API not available)\n")
    if "product" in prompt.lower() or "recommend" in prompt.lower():
        return "Great question! Our best sellers are MacBook Pro M3 (₹149,000), Dell XPS 15 (₹125,000), and our ASUS ROG Gaming Laptop (₹135,000). We also have premium fashion items like leather jackets and stylish dresses. What category interests you?"
    elif "order" in prompt.lower() or "track" in prompt.lower():
        return "You can track your orders in your account profile. Your recent orders are available there with real-time status updates. Would you like to know about a specific order?"
    elif "return" in prompt.lower() or "refund" in prompt.lower() or "policy" in prompt.lower():
        return "Our return policy allows 30 days for unused items in original packaging. Refunds are processed within 5-7 business days. Free shipping on orders over ₹5000. Need more details?"
    elif "payment" in prompt.lower() or "cash" in prompt.lower():
        return "We accept Credit/Debit Cards and Cash on Delivery. All payments are secure and processed instantly. Choose your preferred method at checkout!"
    else:
        return "Thanks for reaching out! I'm here to help with product recommendations, order tracking, payments, and store policies. What can I assist you with today?"

# ---------------- DB CONNECTION ----------------
_DB_IS_POSTGRES = None


def get_database_url():
    raw_url = os.getenv('POSTGRES_URL', '').strip() or os.getenv('DATABASE_URL', '').strip()
    if not raw_url:
        return ''

    parsed = urlparse(raw_url)
    if not parsed.scheme:
        return raw_url

    allowed_params = {
        'sslmode', 'connect_timeout', 'application_name', 'fallback_application_name',
        'options', 'sslrootcert', 'sslcert', 'sslkey', 'sslpassword'
    }
    query = parse_qs(parsed.query)
    filtered = {k: v for k, v in query.items() if k in allowed_params}
    cleaned_query = urlencode(filtered, doseq=True)
    return parsed._replace(query=cleaned_query).geturl()


def get_conn():
    if is_postgres():
        database_url = get_database_url()
        try:
            return psycopg2.connect(database_url)
        except Exception as e:
            print(f"⚠️  Could not connect to Postgres URL; falling back to SQLite. Error: {e}")
    return sqlite3.connect('ecommerce.db')


def is_postgres():
    global _DB_IS_POSTGRES
    if _DB_IS_POSTGRES is not None:
        return _DB_IS_POSTGRES

    database_url = get_database_url()
    if not database_url:
        _DB_IS_POSTGRES = False
        return False

    try:
        conn = psycopg2.connect(database_url)
        conn.close()
        _DB_IS_POSTGRES = True
    except Exception as e:
        print(f"⚠️  Postgres URL is set but cannot connect. Falling back to SQLite. Error: {e}")
        _DB_IS_POSTGRES = False
    return _DB_IS_POSTGRES


def adapt_query(query):
    return query.replace('?', '%s') if is_postgres() else query


def execute_query(cur, query, params=None):
    if params is None:
        params = ()
    cur.execute(adapt_query(query), params)
    return cur


def init_db():
    is_pg = is_postgres()
    conn = get_conn()
    try:
        cur = conn.cursor()
        if is_pg:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_email TEXT NOT NULL,
                total_amount NUMERIC NOT NULL,
                items TEXT NOT NULL,
                status TEXT DEFAULT 'Paid & Processing',
                payment_method TEXT DEFAULT 'Dummy Card',
                customer_name TEXT,
                shipping_address TEXT,
                tracking_number TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name TEXT,
                price NUMERIC,
                image TEXT,
                category TEXT,
                description TEXT,
                rating NUMERIC DEFAULT 4.5,
                reviews_count INTEGER DEFAULT 100,
                specs TEXT
            );
            """)
            cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;")
            cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;")
            cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;")
        else:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                total_amount REAL NOT NULL,
                items TEXT NOT NULL,
                status TEXT DEFAULT 'Paid & Processing',
                payment_method TEXT DEFAULT 'Dummy Card',
                customer_name TEXT,
                shipping_address TEXT,
                tracking_number TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                price REAL,
                image TEXT,
                category TEXT,
                description TEXT,
                rating REAL DEFAULT 4.5,
                reviews_count INTEGER DEFAULT 100,
                specs TEXT
            );
            """)
            cur.execute("PRAGMA table_info('orders');")
            existing_columns = [row[1] for row in cur.fetchall()]
            for column in ["customer_name", "shipping_address", "tracking_number"]:
                if column not in existing_columns:
                    cur.execute(f"ALTER TABLE orders ADD COLUMN {column} TEXT;")

        cur.execute("SELECT COUNT(*) FROM products;")
        count = cur.fetchone()[0]

        if count == 0:
            print("Seeding products...")
            cur.execute("""
            INSERT INTO products (name, price, image, category, description, rating, reviews_count, specs) VALUES
            ('MacBook Pro M3', 149000, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', 'laptops', 'The latest Apple MacBook Pro with M3 chip, delivering extraordinary performance and battery life.', 4.9, 340, '{"processor": "Apple M3", "ram": "16GB", "storage": "512GB SSD", "display": "14-inch Liquid Retina XDR"}'),
            ('Dell XPS 15', 125000, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600', 'laptops', 'Powerful Windows laptop featuring a stunning 4K OLED display and Intel Core i7 processor.', 4.7, 210, '{"processor": "Intel Core i7 13th Gen", "ram": "16GB", "storage": "1TB SSD", "display": "15.6-inch 4K OLED"}'),
            ('ASUS ROG Zephyrus G14', 135000, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600', 'laptops', 'High-performance gaming laptop with AMD Ryzen 9 and RTX 4060 in a compact 14-inch chassis.', 4.8, 150, '{"processor": "AMD Ryzen 9", "ram": "32GB", "storage": "1TB SSD", "display": "14-inch QHD 165Hz", "gpu": "NVIDIA RTX 4060"}'),
            ('Elegant Summer Dress', 2499, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600', 'fashion', 'A beautiful floral summer dress perfect for warm days and casual outings.', 4.6, 85, '{}'),
            ('Classic Leather Jacket', 5999, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', 'fashion', 'Premium faux leather jacket with a timeless design. Durable and stylish.', 4.8, 120, '{}'),
            ('Running Sneakers', 3499, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'fashion', 'Lightweight and comfortable running shoes with excellent grip and support.', 4.5, 430, '{}'),
            ('Wireless Noise-Cancelling Headphones', 12000, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 'electronics', 'Over-ear headphones with active noise cancellation and 30-hour battery life.', 4.7, 500, '{}'),
            ('Split Air Conditioner 1.5 Ton', 35000, 'https://images.unsplash.com/photo-1762341123870-d706f257a12e?w=1080', 'electronics', 'Energy efficient 5-star AC with fast cooling and low noise.', 4.6, 110, '{}'),
            ('Double Door Refrigerator', 28000, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600', 'electronics', 'Frost-free double door fridge with convertible freezer.', 4.8, 190, '{}'),
            ('Designer Handbag', 4500, 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600', 'fashion', 'Luxury PU leather handbag with spacious compartments and elegant design.', 4.7, 215, '{}'),
            ('Men''s Formal Suit', 8500, 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600', 'fashion', 'A sleek and modern two-piece formal suit.', 4.8, 140, '{}'),
            ('Casual Denim Jeans', 1899, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', 'fashion', 'Classic straight fit denim jeans for everyday wear.', 4.4, 300, '{}'),
            ('Stylish Aviator Sunglasses', 1299, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600', 'fashion', 'UV protected aviator sunglasses with a golden frame.', 4.5, 410, '{}'),
            ('Smart TV 55 Inch 4K', 42000, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600', 'electronics', 'Ultra HD Smart LED TV with built-in streaming apps.', 4.7, 512, '{}'),
            ('Washing Machine Front Load', 32000, 'https://images.unsplash.com/photo-1626806787426-5910811b6325?w=600', 'electronics', 'Fully automatic front load washing machine with inverter technology.', 4.6, 185, '{}'),
            ('Digital Mirrorless Camera', 85000, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600', 'electronics', '24.2MP mirrorless camera with 4K video recording.', 4.9, 120, '{}');
            """)
            print("Products seeded successfully.")

        conn.commit()
        cur.close()
    finally:
        conn.close()

init_db()

# ---------------- AUTH ROUTES ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    if not email or not password: return jsonify({"msg": "Missing info"}), 400
    hashed = generate_password_hash(password)
    conn = get_conn()
    try:
        cur = conn.cursor()
        execute_query(cur, "INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed))
        conn.commit()
        return jsonify({"msg": "Created"}), 201
    except Exception:
        return jsonify({"msg": "Exists"}), 400
    finally:
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    conn = get_conn()
    try:
        cur = conn.cursor()
        execute_query(cur, "SELECT password FROM users WHERE email=?", (email,))
        user = cur.fetchone()
        if user and check_password_hash(user[0], password):
            access_token = create_access_token(identity=email)
            return jsonify(access_token=access_token), 200
        return jsonify({"msg": "Bad info"}), 401
    finally:
        conn.close()

# ---------------- ORDER ROUTES ----------------
@app.route("/orders", methods=["POST"])
@jwt_required()
def place_order():
    user_email = get_jwt_identity()
    data = request.json or {}

    if not data.get("items") or not data.get("total_amount"):
        return jsonify({"msg": "Missing order details"}), 400

    conn = get_conn()
    try:
        cur = conn.cursor()
        tracking_number = data.get("tracking_number") or f"TRK{random.randint(100000, 999999)}"
        query = "INSERT INTO orders (user_email, total_amount, items, payment_method, customer_name, shipping_address, tracking_number) VALUES (?, ?, ?, ?, ?, ?, ?)"
        if is_postgres():
            query += " RETURNING id"

        execute_query(
            cur,
            query,
            (
                user_email,
                data.get("total_amount"),
                json.dumps(data.get("items")),
                data.get("payment_method"),
                data.get("customer_name"),
                data.get("shipping_address"),
                tracking_number,
            ),
        )

        order_id = cur.fetchone()[0] if is_postgres() else cur.lastrowid
        conn.commit()
        return jsonify({"msg": "Order placed successfully", "order_id": order_id, "tracking_number": tracking_number}), 201
    except Exception as e:
        conn.rollback()
        print(f"Order placement failed: {e}")
        return jsonify({"msg": "Order failed", "error": str(e)}), 500
    finally:
        conn.close()

@app.route("/orders", methods=["GET"])
@jwt_required()
def get_orders():
    user_email = get_jwt_identity()
    conn = get_conn()
    try:
        cur = conn.cursor()
        execute_query(cur, "SELECT id, total_amount, items, status, created_at, tracking_number, customer_name, shipping_address FROM orders WHERE user_email=?", (user_email,))
        rows = cur.fetchall()
        
        result = []
        for r in rows:
            # r[2] is items string (json)
            try:
                items_obj = json.loads(r[2])
            except:
                items_obj = []
            
            result.append({
                "id": r[0],
                "total": r[1],
                "items": items_obj,
                "status": r[3],
                "date": r[4],
                "tracking_number": r[5] if len(r) > 5 else None,
                "customer_name": r[6] if len(r) > 6 else None,
                "shipping_address": r[7] if len(r) > 7 else None
            })
        return jsonify(result)
    except Exception as e:
        print(f"Get orders failed: {e}")
        return jsonify({"msg": "Could not load orders", "error": str(e)}), 500
    finally:
        conn.close()

# ---------------- PRODUCT ROUTES ----------------
@app.route("/")
def home():
    return "Multi-Agent Backend Running 🚀"

@app.route("/products/<category>")
def get_products(category):
    conn = get_conn()
    try:
        cur = conn.cursor()
        if category == "all": 
            cur.execute("SELECT * FROM products")
        else: 
            execute_query(cur, "SELECT * FROM products WHERE category=?", (category,))
        rows = cur.fetchall()
        
        result = []
        for r in rows:
            result.append({
                "id": r[0], 
                "name": r[1], 
                "price": r[2], 
                "image": r[3], 
                "category": r[4], 
                "description": r[5], 
                "rating": r[6]
            })
        return jsonify(result)
    finally:
        conn.close()

# ---------------- MULTI-AGENT SYSTEM ----------------
def route_query(message):
    prompt = f"""
    You are the Router Agent for STYLE store. Classify the user's message into one of three categories:
    1. SALES - if they are asking for recommendations, looking for products, or asking about what we sell.
    2. ORDER - if they are asking about their past orders, order status, or tracking.
    3. SUPPORT - if they are asking about returns, refunds, store policies, or general help.
    
    User Message: "{message}"
    
    Respond with EXACTLY ONE WORD from the choices above: SALES, ORDER, or SUPPORT. If unsure, respond SUPPORT.
    """
    try:
        route = generate_with_fallback(prompt).strip().upper()
        if route in ["SALES", "ORDER", "SUPPORT"]:
            return route
    except Exception:
        pass
    
    # If the AI router is unavailable or gave an invalid answer, use keyword heuristics.
    msg = message.lower()
    if any(keyword in msg for keyword in ["order", "track", "status", "shipping", "delivered", "purchase"]):
        return "ORDER"
    if any(keyword in msg for keyword in ["return", "refund", "policy", "help", "support", "problem", "issue", "complaint", "cancel", "refund"]):
        return "SUPPORT"
    if any(keyword in msg for keyword in ["product", "recommend", "show me", "find", "buy", "list", "what do you have", "price", "catalog", "laptop", "dress", "shoe", "shoes", "phone", "headphone", "camera", "tv", "television", "bag", "suit", "jeans", "sunglasses", "accessory", "available", "stock", "offer", "sale", "collections"]):
        return "SALES"
    if "what" in msg and "have" in msg:
        return "SALES"
    return "SALES"

def sales_agent(message):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT name, price, category, description FROM products")
        products = cur.fetchall()
    finally:
        conn.close()
    
    product_list = "\\n".join([f"- {p[0]} (₹{p[1]}, {p[2]}): {p[3]}" for p in products])
    
    prompt = f"""
    You are the Sales Expert Agent for STYLE store. 
    Here are our available products:
    {product_list}
    
    User: {message}
    
    Respond as a helpful, premium sales assistant. Recommend products if applicable, format nicely, and mention prices in ₹ (INR).
    """
    try:
        reply = generate_with_fallback(prompt)
        return "Sales Expert", reply
    except Exception:
        return "Sales Expert", "I'm having trouble connecting right now, but feel free to browse our amazing collection!"

def support_agent(message):
    prompt = f"""
    You are the Customer Support Agent for STYLE store.
    Store Policies:
    - 30-day return policy for unused items in original packaging.
    - Free shipping on orders above ₹5000. Standard shipping takes 3-5 business days.
    - We accept all major credit cards and UPI.
    - For direct contact, users can email support@stylestore.com.
    
    User: {message}
    
    Respond politely and helpfully using the store policies.
    """
    try:
        reply = generate_with_fallback(prompt)
        return "Support Team", reply
    except Exception:
        return "Support Team", "We are experiencing high volumes right now. Please email support@stylestore.com for immediate assistance."

def order_agent(message, user_email):
    if not user_email:
        return "Order Assistant", "I'd love to help you track your order! Please log in first so I can securely access your account details."
        
    conn = get_conn()
    try:
        cur = conn.cursor()
        execute_query(cur, "SELECT id, status, total_amount, created_at, tracking_number, customer_name, shipping_address FROM orders WHERE user_email=? ORDER BY created_at DESC LIMIT 5", (user_email,))
        orders = cur.fetchall()
    finally:
        conn.close()
        
    if not orders:
        return "Order Assistant", "You don't have any orders yet. Start shopping to place your first order!"
    
    # Format order info directly without API
    order_summary = "Here are your recent orders:\n\n"
    for o in orders:
        order_summary += f"📦 Order #{o[0]}\n   Status: {o[1]}\n   Amount: ₹{o[2]}\n   Date: {o[3]}\n"
        if o[4]:
            order_summary += f"   Tracking: {o[4]}\n"
        if o[5]:
            order_summary += f"   Customer: {o[5]}\n"
        if o[6]:
            order_summary += f"   Delivery Address: {o[6]}\n"
        order_summary += "\n"
    
    # Try to get AI-formatted response, fallback to direct data
    prompt = f"""
    You are the Order Tracking Assistant for STYLE store.
    The user ({user_email}) is asking about their orders.
    
    Here is their order history:
    {order_summary}
    
    User: {message}
    
    Provide a helpful response about their order status. Be concise and friendly.
    """
    try:
        reply = generate_with_fallback(prompt)
        return "Order Assistant", reply
    except Exception:
        # Fallback: Return the raw order data
        return "Order Assistant", order_summary + "Would you like more details about any specific order?"

@app.route("/chat", methods=["POST"])
def multi_agent_chat():
    user_msg = request.json.get("message")
    if not user_msg:
        return jsonify({"msg": "No message provided"}), 400

    user_email = None
    try:
        verify_jwt_in_request(optional=True)
        user_email = get_jwt_identity()
    except Exception:
        pass
        
    print(f"Chat request received: {user_msg} | User: {user_email}")
    
    route = route_query(user_msg)
    print(f"Router decided route: {route}")
    
    if route == "SALES":
        agent_name, reply = sales_agent(user_msg)
    elif route == "ORDER":
        agent_name, reply = order_agent(user_msg, user_email)
    else:
        agent_name, reply = support_agent(user_msg)
        
    return jsonify({
        "agent": agent_name,
        "reply": reply
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)
