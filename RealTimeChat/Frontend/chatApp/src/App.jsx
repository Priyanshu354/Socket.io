import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

export default function App() {
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    // Listen for updated online users
    socket.on("online users", (users) => {
      setOnlineUsers(users);
    });

    // Listen for global messages
    socket.on("chat message", (payload) => {
      setInbox((prev) => [...prev, { ...payload, private: false }]);
    });

    // Listen for private messages
    socket.on("private message", (payload) => {
      setInbox((prev) => [...prev, { ...payload, private: true }]);
    });

    return () => {
      socket.off("online users");
      socket.off("chat message");
      socket.off("private message");
    };
  }, []);

  const register = () => {
    if (username.trim()) {
      socket.emit("register", username.trim());
      setRegistered(true);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    if (targetUser) {
      socket.emit("private message", { toUsername: targetUser, text: message });
    } else {
      socket.emit("chat message", message);
    }
    setMessage("");
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      {!registered ? (
        <div>
          <input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={register}>Join Chat</button>
        </div>
      ) : (
        <>
          <h3>Logged in as: {username}</h3>

          <div style={{ display: "flex", gap: 20 }}>
            {/* Online Users List */}
            <div>
              <h4>Online Users</h4>
              <ul>
                {onlineUsers.map((user) => (
                  <li key={user}>
                    {user}{" "}
                    <button onClick={() => setTargetUser(user)}>DM</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat Box */}
            <div>
              <h4>Inbox</h4>
              <div
                style={{
                  border: "1px solid #ccc",
                  width: 400,
                  height: 300,
                  overflowY: "auto",
                  padding: 10,
                }}
              >
                {inbox.map((m, i) => (
                  <div key={i} style={{ color: m.private ? "blue" : "black" }}>
                    <strong>{m.from}</strong>: {m.text}{" "}
                    {m.private ? "(private)" : ""}
                  </div>
                ))}
              </div>

              <input
                placeholder={
                  targetUser
                    ? `Message to ${targetUser}`
                    : "Message to everyone"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: 300, marginRight: 10 }}
              />
              <button onClick={sendMessage}>Send</button>
              {targetUser && (
                <button
                  onClick={() => setTargetUser("")}
                  style={{ marginLeft: 10 }}
                >
                  Clear DM
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
