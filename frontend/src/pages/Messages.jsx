import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationsPanel from "../pages/Notifications";
import SearchPanel from "../components/SearchPanel";
import CreatePostOverlay from "../components/CreatePostOverlay";
import Footer from "../components/Footer";
import styles from "./Messages.module.css";

import {
  api,
  sendMessageApi,
  getConversationsApi,
  getMessagesByConversationApi,
  markMessageReadApi,
  getMessagesSinceApi,
} from "../services/api";

import { socket, connectSocket } from "../services/socket";

const formatTimeAgo = (value) => {
  if (!value) return "just now";
  const created = new Date(value).getTime();
  if (Number.isNaN(created)) return "just now";

  const diff = Date.now() - created;
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} wk`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo`;
  const years = Math.floor(days / 365);
  return `${years} y`;
};

const formatFullDate = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const getId = (v) =>
  typeof v === "string" ? v : v?._id ?? v?.id ?? (v ? String(v) : "");

const getOtherParticipant = (conversation, myUserId) => {
  if (!conversation || !conversation.participants) return null;
  const list = conversation.participants.filter((participant) => {
    const pid = getId(participant);
    return pid && myUserId && String(pid) !== String(myUserId);
  });
  return list[0] || null;
};

const buildConversationStub = (userLike) => {
  const id = getId(userLike);
  if (!id) return null;

  const normalized =
    typeof userLike === "object" && userLike !== null ? userLike : { _id: id };

  return {
    _id: String(id),
    participants: [
      {
        _id: normalized._id ?? normalized.id ?? id,
        username: normalized.username || "Unknown",
        avatarUrl: normalized.avatarUrl || "",
      },
    ],
    lastMessage: null,
    updatedAt: null,
    __isStub: true,
  };
};

export default function Messages() {
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const listRef = useRef(null);
  const lastSyncRef = useRef(Date.now());
  const activeConversationRef = useRef(activeConversation);
  const initialPeerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    const peer = location.state?.peer;
    if (!peer) return;

    initialPeerRef.current = peer;

    const stub = buildConversationStub(peer);
    if (stub) {
      setConversations((prev) => {
        const exists = prev.some(
          (conv) => String(conv._id) === String(stub._id)
        );
        if (exists) return prev;
        return [stub, ...prev];
      });

      setActiveConversation((prev) => {
        if (prev && String(prev._id) === String(stub._id)) return prev;
        return stub;
      });
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const currentUser = useMemo(() => {
    try {
      const me = JSON.parse(localStorage.getItem("me") || "{}")?.user;
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return me || user || {};
    } catch {
      return {};
    }
  }, []);
  const myId = useMemo(() => getId(currentUser), [currentUser]);

  useEffect(() => {
    connectSocket();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await getConversationsApi();
        if (!alive) return;
        const rawList = Array.isArray(data) ? data : [];
        const peer = initialPeerRef.current;
        const peerId = peer ? String(getId(peer)) : "";

        let nextList = [...rawList];
        if (peerId) {
          const hasPeer = rawList.some(
            (conv) => String(conv._id) === String(peerId)
          );
          if (!hasPeer) {
            const stub = buildConversationStub(peer);
            if (stub) {
              nextList = [stub, ...nextList];
            }
          }
        }

        setConversations(nextList);

        if (peerId) {
          const found = rawList.find(
            (conv) => String(conv._id) === String(peerId)
          );
          if (found) {
            setActiveConversation((prev) => {
              if (!prev) return found;
              const prevId = String(getId(prev));
              const matchPrev = prevId === String(peerId);
              if (!matchPrev) return prev;
              if (prev.__isStub) return found;
              return prev;
            });
          }
        }
      } catch (err) {
        if (alive) {
          setError(err?.response?.data?.message || "Failed to load messages");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const { data } = await getMessagesByConversationApi(
          activeConversation._id
        );
        if (!alive) return;
        setMessages(Array.isArray(data) ? data : []);
        lastSyncRef.current = Date.now();
      } catch (err) {
        if (alive) console.error("Failed to load messages:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeConversation]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversation]);

  useEffect(() => {
    const onNew = (msg) => {
      const activeId = activeConversationRef.current?._id;
      const fromId = getId(msg.from);
      const toId = getId(msg.to);

      const relevant =
        activeId &&
        ((String(fromId) === String(activeId) &&
          String(toId) === String(myId)) ||
          (String(toId) === String(activeId) &&
            String(fromId) === String(myId)));

      if (relevant) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
      }

      setConversations((prev) => {
        const otherId = String(fromId) === String(myId) ? toId : fromId;
        const exists = prev.some((c) => String(c._id) === String(otherId));
        if (exists) {
          return prev.map((c) =>
            String(c._id) === String(otherId)
              ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
              : c
          );
        }
        (async () => {
          try {
            const { data } = await getConversationsApi();
            setConversations(Array.isArray(data) ? data : []);
          } catch {}
        })();
        return prev;
      });
    };

    const onDelivered = () => {};
    const onRead = ({ messageId, readAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, readAt: readAt || new Date().toISOString() }
            : m
        )
      );
    };

    const onReconnect = async () => {
      try {
        const { data } = await getMessagesSinceApi(lastSyncRef.current);
        if (data.items?.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((p) => String(p._id)));
            const toAdd = data.items.filter((x) => !ids.has(String(x._id)));
            return [...prev, ...toAdd].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
        }
        lastSyncRef.current = Date.now();
      } catch (e) {
        console.error("reconnect sync failed", e);
      }
    };

    socket.on("message:new", onNew);
    socket.on("message:delivered", onDelivered);
    socket.on("message:read", onRead);
    socket.io.on("reconnect", onReconnect);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:delivered", onDelivered);
      socket.off("message:read", onRead);
      socket.io.off("reconnect", onReconnect);
    };
  }, [myId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !activeConversation) return;

    setNewMessage("");
    try {
      await sendMessageApi(activeConversation._id, text);
    } catch (err) {
      console.error("Failed to send message:", err);
      setNewMessage(text);
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await markMessageReadApi(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, readAt: new Date().toISOString() }
            : m
        )
      );
    } catch (e) {
      console.error("mark read failed", e);
    }
  };

  const otherUser = getOtherParticipant(activeConversation, myId);
  const firstMsgTime = messages?.[0]?.createdAt;

  return (
    <div className={styles.page}>
      <div id="sidebar-root">
        <Sidebar
          onOpenNotifications={() => setShowNotif(true)}
          onOpenSearch={() => setShowSearch(true)}
          onOpenCreate={() => setShowCreate(true)}
          isSearchOpen={showSearch}
          isNotifOpen={showNotif}
        />
      </div>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.conversationsList}>
            <div className={styles.conversationsHeader}>
              <h2>{currentUser.username || "itcareerhub"}</h2>
            </div>

            <div className={styles.conversations}>
              {loading && (
                <div className={styles.loading}>Loading conversations...</div>
              )}

              {!loading && error && <div className={styles.error}>{error}</div>}

              {!loading && !error && conversations.length === 0 && (
                <div className={styles.empty}>
                  No conversations yet
                  <p>
                    Visit someone's profile and click "Message" to start a
                    conversation
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv, myId);
                  if (!other) return null;
                  const isActive = activeConversation?._id === String(conv._id);

                  return (
                    <div
                      key={conv._id}
                      className={`${styles.conversationItem} ${
                        isActive ? styles.active : ""
                      }`}
                      onClick={() => setActiveConversation(conv)}
                    >
                      <img
                        src={other?.avatarUrl || "/placeholder-avatar.png"}
                        alt={other?.username || "user"}
                        className={styles.conversationAvatar}
                      />
                      <div className={styles.conversationInfo}>
                        <div className={styles.conversationName}>
                          {other?.username || "Unknown"}
                        </div>
                        <div className={styles.conversationPreview}>
                          {conv.lastMessage?.text || "No messages yet"}
                        </div>
                        <div className={styles.conversationTime}>
                          {formatTimeAgo(
                            conv.lastMessage?.createdAt || conv.updatedAt
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className={styles.chatArea}>
            {!activeConversation ? (
              <div className={styles.noChat}>
                <div className={styles.noChatIcon}>
                  <i className="ri-chat-1-line" />
                </div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            ) : !otherUser ? (
              <div className={styles.noChat}>
                <div className={styles.noChatIcon}>
                  <i className="ri-error-warning-line" />
                </div>
                <h3>User unavailable</h3>
                <p>This conversation participant no longer exists.</p>
              </div>
            ) : (
              <>
                <div className={styles.chatHeader}>
                  <div className={styles.chatUserInfo}>
                    <img
                      src={otherUser?.avatarUrl || "/placeholder-avatar.png"}
                      alt={otherUser?.username || "user"}
                      className={styles.chatAvatar}
                    />
                    <div className={styles.chatUserDetails}>
                      <div className={styles.chatUsername}>
                        {otherUser?.username || "Unknown"}
                      </div>
                      <div className={styles.chatUserStatus}>
                        {otherUser?.username || "Unknown"} • ICHgram
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.chatIntro}>
                  <img
                    src={otherUser?.avatarUrl || "/placeholder-avatar.png"}
                    alt={otherUser?.username || "user"}
                    className={styles.chatIntroAvatar}
                  />
                  <div className={styles.chatIntroName}>
                    {otherUser?.username || "Unknown"}
                  </div>
                  <div className={styles.chatIntroSub}>
                    {(otherUser?.username || "user") + " · ICHgram"}
                  </div>
                  <Link
                    to={`/profile/${otherUser?.username || ""}`}
                    className={styles.chatIntroBtn}
                  >
                    View profile
                  </Link>
                  {firstMsgTime && (
                    <div className={styles.chatIntroDate}>
                      {formatFullDate(firstMsgTime)}
                    </div>
                  )}
                </div>

                <div className={styles.messagesContainer}>
                  <div className={styles.messagesList} ref={listRef}>
                    {messages.map((message) => {
                      const isOwn =
                        String(getId(message.from)) === String(myId);
                      const avatarUrl = isOwn
                        ? currentUser?.avatarUrl
                        : otherUser?.avatarUrl;

                      return (
                        <div
                          key={message._id}
                          className={`${styles.message} ${
                            isOwn ? styles.ownMessage : styles.otherMessage
                          }`}
                          onMouseEnter={() => {
                            if (!isOwn && !message.readAt) {
                              handleMarkRead(message._id);
                            }
                          }}
                        >
                          <div className={styles.messageInner}>
                            <img
                              className={styles.messageAvatar}
                              src={avatarUrl || "/placeholder-avatar.png"}
                              alt="avatar"
                            />
                            <div className={styles.messageBubble}>
                              <p className={styles.messageText}>
                                {message.text}
                              </p>
                              <div className={styles.messageTime}>
                                {formatTimeAgo(message.createdAt)}{" "}
                                {message.readAt ? "✓✓" : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form
                  className={styles.messageInput}
                  onSubmit={handleSendMessage}
                >
                  <input
                    type="text"
                    placeholder="Write message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") {
                        socket.emit("message:typing", {
                          to: activeConversation._id,
                        });
                      }
                    }}
                    className={styles.messageField}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={styles.sendButton}
                  >
                    <i className="ri-send-plane-line" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <Footer />
      </main>

      {showNotif && <NotificationsPanel onClose={() => setShowNotif(false)} />}
      {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
      {showCreate && (
        <CreatePostOverlay
          onClose={() => setShowCreate(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}
