const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer();
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

let localStream;

const micAudio = new Audio('/audio/toggle.mp3');
const cameraAudio = new Audio('/audio/toggle.mp3');
const messageSendAudio = new Audio('/audio/message.mp3');

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    });
});

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close();
});

myPeer.on('open', id => {
    socket.emit('join-room', roomId, id);
});

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });
    peers[userId] = call;
}

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.className = "w-full h-auto max-w-xs rounded shadow-lg";
    video.style.border = "2px solid #ffffff";
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}

function toggleMic() {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;

        const micBtn = document.getElementById('mic-btn');
        const micStatus = document.getElementById('mic-status');
        if (audioTrack.enabled) {
            micBtn.classList.replace('bg-gray-600', 'bg-red-600');
            micStatus.textContent = 'Mute';
        } else {
            micBtn.classList.replace('bg-red-600', 'bg-gray-600');
            micStatus.textContent = 'Unmute';
        }

        micAudio.play();
    }
}

function toggleCamera() {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;

        const cameraBtn = document.getElementById('camera-btn');
        const cameraStatus = document.getElementById('camera-status');
        if (videoTrack.enabled) {
            cameraBtn.classList.replace('bg-gray-600', 'bg-green-600');
            cameraStatus.textContent = 'Camera Off';
        } else {
            cameraBtn.classList.replace('bg-green-600', 'bg-gray-600');
            cameraStatus.textContent = 'Camera On';
        }

        cameraAudio.play();
    }
}

const input = document.getElementById('chat_input');
function sendMessage() {
    if (input.value.trim() !== "") {
        // const path = window.location.pathname;
        // const pathParts = path.split('/');
        // const id = pathParts[1];
        socket.emit('message', `<b>Unknown:</b> ${input.value}`);

        input.value = "";

        messageSendAudio.play();
    }
}

socket.on('createMessage', message => {
    const msg = document.createElement('div');
    msg.innerHTML = message;  
    document.getElementById('messages').append(msg);
});
