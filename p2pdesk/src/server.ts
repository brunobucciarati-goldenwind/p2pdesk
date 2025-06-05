import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import { networkInterfaces } from 'os';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// CORS設定
app.use(cors());

// 接続されたクライアントを管理
const connectedClients = new Map<string, any>();

io.on('connection', (socket: any) => {
  console.log(`Client connected: ${socket.id}`);
  
  // クライアントリストに追加
  connectedClients.set(socket.id, socket);
  
  // 他のクライアントに新しいクライアントの接続を通知
  socket.broadcast.emit('peer-connected', {
    peerId: socket.id,
    message: `${socket.id} has joined the session`
  });
  
  // 現在接続中のピアリストを送信
  const peerList = Array.from(connectedClients.keys()).filter(id => id !== socket.id);
  socket.emit('peer-list', peerList);

  // P2P接続のためのシグナリング
  socket.on('offer', (data: any) => {
    console.log(`Offer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('answer', (data: any) => {
    console.log(`Answer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('ice-candidate', (data: any) => {
    console.log(`ICE candidate from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // テキストメッセージの転送
  socket.on('text-message', (data: any) => {
    console.log(`Message from ${socket.id}: ${data.message}`);
    // 全てのクライアントにメッセージを送信
    io.emit('text-message', {
      message: data.message,
      sender: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // 切断処理
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
    
    // 他のクライアントに切断を通知
    socket.broadcast.emit('peer-disconnected', {
      peerId: socket.id,
      message: `${socket.id} has left the session`
    });
  });
});

const PORT = parseInt(process.env.PORT || '8080');

function getLocalIPAddresses(): string[] {
  const interfaces = networkInterfaces();
  const addresses: string[] = [];
  
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (nets) {
      for (const net of nets) {
        // IPv4アドレスで、内部アドレスではないものを取得
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }
  }
  
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 P2P Remote Desktop Server Started!');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log('');
  console.log('📱 クライアント接続用IPアドレス:');
  
  const localIPs = getLocalIPAddresses();
  if (localIPs.length > 0) {
    localIPs.forEach(ip => {
      console.log(`   🌐 ${ip}:${PORT}`);
    });
  } else {
    console.log(`   🌐 localhost:${PORT}`);
  }
  
  console.log('');
  console.log('📂 独立クライアントファイル:');
  console.log(`   📄 ${__dirname}/../client/index.html`);
  console.log('');
  console.log('💡 使用方法:');
  console.log('   1. client/index.html をブラウザで開く');
  console.log('   2. 上記のIPアドレスの一つを入力');
  console.log('   3. 接続ボタンをクリック');
  console.log('='.repeat(60));
});
