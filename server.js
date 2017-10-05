 const KEY = 'nome-do-cookie';
 const SECRET = 'chave-secreta-aqui!';
 const API = '1867f61baa228323cefe3f8697601a0f';
 var express = require('express')
   , cookieParser = require('cookie-parser')
   , expressSession = require('express-session')
   , app = express()
   , server = require('http').createServer(app)
   , io = require('socket.io').listen(server)
   , cookie = cookieParser(SECRET)
   , store = new expressSession.MemoryStore()
 ;
 // Configurando middlewares de Session e Cookie no Express
 app.set('views', __dirname);
 app.set('view engine', 'ejs');
 app.use(cookie);
 app.use(expressSession({
   secret: SECRET,
   name: KEY,
   resave: true,
   saveUninitialized: true,
   store: store
 }));

var numeroPlay = 0
var numero = ""

io.use(function(socket, next) {
   var data = socket.request;
   cookie(data, {}, function(err) {
     var sessionID = data.signedCookies[KEY];
     store.get(sessionID, function(err, session) {
       if (err || !session) {
         return next(new Error('Acesso negado!'));
       } else {
         socket.handshake.session = session;
         return next();
       }
     });
   });
 });


app.get("/", function(req, res){
   // Armazenando o nome na sessão.
  // console.log(req)
   res.render('home');
});

cont=0;
app.get('/room/:roomId', function (req, res) {
  // Access userId via: req.params.userId
  // Access bookId via: req.params.bookId 
  var numeroAnonimo = ""
 if(req.session.nome == undefined){

    // if (cont>0){
    //   numeroAnonimo = '('+cont+')'
    // }

  req.session.nome = "Anônimo"+numeroAnonimo;
  req.session.sessionID = req.sessionID;

 }
 cont+=1
  sala = req.params.roomId
 
  res.render('sala');

})

var allRooms = {};

io.on("connection", function(socket) {
user = socket.id
var session = socket.handshake.session;



room = ""
 players = 0

 socket.on('joinRoom',function(room){
    

    if (allRooms[room]==undefined){
      allRooms[room] = []
      obj = {
        socketId : socket.id,
        nick : session.nome
      }    
      allRooms[room].push(obj)
      
    }else{

      obj = {
        socketId : socket.id,
        nick : session.nome
      }    
      var nome_user = namePlay(allRooms[room],session.nome)
      socket.handshake.session.nome = nome_user
       obj = {
        socketId : socket.id,
        nick : nome_user
      }    
      allRooms[room].push(obj)
    }
    

    socket.join(room);
    socket['sala'] = room;
    
    var array = mountAll(allRooms[room],socket.id);
    
    socket.to(room).emit('joinRoom',session.nome,socket.id);
    socket.adapter.rooms[room].sockets.nome=session.nome;
    socket.emit('meJoinRoom',array,socket.id);

   // console.log(array)


 });

 socket.on('disconnect', function() {

   var roomOut = socket.adapter.rooms[socket['sala']];
 //allRooms[socket['sala']].pop(session.nome)
   socket.to(socket['sala']).emit('outRoom',session.nome,socket.id);
   allRooms[socket['sala']] = remoteSocket(room,socket.id);
   cont-=1;

 });
 
 socket.on('nextMovie',function() {
     
     nextMovie(socket);
 })

 socket.on('sendMsg',function(socketId,msg,room){
   var  user = nameSocket(allRooms[room],socketId)
    socket.to(room).emit('receiveMsg',user,msg);
    socket.emit('meReceiveMsg',user,msg);
    

 });

});

function namePlay(room,nomeInRoom){

  for (var i = room.length - 1; i >= 0; i--) {

    if(room[i].nick == nomeInRoom){  
    numero = '('+numeroPlay+')'
    nomeInRoom = "Anônimo"+numero;
    numeroPlay +=1 
    return namePlay(room,nomeInRoom);

  }

}
 numeroPlay = 0 
 return nomeInRoom 
}



function mountAll(room,socketClient){
 var arrayRooms = []
for (var i = room.length; i--; ) {
    

        arrayRooms.push(room[i]);
    
}
  return arrayRooms
}

function remoteSocket(room,socketId){
 var arrayRooms = []
    for (var i = room.length; i--; ) {
        
    if(room[i].socketId!=socketId){
        arrayRooms.push(room[i]);
        
    }
        
    }
    return arrayRooms;
}

function nameSocket(room,socketId){
    
    for (var i = room.length; i--; ) {
        
    if(room[i].socketId==socketId){
        return room[i].nick
        
    }
        
    }
}


function nextMovie(socket){
//console.log(new Date())
var http = require("https");

var options = {
  "method": "GET",
  "hostname": "api.themoviedb.org",
  "port": null,
  "path": "/3/movie/popular?language=pt-BR&&page="+randomPage()+"&api_key="+API,
  "headers": {}
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    data = JSON.parse(body.toString());
    filme = data.results[randomMovie()]
 //   console.log(filme)
  //similarMovie(filme.id);
    return getImageMovie(filme.backdrop_path,socket);


  });
});

req.write("{}");
req.end();

}

function randomPage(){
  return Math.floor((Math.random()*60)+1);

}

function randomMovie(){
  return Math.floor((Math.random()*10)+1);

}

function similarMovie(movie_id){
var http = require("https");
  var options = {
  "method": "GET",
  "hostname": "api.themoviedb.org",
  "port": null,
  "path": "/3/movie/72545/similar?language=pt-BR&api_key="+API,
  "headers": {}
  };

var req = http.request(options, function (res) {
  var chunks = [];
  
  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    data = JSON.parse(body.toString());
   // console.log(data.results)

  });
});

req.write("{}");
req.end();
}


function getImageMovie(image,socket){

  var http = require('https'),                                                
    Stream = require('stream').Transform,                                  
    fs = require('fs');                                                    

var url = 'https://image.tmdb.org/t/p/original'+image;                    

http.request(url, function(response) {                                        
  var data = new Stream();                                                    

  response.on('data', function(chunk) {                                       
    data.push(chunk);                                                         
  });                                                                         

  response.on('end', function() {                                             
    fs.writeFileSync('image.png', data.read()); 
    compressAndResize('image.png',socket);  
  });                                                                         
}).end();
}


function compressAndResize (imageUrl,socket) {
var Jimp = require("jimp");
 
// open a file called "lenna.png" 
Jimp.read(imageUrl, function (err, lenna) {
    if (err) throw err;
    lenna.resize(550, 300) 
         .quality(60)            // resize 
         .getBuffer(Jimp.MIME_JPEG,function(err, buffer){ // I have other Options like png etc.

                socket.emit('image',Buffer(buffer).toString('base64'));

            })
});
}
server.listen(8080);