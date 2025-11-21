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
const auth = firebase.auth();

// ---------------- Elements ----------------
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const currentUserSpan = document.getElementById('currentUser');

const serverList = document.getElementById('serverList');
const newServerName = document.getElementById('newServerName');
const addServerBtn = document.getElementById('addServerBtn');
const inviteCodeInput = document.getElementById('inviteCodeInput');
const joinServerBtn = document.getElementById('joinServerBtn');

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

// ---------------- Auth ----------------
loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      username = user.user.email;
      currentUserSpan.textContent = username;
      loginScreen.style.display = 'none';
      chatScreen.style.display = 'flex';
      addUserToOnlineList();
      loadServers();
      checkInviteInURL();
    })
    .catch(err => alert(err.message));
});

registerBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  auth.createUserWithEmailAndPassword(email, password)
    .then(user => alert('Registered! You can now log in.'))
    .catch(err => alert(err.message));
});

// ---------------- Servers ----------------
addServerBtn.addEventListener('click', () => {
  const name = newServerName.value.trim();
  if(!name) return;

  const inviteCode = Math.random().toString(36).substring(2,8);
  const ownerEmail = "on-that-ass@outlook.fr"; // fixed owner

  db.ref('servers/'+name).set({
    created: Date.now(),
    invite: inviteCode,
    owner: ownerEmail
  })
  .then(() => {
    alert(`Server "${name}" created! Invite: ${inviteCode}\nOwner: ${ownerEmail}`);
    newServerName.value = '';
    loadServers();
  })
  .catch(err => alert('Error creating server: ' + err.message));
});

// Join server by invite code
joinServerBtn.addEventListener('click', () => {
  const code = inviteCodeInput.value.trim();
  joinServerByCode(code);
});

// ---------------- Functions ----------------
function loadServers(){
  db.ref('servers').once('value').then(snapshot => {
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

function joinServerByCode(code){
  db.ref('servers').once('value', snapshot => {
    const data = snapshot.val();
    for(let server in data){
      if(data[server].invite === code){
        currentServer = server;
        loadChannels();
        alert(`Joined server: ${server}`);
        return;
      }
    }
    alert('Invalid invite code!');
  });
}

// ---------------- Channels ----------------
addChannelBtn.addEventListener('click', () => {
  const name = newChannelName.value.trim();
  if(!name) return;
  if(!currentServer) {
    alert('Select a server first!');
    return;
  }

  db.ref(`servers/${currentServer}/channels/${name}`).set({ created: Date.now() })
    .then(() => {
      newChannelName.value = '';
      loadChannels();
    })
    .catch(err => alert('Error creating channel: ' + err.message));
});

function loadChannels(){
  if(!currentServer) return;
  db.ref(`servers/${currentServer}/channels`).once('value').then(snapshot => {
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
  if(!currentServer || !currentChannel) return;

  db.ref(`servers/${currentServer}/channels/${currentChannel}/messages`).on('value', snapshot => {
    messagesContainer.innerHTML = '';
    const data = snapshot.val();
    if(data){
      const arr = Object.values(data).sort((a,b)=>a.timestamp-b.timestamp);
      arr.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message';
        let badge = '';
        if(msg.user === 'on-that-ass@outlook.fr') badge = ' <span class="owner-badge">OWNER</span>';
        div.innerHTML = `<strong>${msg.user}</strong>${badge}: ${msg.text}`;
        messagesContainer.appendChild(div);
      });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
}

// ---------------- Online Users ----------------
function addUserToOnlineList(){
  const safeUsername = username.replace(/[.#$/[\]]/g, '_');
  const userRef = db.ref(`onlineUsers/${safeUsername}`);
  userRef.set(true);
  userRef.onDisconnect().remove();

  db.ref('onlineUsers').on('value', snapshot => {
    userList.innerHTML = '';
    const data = snapshot.val();
    if(data){
      Object.keys(data).forEach(u => {
        const displayName = u.replace(/_/g, '@'); // optional
        const li = document.createElement('li');
        if(displayName === 'on-that-ass@outlook.fr'){
          li.innerHTML = `${displayName} <span class="owner-badge">OWNER</span>`;
        } else {
          li.textContent = displayName;
        }
        userList.appendChild(li);
      });
    }
  });
}

// ---------------- URL Invite Support ----------------
function checkInviteInURL(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get('invite');
  if(code){
    joinServerByCode(code);
  }
}
