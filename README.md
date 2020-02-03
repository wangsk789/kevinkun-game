# 接口方法

## 客户端：

### login(username)

登录进入大厅

登录成功会收到logedin事件

### match()

进入排队

如果排队人数达到要求，就自动进入用一个房间，并收到matched事件，返回玩家列表

### cancelmatch()

退出排队

### sendevent(eventname, eventcontent)

发送游戏事件及内容

房间内所有玩家都收到事件名称和事件内容

### quitgame()

退出游戏

房间内其他人收到otherLeft事件

