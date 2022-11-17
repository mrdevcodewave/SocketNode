const express = require('express')
const app = express()
const http = require('http');//.createServer(app);
const staticHandler = require('serve-handler');
const { isUndefined } = require('util');

//import module
const LocalStorage = require('node-localstorage').LocalStorage;
// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage('./scratch'); 


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

function getRoomID(userId){

  console.log(rooms,'rsd');
  //room exists or not
  let roomOb = '';
  if(rooms.length>0){

    roomOb = rooms.find((room)=>{
      if(room.users.length==1){
        room.users.push({userName:"B",userId:userId,boxes:[]});
        return room.roomID
      }
    });
    console.log(roomOb.roomID,'dd');
  }

  if(roomOb){
    console.log(roomOb.roomID,'joined room');
    return roomOb.roomID;
  }else{
    //create new one
    let roomObject = {
      roomID:wss.getUniqueID(),
      users:[{userName:"A",userId:userId,boxes:[]}],
      }
    rooms.push(roomObject);
    console.log(roomObject.roomID,'dds');

    return roomObject.roomID;
  }


}


function checkResult(box_id,userId,roomId){

  let returnObj = {type:1,message:'Win'};
  // console.log(JSON.stringify(box_id),'box_id');
  // console.log(JSON.stringify(userId),'userId');
  // console.log(JSON.stringify(roomId),'roomId');
  // console.log(JSON.stringify(rooms),'rooms');

  let boxes =[];
  let room = rooms.filter((roomObject)=>{
    if(roomObject.roomID==roomId){
      return roomObject;
    }
  });
  // console.log(JSON.stringify(room),'room');

  if(room){

    bxs = room[0].users.forEach(user=>{
      if(user.userId==userId){
        user.boxes.push(box_id);
        return user.boxes;
      }
    });
    if(room[0].users.length ==2 && bxs){
      boxes = bxs;
    }else{
     return {type:3,message:'No opponent is there'};
    }
  }else{
    return {type:4,message:'Try to reconnect'};
  }
  
  console.log(boxes,'bx');
  // const boxes = [32, 33, 16, 40];
  const combos = [[1,2,3],[4,5,6],[7,8,9],[1,4,7],[2,5,8],[3,6,9],[1,5,9],[3,5,7]];
  
  let win = false;
	  for (let i = 0; i < combos.length; i++){
       
        if(checkCombo(boxes,combos[i])){
        	win = true;
        	break;
        }
     
    }
  if(!win){
    total = room[0].users.reduce((one,two)=>{
      return one.boxes.length + two.boxes.length;
    });
    console.log(total,'total bx')
    if(total==9){
      return {type:5,message:'Match draw'};
    }
    return {type:5,message:'Play'};
  }else{
    return {type:2,message:'Winner'};
  }
  
}

function checkCombo(box,combo) {
          
    let hasAllElems = true;

    for (let i = 0; i < combo.length; i++){
        if (box.indexOf(combo[i]) === -1) {
            hasAllElems = false;
            break;
        }
    }
    return hasAllElems;
}



let users = [];
let rooms=[];

wss.on('connection', function connection(ws) {
  
  ws.id = wss.getUniqueID();
  ws.roomID = getRoomID(ws.id);

 
  // ws.id = wss.getUniqueID();


  console.log('A new client Connected!');
 
  userObj = {userId:ws.id,useName:"A"};

  if(users.length>=1&&users.length%2==0){
    userObj.userName = "B";
  }

  if(users.length>2){
    msg = JSON.stringify({message:'Slot not empty',type:1,userId:userObj.userId,userData:userObj})//1 for new user 2 for data exchange
    return false;
  }

  users.push(userObj);

  //Setting localStorage Item
  localStorage.setItem('UserData',users)
  
  msg = JSON.stringify({message:'Welcome New Client!',type:1,userId:userObj.userId,roomID:ws.roomID,userData:userObj})//1 for new user 2 for data exchange


  
  ws.send(msg);

  ws.on('message', function incoming(message) {

    // console.log(JSON.parse(message).message,'prs');1568
    const neMessage = JSON.parse(message);
    neMessage.conclution = checkResult(neMessage.box_id,neMessage.userId,neMessage.roomID)
    // console.log('received: %s', neMessage);   

    wss.clients.forEach(function each(client) {
      if (client.roomID == ws.roomID && client.readyState === WebSocket.OPEN) {//client !== ws && 
        // console.log('client',client.id)
        // console.log('room',client.roomID)
        client.send(message);
      }
    });
    
  });
});

app.get('/', (req, res) => res.send('Hello World!'))

server.listen(3000, () => console.log(`Lisening on port :3000`))
