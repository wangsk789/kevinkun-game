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
var usersOnline = [];

io.on('connection', function (socket) {
	
	var cancelmatch = function(){
			var index = matchlist.indexOf(socket);
			if(index !== -1){
				matchlist.splice(index,1);
				console.log(socket.username + "退出排队",);
			}
			
		}

	var quitgame = function(){
		if(socket.roomname){
				socket.leave(socket.roomname);
				io.sockets.in(socket.roomname).emit('otherLeft', {"leftuser":socket.username}); 
				socket.roomname="";
			}
	}

	socket.on("login",function (username){
		if(!socket.username){
			var index = usersOnline.indexOf(username);
			if(index == -1){
				socket.username=username;
				usersOnline.push(username);
				var data ={};
				socket.emit("logedin",data);
				console.log(socket.username +"登录服务器");
			}else {
				var data ={};
				data.code =1;
				data.desc = "duplicate username";
				socket.emit("goterror",data);
			}
		}

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
  
	socket.on("cancelmatch",cancelmatch);
	socket.on('quitgame', quitgame);
  
	socket.on('disconnect', function () {
		cancelmatch();
		quitgame();
		if(socket.username){
			var index = usersOnline.indexOf(socket.username);
			usersOnline.splice(index,1);
			socket.username=null;

		}

   
	});
	
	socket.on('setmaxuser', function (maxuser) {
		maxUserNum = maxuser;   
	});

	


});



http.listen(port, function(){
  console.log('listening on *:' + port);
});