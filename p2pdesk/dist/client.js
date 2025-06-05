"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
class P2PDesktopClient {
    constructor() {
        this.peerConnections = new Map();
        this.dataChannels = new Map();
        this.localPeerId = '';
        // ICE servers configuration
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        this.socket = (0, socket_io_client_1.io)();
        this.initializeSocketEvents();
        this.initializeUI();
    }
    initializeSocketEvents() {
        this.socket.on('connect', () => {
            this.localPeerId = this.socket.id;
            console.log(`Connected to server with ID: ${this.localPeerId}`);
            this.updateStatus(`Connected as ${this.localPeerId}`);
        });
        this.socket.on('peer-list', (peerList) => {
            console.log('Available peers:', peerList);
            this.updatePeerList(peerList);
            // 既存のピアに接続を開始
            peerList.forEach(peerId => {
                this.initiatePeerConnection(peerId);
            });
        });
        this.socket.on('peer-connected', (data) => {
            console.log('Peer connected:', data);
            this.addLogMessage(`System: ${data.message}`);
            this.initiatePeerConnection(data.peerId);
        });
        this.socket.on('peer-disconnected', (data) => {
            console.log('Peer disconnected:', data);
            this.addLogMessage(`System: ${data.message}`);
            this.closePeerConnection(data.peerId);
        });
        this.socket.on('offer', (data) => {
            console.log('Received offer from:', data.sender);
            this.handleOffer(data.offer, data.sender);
        });
        this.socket.on('answer', (data) => {
            console.log('Received answer from:', data.sender);
            this.handleAnswer(data.answer, data.sender);
        });
        this.socket.on('ice-candidate', (data) => {
            console.log('Received ICE candidate from:', data.sender);
            this.handleIceCandidate(data.candidate, data.sender);
        });
        this.socket.on('text-message', (data) => {
            this.addLogMessage(`${data.sender}: ${data.message}`);
        });
    }
    async initiatePeerConnection(peerId) {
        if (this.peerConnections.has(peerId)) {
            return; // Already connected
        }
        const peerConnection = new RTCPeerConnection(this.iceServers);
        this.peerConnections.set(peerId, peerConnection);
        // ICE candidate handling
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    target: peerId
                });
            }
        };
        // Data channel handling
        const dataChannel = peerConnection.createDataChannel('messages', {
            ordered: true
        });
        dataChannel.onopen = () => {
            console.log(`Data channel opened with ${peerId}`);
            this.addLogMessage(`System: Direct connection established with ${peerId}`);
        };
        dataChannel.onmessage = (event) => {
            this.addLogMessage(`${peerId} (P2P): ${event.data}`);
        };
        this.dataChannels.set(peerId, dataChannel);
        peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            channel.onmessage = (event) => {
                this.addLogMessage(`${peerId} (P2P): ${event.data}`);
            };
        };
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            this.socket.emit('offer', {
                offer: offer,
                target: peerId
            });
        }
        catch (error) {
            console.error('Error creating offer:', error);
        }
    }
    async handleOffer(offer, senderId) {
        if (this.peerConnections.has(senderId)) {
            return; // Already connected
        }
        const peerConnection = new RTCPeerConnection(this.iceServers);
        this.peerConnections.set(senderId, peerConnection);
        // ICE candidate handling
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    target: senderId
                });
            }
        };
        // Data channel handling
        peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            this.dataChannels.set(senderId, channel);
            channel.onopen = () => {
                console.log(`Data channel opened with ${senderId}`);
                this.addLogMessage(`System: Direct connection established with ${senderId}`);
            };
            channel.onmessage = (event) => {
                this.addLogMessage(`${senderId} (P2P): ${event.data}`);
            };
        };
        try {
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            this.socket.emit('answer', {
                answer: answer,
                target: senderId
            });
        }
        catch (error) {
            console.error('Error handling offer:', error);
        }
    }
    async handleAnswer(answer, senderId) {
        const peerConnection = this.peerConnections.get(senderId);
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(answer);
            }
            catch (error) {
                console.error('Error handling answer:', error);
            }
        }
    }
    async handleIceCandidate(candidate, senderId) {
        const peerConnection = this.peerConnections.get(senderId);
        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(candidate);
            }
            catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        }
    }
    closePeerConnection(peerId) {
        const peerConnection = this.peerConnections.get(peerId);
        const dataChannel = this.dataChannels.get(peerId);
        if (dataChannel) {
            dataChannel.close();
            this.dataChannels.delete(peerId);
        }
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(peerId);
        }
    }
    initializeUI() {
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }
    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        if (message) {
            // Socket.IOを使用してメッセージを送信
            this.socket.emit('text-message', { message });
            // P2P接続があればそちらでも送信
            this.dataChannels.forEach((channel, peerId) => {
                if (channel.readyState === 'open') {
                    channel.send(message);
                }
            });
            messageInput.value = '';
        }
    }
    addLogMessage(message) {
        const messagesDiv = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    updateStatus(status) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = status;
    }
    updatePeerList(peers) {
        const peerListDiv = document.getElementById('peerList');
        peerListDiv.innerHTML = '<h3>Connected Peers:</h3>';
        if (peers.length === 0) {
            peerListDiv.innerHTML += '<p>No other peers connected</p>';
        }
        else {
            peers.forEach(peerId => {
                const peerElement = document.createElement('div');
                peerElement.textContent = peerId;
                peerElement.className = 'peer-item';
                peerListDiv.appendChild(peerElement);
            });
        }
    }
}
// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new P2PDesktopClient();
});
//# sourceMappingURL=client.js.map