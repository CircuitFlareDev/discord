// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCy4ZbLMrl69-Q5gNF0RhPifz5JenwMTs0",
  authDomain: "discord-hu565.firebaseapp.com",
  projectId: "discord-hu565",
  storageBucket: "discord-hu565.firebasestorage.app",
  messagingSenderId: "533208750940",
  appId: "1:533208750940:web:3df8cdb283ca1b05b07f99",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Elements
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

// ---------------- Helpers ----------------
function safeKey(str){ return str.replace(/[.#$/[\]]/g,'_'); }

// ---------------- Auth ----------------
loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  auth.signInWithEmailAndPassword(email,password)
    .then(u=>{
      username = u.user.email;
      currentUserSpan.textContent=username;
      loginScreen.style.display='none';
      chatScreen.style.display='flex';
      addUserToOnlineList();
      loadServers();
      checkInviteInURL();
    }).catch(err=>alert(err.message));
});

registerBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  auth.createUserWithEmailAndPassword(email,password)
    .then(u=>alert('Registered! You can login now.'))
    .catch(err=>alert(err.message));
});

// ---------------- Servers ----------------
addServerBtn.addEventListener('click', () => {
  const name = newServerName.value.trim();
  if(!name) return;
  const code = Math.random().toString(36).substring(2,8);
  const owner="on-that-ass@outlook.fr";
  const key=safeKey(name);

  db.ref(`servers/${key}`).set({created:Date.now(),invite:code,owner:owner})
    .then(()=>{ newServerName.value=''; loadServers(); alert(`Server ${name} created! Invite: ${code}`)})
    .catch(err=>alert(err.message));
});

joinServerBtn.addEventListener('click',()=>{
  const code=inviteCodeInput.value.trim();
  joinServerByCode(code);
});

function loadServers(){
  db.ref('servers').once('value').then(snap=>{
    serverList.innerHTML='';
    const data=snap.val();
    if(!data) return;
    Object.keys(data).forEach(s=>{
      const li=document.createElement('li');
      li.textContent=s;
      li.addEventListener('click',()=>{
        currentServer=s;
        loadChannels();
      });
      serverList.appendChild(li);
    });
  });
}

function joinServerByCode(code){
  db.ref('servers').once('value').then(snap=>{
    const data=snap.val();
    if(!data) return;
    for(let s in data){
      if(data[s].invite===code){
        currentServer=s;
        loadChannels();
        alert(`Joined server: ${s}`);
        return;
      }
    }
    alert('Invalid invite code!');
  });
}

// ---------------- Channels ----------------
addChannelBtn.addEventListener('click',()=>{
  const name=newChannelName.value.trim();
  if(!name||!currentServer){ alert('Select server first!'); return;}
  const key=safeKey(name);
  db.ref(`servers/${safeKey(currentServer)}/channels/${key}`).set({created:Date.now()})
    .then(()=>{ newChannelName.value=''; loadChannels(); })
    .catch(err=>alert(err.message));
});

function loadChannels(){
  if(!currentServer) return;
  db.ref(`servers/${safeKey(currentServer)}/channels`).once('value').then(snap=>{
    channelList.innerHTML='';
    const data=snap.val();
    if(!data) return;
    Object.keys(data).forEach(c=>{
      const li=document.createElement('li');
      li.textContent=c;
      li.addEventListener('click',()=>{
        currentChannel=c;
        currentChannelName.textContent=`${currentServer} - #${currentChannel}`;
        loadMessages();
      });
      channelList.appendChild(li);
    });
  });
}

// ---------------- Messages ----------------
sendBtn.addEventListener('click',()=>{
  const text=messageInput.value.trim();
  if(!text||!currentServer||!currentChannel) return;
  db.ref(`servers/${safeKey(currentServer)}/channels/${safeKey(currentChannel)}/messages`).push({
    user:username,
    text:text,
    timestamp:Date.now()
  });
  messageInput.value='';
});

function loadMessages(){
  if(!currentServer||!currentChannel) return;
  db.ref(`servers/${safeKey(currentServer)}/channels/${safeKey(currentChannel)}/messages`).on('value',snap=>{
    messagesContainer.innerHTML='';
    const data=snap.val();
    if(!data) return;
    Object.values(data).sort((a,b)=>a.timestamp-b.timestamp).forEach(msg=>{
      let badge='';
      if(msg.user==='on-that-ass@outlook.fr') badge=' <span class="owner-badge">OWNER</span>';
      const div=document.createElement('div');
      div.className='message';
      div.innerHTML=`<strong>${msg.user}</strong>${badge}: ${msg.text}`;
      messagesContainer.appendChild(div);
    });
    messagesContainer.scrollTop=messagesContainer.scrollHeight;
  });
}

// ---------------- Online Users ----------------
function addUserToOnlineList(){
  const safeUser=safeKey(username);
  const ref=db.ref(`onlineUsers/${safeUser}`);
  ref.set(true);
  ref.onDisconnect().remove();
  db.ref('onlineUsers').on('value',snap=>{
    userList.innerHTML='';
    const data=snap.val();
    if(!data) return;
    Object.keys(data).forEach(u=>{
      const li=document.createElement('li');
      if(u==='on-that-ass@outlook_fr') li.innerHTML=`${u} <span class="owner-badge">OWNER</span>`;
      else li.textContent=u.replace(/_/g,'@');
      userList.appendChild(li);
    });
  });
}

// ---------------- Invite URL ----------------
function checkInviteInURL(){
  const params=new URLSearchParams(window.location.search);
  const code=params.get('invite');
  if(code) joinServerByCode(code);
}
