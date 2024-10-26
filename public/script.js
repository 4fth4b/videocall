const socket = io('/');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let localStream;
let peer;

document.getElementById('joinButton').addEventListener('click', joinRoom);

function joinRoom() {
  const roomName = document.getElementById('roomName').value.trim();
  if (!roomName) return alert('Please enter a room name');

  socket.emit('join-room', roomName);
  
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      localVideo.srcObject = stream;
      localStream = stream;

      socket.on('user-connected', (userId) => {
        console.log('User connected:', userId);
        initializePeerConnection(userId, true); 
      });

      socket.on('signal', (data) => {
        if (data.userId !== socket.id) {
          console.log('Received signal from server:', data);
          if (!peer) {
            initializePeerConnection(data.userId, false);
          }
          peer.signal(data.signal);
        }
      });

      socket.on('user-disconnected', (userId) => {
        console.log('User disconnected:', userId);
        if (peer && peer.destroy) peer.destroy();
      });
    })
    .catch((error) => {
      console.error('Error accessing media devices:', error);
    });
}

function initializePeerConnection(userId, initiator) {
  peer = new SimplePeer({
    initiator: initiator,
    trickle: false,
    stream: localStream
  });

  peer.on('signal', (signal) => {
    socket.emit('signal', { userId: userId, signal: signal });
  });

  peer.on('stream', (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
  });

  peer.on('connect', () => {
    console.log('Peer connection established');
  });

  peer.on('error', (err) => {
    console.error('Peer connection error:', err);
  });

  peer.on('close', () => {
    console.log('Peer connection closed');
    remoteVideo.srcObject = null;
  });
}

// Add event listeners for mute and hang up buttons
document.getElementById('muteButton').addEventListener('click', toggleMute);
document.getElementById('hangupButton').addEventListener('click', endCall);

function toggleMute() {
  localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
}

function endCall() {
  if (peer && peer.destroy) peer.destroy();
  localStream.getTracks().forEach(track => track.stop());
  window.location.reload();
}
