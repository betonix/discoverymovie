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

app.get('/teste', function(req, res) {
    res.json({nome:'beto',idade : 24}); // Renders handlebar template with above json data
});



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
    
    var tempo = 13;

    if (allRooms[room]==undefined){
      allRooms[room] = []
      obj = {
        socketId : socket.id,
        nick : session.nome,
        pontos : 0
      }    
      allRooms[room].push(obj)
      
      setInterval(function(){

      nextMovie(socket,room);
      tempo = 13;
      },12000);

      setInterval(function(){
      tempo = tempo - 1  
      if (tempo<=0){
        tempo=0;
      }
      io.sockets.to(room).emit("tempo",tempo);

      },1001);

    }else{
  
      var nome_user = namePlay(allRooms[room],session.nome)
      socket.handshake.session.nome = nome_user
       obj = {
        socketId : socket.id,
        nick : nome_user,
        pontos : 0
      }    
      allRooms[room].push(obj)
    }
    
      nextMovie(socket,room);



    socket.join(room);
    socket['sala'] = room;
    
    var array = mountAll(allRooms[room],socket.id);
    
    socket.to(room).emit('joinRoom',obj,socket.id);
    socket.adapter.rooms[room].sockets.nome=session.nome;
    socket.emit('meJoinRoom',array,socket.id);

   // console.log(array)


 });

 socket.on('trocarNick',function(socketId,newNick,room){

        trocarNick(socketId,newNick,room);
        console.log('troquei')
        io.sockets.in(room).emit('trocaNick',socketId,newNick);

 });

 socket.on('disconnect', function() {

   var roomOut = socket.adapter.rooms[socket['sala']];
 //allRooms[socket['sala']].pop(session.nome)
   socket.to(socket['sala']).emit('outRoom',session.nome,socket.id);
   console.log(allRooms[socket['sala']])
   allRooms[socket['sala']] = remoteSocket(allRooms[socket['sala']],socket.id);
   console.log(allRooms[socket['sala']])
   cont-=1;

 });
 
 socket.on('nextMovie',function(room) {
     console.log(room)
     //nextMovie(socket,room);
 })

 socket.on('resposta',function(resposta,nomeSala,nick){
  var acertou = false; 
  if (verificaResposta(nomeSala,resposta)){
    somaPonto(nomeSala,socket.id)
    acertou = true;
  }else{
    retiraPontos(nomeSala,socket.id)

  }

  players = []
  for(var i = 0; i<allRooms[nomeSala].length;i++){
    players.push({nick:allRooms[nomeSala][i].nick,pontos:allRooms[nomeSala][i].pontos,socketId:allRooms[nomeSala][i].socketId})
  }

  io.sockets.in(nomeSala).emit('pontos',players)

  io.sockets.in(nomeSala).emit('acertou',nick,acertou)

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
    for (var i = 0 ; i<room.length; i++) {
        
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

var similires = []
function nextMovie(socket,room){
console.log(new Date())
try{
var http = require("https");

var options = {
  "method": "GET",
  "hostname": "api.themoviedb.org",
  "port": null,
  "path": "/3/movie/popular?language=pt-BR&&page="+randomPage()+"&api_key="+API,
  "headers": {}
};

var req = http.request(options, function (res) {
  similires = [];
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
   var body = Buffer.concat(chunks);
   var  data = JSON.parse(body.toString());
   if(data.results!=undefined){
      var filme = data.results[randomMovie()]
   }else{
      nextMovie(socket,room);
   }
   
   similires.push(filme);
 //getImageMovie(filme.backdrop_path,filme.id,socket);
   allRooms[socket['sala']].title = filme.title;
   similarMovie(filme.id,filme.backdrop_path,socket,room)

  });
});
}catch(erro){
	nextMovie(socket,room);
}
req.write("{}");
req.end();

}

function randomPage(){
  return Math.floor((Math.random()*50)+0);

}

function randomMovie(){
  return Math.floor((Math.random()*19)+0);

}

function similarMovie(movie_id,imageUrl,socket,room){
    
var http = require("https");
  var options = {
  "method": "GET",
  "hostname": "api.themoviedb.org",
  "port": null,
  "path": "/3/movie/"+movie_id+"/similar?language=pt-BR&api_key="+API,
  "headers": {}
  };

var req = http.request(options, function (res) {
  var chunks = [];
  
  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    var data = JSON.parse(body.toString());
   for (var i = 0; i < 7; i++) {
       similires.push(data.results[i]);
   }
 // compressAndResize('image.png',socket); 
    compressAndResize(imageUrl,socket,room); 

  });
});

req.write("{}");
req.end();
}


function getImageMovie(image,movie_id,socket){

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
    similarMovie(movie_id,socket);
  });                                                                         
}).end();
}


function compressAndResize (imageUrl,socket,room) {
var Jimp = require("jimp");
shuffle(similires)
//console.log(similires);
var nomes=[]

for(var i=0;i<similires.length;i++){
    try{
    nomes.push(similires[i].title)
  }catch(ee){
  }
}
console.log(allRooms);

io.sockets.in(room).emit('image',imageUrl,nomes);

// console.log(new Date()) 
// // open a file called "lenna.png" 
// Jimp.read(imageUrl, function (err, lenna) {
//     if (err) throw err;
//     lenna.resize(800, 400) 
//          .quality(60)            // resize 
//          .getBuffer(Jimp.MIME_JPEG,function(err, buffer){ // I have other Options like png etc.
//                 console.log(new Date())
//                 shuffle(similires)
//                 console.log(similires);
//                 var nomes=[]
//                 for(var i=0;i<similires.length;i++){
                    
//                     nomes.push(similires[i].title)
//                 }
//                //socket.emit('image',Buffer(buffer).toString('base64'),nomes);
//                 console.log(new Date())
                

//             })
// });
}

var shuffle = function( el ) {
 var i = el.length, j, tempi, tempj;
 if ( i == 0 ) return el;
 while ( --i ) {
    j       = Math.floor( Math.random() * ( i + 1 ) );
    tempi   = el[i];
    tempj   = el[j];
    similires[i] = tempj;
    similires[j] = tempi;
 }
}


function verificaResposta(sala,resposta){

 if(allRooms[sala].title == resposta){

    return true;
  }else{

    return false;
  }

}

function retiraPontos(sala,socketId){

 for (var i = 0; i<allRooms[sala].length;i++) {
   if (allRooms[sala][i].socketId == socketId){
    if (allRooms[sala][i].pontos > 0){
    allRooms[sala][i].pontos = allRooms[sala][i].pontos - 7
    }
   }
 }

}

function somaPonto(sala,socketId){

for (var i = 0; i<allRooms[sala].length;i++) {
   if (allRooms[sala][i].socketId == socketId){
    console.log("somou")

    allRooms[sala][i].pontos = allRooms[sala][i].pontos + 7
   }
 }

}
function trocarNick(socketId,newNick,room){

 for(var i = 0;i<allRooms[room].length;i++){

  if (allRooms[sala][i].socketId == socketId){
      oldNick = allRooms[sala][i].nick
      allRooms[sala][i].nick = newNick
      return [oldNick,newNick];
  }

 }

}


server.listen(3000);