// 🔑 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCy4ZbLMrl69-Q5gNF0RhPifz5JenwMTs0",
  authDomain: "discord-hu565.firebaseapp.com",
  projectId: "discord-hu565",
  storageBucket: "discord-hu565.firebasestorage.app",
  messagingSenderId: "533208750940",
  appId: "1:533208750940:web:3df8cdb283ca1b05b07f99",
  measurementId: "G-MS3WRYZLY2"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const enterBtn = document.getElementById('enterBtn');
const currentUser = document.getElementById('currentUser');

const serverList = document.getElementById('serverList');
const newServerName = document.getElementById('newServerName');
const addServerBtn = document.getElementById('addServerBtn');

const channelList = document.getElementById('channelList');
const newChannelName = document.getElementById('newChannelName');
const addChannelBtn = document.getElementById('addChannelBtn');

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const currentChannelName = document.getElementById('currentChannelName');

const userList = document.getElementById('userList');

let username = '';
let currentServer = '';
let currentChannel = '';

// Enter chat
enterBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if(name){
    username = name;
    currentUser.textContent = username;
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    addUserToOnlineList();
    loadServers();
  } else alert('Enter username!');
});

// ---------------- Servers ----------------
addServerBtn.addEventListener('click', () => {
  const name = newServerName.value.trim();
  if(name){
    db.ref('servers/'+name).set({ created: Date.now() });
    newServerName.value = '';
    loadServers();
  }
});

function loadServers(){
  db.ref('servers').once('value', snapshot => {
    serverList.innerHTML = '';
    const data = snapshot.val();
    if(data){
      Object.keys(data).forEach(server => {
        const li = document.createElement('li');
        li.textContent = server;
        li.addEventListener('click', () => {
          currentServer = server;
          loadChannels();
        });
        serverList.appendChild(li);
      });
    }
  });
}

// ---------------- Channels ----------------
addChannelBtn.addEventListener('click', () => {
  const name = newChannelName.value.trim();
  if(name && currentServer){
    db.ref(`servers/${currentServer}/channels/${name}`).set({ created: Date.now() });
    newChannelName.value = '';
    loadChannels();
  }
});

function loadChannels(){
  db.ref(`servers/${currentServer}/channels`).once('value', snapshot => {
    channelList.innerHTML = '';
    const data = snapshot.val();
    if(data){
      Object.keys(data).forEach(channel => {
        const li = document.createElement('li');
        li.textContent = channel;
        li.addEventListener('click', () => {
          currentChannel = channel;
          currentChannelName.textContent = `${currentServer} - #${currentChannel}`;
          loadMessages();
        });
        channelList.appendChild(li);
      });
    }
  });
}

// ---------------- Messages ----------------
sendBtn.addEventListener('click', () => {
  const text = messageInput.value.trim();
  if(text && currentServer && currentChannel){
    db.ref(`servers/${currentServer}/channels/${currentChannel}/messages`).push({
      user: username,
      text,
      timestamp: Date.now()
    });
    messageInput.value = '';
  }
});

function loadMessages(){
  db.ref(`servers/${currentServer}/channels/${currentChannel}/messages`).on('value', snapshot => {
    messagesContainer.innerHTML = '';
    const data = snapshot.val();
    if(data){
      const arr = Object.values(data).sort((a,b)=>a.timestamp-b.timestamp);
      arr.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = `<strong>${msg.user}</strong>: ${msg.text}`;
        messagesContainer.appendChild(div);
      });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
}

// ---------------- Online Users ----------------
function addUserToOnlineList(){
  const userRef = db.ref(`onlineUsers/${username}`);
  userRef.set(true);
  userRef.onDisconnect().remove();

  db.ref('onlineUsers').on('value', snapshot => {
    userList.innerHTML = '';
    const data = snapshot.val();
    if(data){
      Object.keys(data).forEach(u => {
        const li = document.createElement('li');
        li.textContent = u;
        userList.appendChild(li);
      });
    }
  });
}
