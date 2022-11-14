const express = require('express')
const app = express()
const http = require('http');//.createServer(app);
const staticHandler = require('serve-handler');

const WebSocket = require('ws');

//serve static folder
const server = http.createServer((req, res) => {   // (1)
  return staticHandler(req, res, { public: 'public' })
});

const wss = new WebSocket.Server({ server:server });

wss.getUniqueID = function () {
  function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4();
};

let users = [];
wss.on('connection', function connection(ws) {
  console.log('A new client Connected!');
  userId = wss.getUniqueID()
  users.push(userId);
  msg = JSON.stringify({message:'Welcome New Client!',type:1,userId:userId})//1 for new user 2 for data exchange

  if(users.length>2){
    msg = JSON.stringify({message:'Already exists',type:1,userId:userId})//1 for new user 2 for data exchange
    return false;
  }
  
  ws.send(msg);

  ws.on('message', function incoming(message) {

    // console.log(JSON.parse(message).message,'prs');1568
    console.log('received: %s', message);   

    wss.clients.forEach(function each(client) {
      client.userId = userId;
      if (client.readyState === WebSocket.OPEN) {//client !== ws && 
         console.log('client',client.userId)
        client.send(message);
      }
    });
    
  });
});

app.get('/', (req, res) => res.send('Hello World!'))

server.listen(3000, () => console.log(`Lisening on port :3000`))
