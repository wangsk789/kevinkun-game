var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5050;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


var matchlist = [];
var maxUserNum = 2;
var roomindex = 0;

io.on('connection', function (socket) {


	socket.on("login",function (username){

			socket.username=username;
			var data ={};
			socket.emit("logedin",data);
			console.log(socket.username +"登录服务器");

	});
	socket.on("startmatch",function(){
		var index = matchlist.indexOf(socket);
		if(index == -1){
			matchlist.push(socket);
			if(matchlist.length>=maxUserNum){
				roomindex++;
				var roomname="room" + roomindex;
				var userlist = [];
				
				for(var i=0; i < maxUserNum; i++){
					matchlist[i].join(roomname);
					matchlist[i].roomname=roomname;
					userlist.push(matchlist[i].username);
					
				}
				matchlist.splice(0,2);			
				io.sockets.in(roomname).emit('matched', {"userlist":userlist}); 
				console.log("新房间：" +roomname);
			}
			console.log("当前排队人数"+matchlist.length);
		}
		
	});
	
	socket.on("cancelmatch",function(){
		var index = matchlist.indexOf(socket);
		if(index !== -1){
			matchlist.splice(index,1);
			console.log(socket.username + "退出排队",);
		}
		
	});
	

	
	socket.on('sendmessage', function (eventName, eventContent) {
		if(socket.roomname){
			var data ={};
			data.from = socket.username;
			data.name = eventName;
			data.content = eventContent;
			io.sockets.in(socket.roomname).emit('gotmessage', data); 
			console.log(socket.username +"在房间"+socket.roomname +"中发送事件："+ eventName + "，事件内容：" +eventContent);
		}
			

	});
  
  
	socket.on('quitgame', function () {
		if(socket.roomname){
			socket.leave(socket.roomname);
			io.sockets.in(socket.roomname).emit('otherLeft', {"leftuser":socket.username}); 
			socket.roomname="";
		}
	});
  


	socket.on('disconnect', function () {
		if(socket.roomname){
			socket.leave(socket.roomname);
			io.sockets.in(socket.roomname).emit('otherLeft', {"leftuser":socket.username}); 
			socket.roomname="";
		}

   
	});
	
	socket.on('setmaxuser', function (maxuser) {
		maxUserNum = maxuser;   
	});




});
http.listen(port, function(){
  console.log('listening on *:' + port);
});