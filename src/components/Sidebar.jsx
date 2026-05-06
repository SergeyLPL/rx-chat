import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import CreateGroup from './CreateGroup'

export default function Sidebar({ currentUser, activeChat, onSelectChat }) {
  const [chats, setChats] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [tab, setTab] = useState('chats')
  const [search, setSearch] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0))
      setChats(list)
    })
    return unsub
  }, [currentUser.uid])

  useEffect(() => {
    if (tab !== 'users') return
    getDocs(collection(db, 'users')).then((snap) => {
      setAllUsers(
        snap.docs.map((d) => d.data()).filter((u) => u.uid !== currentUser.uid)
      )
    })
  }, [tab, currentUser.uid])

  const filteredChats = chats.filter((c) =>
    (c.displayName || '').toLowerCase().includes(search.toLowerCase())
  )
  const filteredUsers = allUsers.filter((u) =>
    (u.displayName || u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Вы'
  const initial = displayName[0]?.toUpperCase()

  function handleGroupCreated(chat) {
    setShowCreateGroup(false)
    onSelectChat(chat)
    setTab('chats')
  }

  return (
    <div className="flex flex-col h-full bg-[#111b21] border-r border-[#2a3942] w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
        <div className="flex items-center gap-3">
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold">
              {initial}
            </div>
          )}
          <span className="text-white text-sm font-medium">{displayName}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* New group button */}
          <button
            onClick={() => setShowCreateGroup(true)}
            title="Создать группу"
            className="text-[#8696a0] hover:text-white p-2 rounded-full hover:bg-[#374045] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </button>
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-[#8696a0] hover:text-white p-2 rounded-full hover:bg-[#374045] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-[#233138] rounded-lg shadow-xl py-1 w-44 z-10">
                <button
                  onClick={() => { signOut(auth); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#374045] transition-colors"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-[#111b21]">
        <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-3 py-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#8696a0] flex-shrink-0">
            <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'chats' ? 'Поиск чатов...' : 'Поиск пользователей...'}
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder-[#8696a0]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a3942]">
        {['chats', 'users'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-[#8696a0] hover:text-white'
            }`}
          >
            {t === 'chats' ? 'Чаты' : 'Пользователи'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'chats' && (
          <>
            {filteredChats.length === 0 ? (
              <div className="text-center text-[#8696a0] text-sm mt-12 px-4">
                <p>Нет чатов</p>
                <p className="text-xs mt-1">
                  Перейдите во вкладку «Пользователи» или нажмите{' '}
                  <button onClick={() => setShowCreateGroup(true)} className="text-[#00a884] hover:underline">
                    создать группу
                  </button>
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  currentUid={currentUser.uid}
                  isActive={activeChat?.id === chat.id}
                  onClick={() => onSelectChat(chat)}
                />
              ))
            )}
          </>
        )}

        {tab === 'users' && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="text-center text-[#8696a0] text-sm mt-12">Нет пользователей</div>
            ) : (
              filteredUsers.map((u) => (
                <UserRow
                  key={u.uid}
                  user={u}
                  currentUser={currentUser}
                  isActive={activeChat?.otherUid === u.uid}
                  onSelect={(chat) => { onSelectChat(chat); setTab('chats') }}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Create group modal */}
      {showCreateGroup && (
        <CreateGroup
          currentUser={currentUser}
          onCreated={handleGroupCreated}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  )
}

function ChatRow({ chat, currentUid, isActive, onClick }) {
  const name = chat.displayName || 'Чат'
  const isGroup = chat.type === 'group'
  const initial = name[0]?.toUpperCase()
  const time = chat.updatedAt?.toDate
    ? formatTime(chat.updatedAt.toDate())
    : ''

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors text-left ${
        isActive ? 'bg-[#2a3942]' : ''
      }`}
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-lg ${isGroup ? 'bg-[#7c4dff]' : 'bg-[#6c757d]'}`}>
        {chat.photoURL ? (
          <img src={chat.photoURL} className="w-12 h-12 rounded-full object-cover" alt="" />
        ) : isGroup ? (
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        ) : (
          initial
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-white text-sm font-medium truncate">{name}</span>
            {isGroup && (
              <span className="text-[#7c4dff] text-xs flex-shrink-0">
                · {chat.members?.length ?? 0}
              </span>
            )}
          </div>
          {time && <span className="text-[#8696a0] text-xs flex-shrink-0 ml-2">{time}</span>}
        </div>
        {chat.lastMessage && (
          <p className="text-[#8696a0] text-xs truncate mt-0.5">
            {chat.lastMessage.senderId === currentUid
              ? 'Вы: '
              : isGroup && chat.lastMessage.senderName
              ? `${chat.lastMessage.senderName}: `
              : ''}
            {chat.lastMessage.text}
          </p>
        )}
      </div>
    </button>
  )
}

function UserRow({ user, currentUser, isActive, onSelect }) {
  const [loading, setLoading] = useState(false)
  const initial = (user.displayName || user.email || '?')[0].toUpperCase()

  async function openChat() {
    setLoading(true)
    try {
      const chatId = [currentUser.uid, user.uid].sort().join('_')
      const chatRef = doc(db, 'chats', chatId)
      const displayName = user.displayName || user.email.split('@')[0]
      await setDoc(
        chatRef,
        {
          type: 'direct',
          members: [currentUser.uid, user.uid],
          displayName,
          photoURL: user.photoURL || null,
          otherUid: user.uid,
          updatedAt: serverTimestamp(),
          lastMessage: null,
        },
        { merge: true }
      )
      onSelect({ id: chatId, type: 'direct', otherUid: user.uid, displayName, photoURL: user.photoURL || null })
    } catch (err) {
      console.error('Ошибка открытия чата:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={openChat}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors text-left ${
        isActive ? 'bg-[#2a3942]' : ''
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-[#6c757d] flex items-center justify-center text-white font-semibold flex-shrink-0 text-lg">
        {user.photoURL ? (
          <img src={user.photoURL} className="w-12 h-12 rounded-full object-cover" alt="" />
        ) : initial}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium block truncate">
          {user.displayName || user.email.split('@')[0]}
        </span>
        <span className="text-[#8696a0] text-xs truncate block">{user.email}</span>
      </div>
    </button>
  )
}

function formatTime(date) {
  const now = new Date()
  if (now - date < 86400000) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}
