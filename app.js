let app = require('express')()
let server = require('http').Server(app)
let io = require('socket.io')(server)
let cors = require('cors')

app.use(cors())

// 记录所有已经登陆的用户
const users = []
app.get('/', (req,res) => {
  res.send('哈哈哈哈')
})

io.on('connection', (socket) => {
  socket.on('login', function(data) {
    // 判断，如果data在users中存在，说明该用户已经登陆了，不允许登录
    // 如果data在users中不存在，说明该用户没有登陆，允许用户登陆
    let user = users.find(item => item.username === data.username)
    if (user) {
      // 表示用户存在,登陆失败，服务器需要给当前用户响应，告诉登陆失败
      socket.emit('loginError',{msg: '登陆失败'})
      console.log('登陆失败');
    } else {
      // 表示用户不存在
      users.push(data)
      // 告诉用户登陆成功
      socket.emit('loginSuccess', data)
      // console.log('登陆成功');
      // 添加的用户消息
      io.emit('addUser',data)

      // 告诉所有用户，当前聊天室人数
      io.emit('userList',users)

      // 将登陆成功的用户名和头像存储起来
      socket.username = data.username
      socket.avatar = data.avatar
      // 用户断开连接的功能
      socket.on('disconnect', () => {
        // 将当前用户信息从users中删除
        let idx = users.findIndex (item => item.username === socket.username)
        users.splice(idx, 1)
        // 1.广播所有人，有人离开聊天室
        io.emit('delUser',{
          username: socket.username,
          avatar: socket.avatar
        })
        // 2.广播所有人，userlist发生了更新
        io.emit('userList',users)
      })
      // 监听聊天的消息
      socket.on('senMessage',data => {
        console.log(data);
        // 广播给所有用户
        io.emit('receiveMessage',data)
      })
      // 接受图片信息
      socket.on("sendImage",data => {
        //广播给所有用户
        io.emit("receiveImage",data)
      })
    }
  })
});

server.listen(3000, () => {
  console.log('服务器启动成功了');
})