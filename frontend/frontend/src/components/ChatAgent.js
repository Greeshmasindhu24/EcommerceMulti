<<<<<<< HEAD
import React, { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

export default function ChatAgent() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ text: "Hi! How can I help you today?", isUser: false }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { text: input, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
=======
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function ChatAgent() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your MyStore Assistant. How can I help you today?", sender: "bot" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { text: input, sender: "user" };
        setMessages([...messages, userMsg]);
>>>>>>> 3d02b33b310cc7780fd9298f6e256189842c90cc
        setInput("");
        setLoading(true);

        try {
<<<<<<< HEAD
            const res = await axios.post(`${API}/chat`, { message: currentInput }, { timeout: 10000 });
            setMessages(prev => [...prev, { text: res.data.reply, isUser: false }]);
        } catch (err) {
            console.error("Chat error", err);
            let errorMsg = "Sorry, I'm having trouble connecting to the server.";
            if (err.code === 'ECONNABORTED') errorMsg = "The request timed out. Please try again.";
            if (err.response?.data?.reply) errorMsg = err.response.data.reply;

            setMessages(prev => [...prev, { text: errorMsg, isUser: false }]);
=======
            const res = await axios.post("http://localhost:5000/chat", { message: input });
            setMessages(prev => [...prev, { text: res.data.reply, sender: "bot" }]);
        } catch (err) {
            const errorReply = err.response?.data?.reply || "Sorry, I'm having trouble connecting right now.";
            setMessages(prev => [...prev, { text: errorReply, sender: "bot" }]);
>>>>>>> 3d02b33b310cc7780fd9298f6e256189842c90cc
        } finally {
            setLoading(false);
        }
    };

<<<<<<< HEAD

    return (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 10000 }}>
            {isOpen ? (
                <div style={{
                    width: "350px",
                    height: "500px",
                    background: "white",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    borderRadius: "20px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1px solid #eee",
                    animation: "slideUp 0.3s ease"
                }}>
                    <div style={{ background: "black", color: "white", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "10px", height: "10px", background: "#4ade80", borderRadius: "50%" }}></div>
                            <b style={{ letterSpacing: "1px" }}>STYLE. ASSISTANT</b>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
                    </div>

                    <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", background: "#fcfcfc" }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.isUser ? "flex-end" : "flex-start",
                                background: m.isUser ? "black" : "white",
                                color: m.isUser ? "white" : "black",
                                padding: "12px 16px",
                                borderRadius: m.isUser ? "15px 15px 0 15px" : "15px 15px 15px 0",
                                maxWidth: "85%",
                                fontSize: "0.95rem",
                                boxShadow: m.isUser ? "none" : "0 2px 5px rgba(0,0,0,0.05)",
                                border: m.isUser ? "none" : "1px solid #eee"
=======
    return (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000, fontFamily: "'Inter', sans-serif" }}>
            {/* Chat Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "#2874f0",
                    color: "white",
                    border: "none",
                    fontSize: "30px",
                    cursor: "pointer",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                {isOpen ? "×" : "💬"}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: "absolute",
                    bottom: "80px",
                    right: "0",
                    width: "350px",
                    height: "500px",
                    background: "white",
                    borderRadius: "15px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}>
                    {/* Header */}
                    <div style={{ background: "#2874f0", color: "white", padding: "15px", fontWeight: "bold" }}>
                        MyStore AI Assistant
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                                background: m.sender === "user" ? "#2874f0" : "#f1f3f6",
                                color: m.sender === "user" ? "white" : "black",
                                padding: "10px 15px",
                                borderRadius: "15px",
                                maxWidth: "80%",
                                fontSize: "14px",
                                lineHeight: "1.4"
>>>>>>> 3d02b33b310cc7780fd9298f6e256189842c90cc
                            }}>
                                {m.text}
                            </div>
                        ))}
<<<<<<< HEAD
                        {loading && (
                            <div style={{ alignSelf: "flex-start", background: "white", padding: "12px 16px", borderRadius: "15px 15px 15px 0", border: "1px solid #eee" }}>
                                <span className="typing-dots">Thinking...</span>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: "20px", borderTop: "1px solid #eee", background: "white", display: "flex", gap: "10px" }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Type your message..."
                            style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid #ddd",
                                outline: "none",
                                fontSize: "0.95rem"
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            style={{
                                background: "black",
                                color: "white",
                                border: "none",
                                padding: "10px 15px",
                                borderRadius: "10px",
                                cursor: "pointer"
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: "65px",
                        height: "65px",
                        borderRadius: "50%",
                        background: "black",
                        color: "white",
                        border: "none",
                        fontSize: "1.8rem",
                        cursor: "pointer",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                    💬
                </button>
            )}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .typing-dots {
                    display: inline-block;
                    overflow: hidden;
                    white-space: nowrap;
                    animation: typing 1.5s steps(3, end) infinite;
                }
                @keyframes typing {
                    from { width: 60px; }
                    to { width: 80px; }
                }
            `}</style>
        </div>
    );
}

=======
                        {loading && <div style={{ alignSelf: "flex-start", color: "#888", fontSize: "12px" }}>AI is thinking...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: "15px", borderTop: "1px solid #eee", display: "flex", gap: "10px" }}>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask me anything..."
                            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", outline: "none" }}
                        />
                        <button 
                            onClick={handleSend}
                            style={{ background: "#2874f0", color: "white", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
>>>>>>> 3d02b33b310cc7780fd9298f6e256189842c90cc
