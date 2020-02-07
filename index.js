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
var rooms={};

io.on('connection', function (socket) {
	
	var cancelmatch = function(){
		var index = matchlist.indexOf(socket);
		if(index !== -1){
			matchlist.splice(index,1);
			//console.log(socket.username + "退出排队",);
		}
	}

	var leaveroom = function(){
		if(socket.roomname){
				var index = rooms[socket.roomname].userlist.indexOf(socket.username);
				rooms[socket.roomname].userlist.splice(index, 1);
				socket.leave(socket.roomname);
				var data ={};
				data.username = socket.username;
				data.userlist = rooms[socket.roomname].userlist;
				io.sockets.in(socket.roomname).emit('otherleftroom', data); 

				console.log(socket.username +"离开了房间"+socket.roomname+ ",剩余用户："+ data.userlist +",人数："+ data.userlist.length);
					socket.roomname="";			
				// if(data.userlist.length<=0){
					// delete rooms[roomname];
					// console.log(roomname +"已销毁");
				// }
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
				//console.log(socket.username +"登录服务器");
			}else {
				var data ={};
				data.code =1;
				data.desc = "duplicate username";
				socket.emit("goterror",data);
			}
		}
	});
	
	socket.on("joinroom",function (roomname){
		if(socket.username){
			if(!socket.roomname){
				if (!rooms[roomname]) {
				  rooms[roomname] ={};
				  rooms[roomname].userlist = [];
				}
				if(rooms[roomname].userlist.length >=maxUserNum){
					var data ={};
					data.code =4;
					data.desc = "room full";
					socket.emit("goterror",data);
				}else{
						rooms[roomname].userlist.push(socket.username);
						socket.roomname=roomname;
						socket.join(roomname); 
						var data ={};
						data.username = socket.username;
						data.usernum = rooms[roomname].userlist.length;
						data.userlist = rooms[roomname].userlist;

						io.sockets.in(roomname).emit('joinedroom', data);  
						
						console.log(socket.username +"加入了房间"+ socket.roomname+",房间用户："+ data.userlist+",人数："+ data.userlist.length);

					
				}
			}else {
				var data ={};
				data.code =5;
				data.desc = "already in a room";
				socket.emit("goterror",data);
			}
				

		}
	});
	
	
	socket.on("startmatch",function(){
		if(socket.username){
			var index = matchlist.indexOf(socket);
			if(index == -1){
				matchlist.push(socket);
				if(matchlist.length>=maxUserNum){
					roomindex++;
					var roomname="room" + roomindex;
					var userlist = [];
					if (!rooms[roomname]) {
					  rooms[roomname] ={};
					  rooms[roomname].userlist = [];
					}
					for(var i=0; i < maxUserNum; i++){
						matchlist[i].join(roomname);
						matchlist[i].roomname=roomname;
						userlist.push(matchlist[i].username);
					}
					matchlist.splice(0,2);		
					rooms[roomname].userlist=userlist;
					io.sockets.in(roomname).emit('matched', {"userlist":userlist}); 
					//console.log("新房间：" +roomname);
				}
				//console.log("当前排队人数"+matchlist.length);
			}
		}else {
				var data ={};
				data.code =2;
				data.desc = "not logedin";
				socket.emit("goterror",data);
			}
		
	});

	socket.on('sendmessage', function (eventName, eventContent) {
		if(socket.roomname){
			var data ={};
			data.from = socket.username;
			data.name = eventName;
			data.content = eventContent;
			io.sockets.in(socket.roomname).emit('gotmessage', data); 
			//console.log(socket.username +"在房间"+socket.roomname +"中发送事件："+ eventName + "，事件内容：" +eventContent);
		}else {
				var data ={};
				data.code =3;
				data.desc = "not in game";
				socket.emit("goterror",data);
			}
	});
  
	socket.on("cancelmatch",cancelmatch);
	socket.on('leaveroom', leaveroom);
  
	socket.on('disconnect', function () {
		cancelmatch();
		leaveroom();
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