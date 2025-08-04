const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 3000;
const { Server } = require('socket.io');
const cors = require('cors')
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    }
});

const jwt = require('./jwt')
const path = require('path')
const fileUpload = require('express-fileupload');

const login = require('./login/RLogin');
const users = require('./users/RUsers');
const package = require('./package/RPackage');
const items = require('./items/RItems');
const answer = require('./answer/RAnswer');
const exams = require('./exams/RExams');
const participant = require('./participan/RParticipan')
const attachments = require('./attachments/Rattachment')
const participantSection = require('./participant_section/RParticipant_section')
const doExams = require('./my_exams/router')(io);    
const proctor = require('./proctors/router')(io);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'file')), jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 4, 5]));
app.use(fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'file/build')
}));


app.use('/login', login);
app.use('/users', users);
app.use('/package', package)
app.use('/items', items);
app.use('/answer', answer)
app.use('/exams', exams)
app.use('/participant', participant)
app.use('/attachment', attachments);
app.use('/participant-section', participantSection)
app.use('/do-exams', doExams);
app.use('/proctors', proctor);

io.on('connection', (socket) => {
    console.log('Socket connected :', socket.id);

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });      
});

app.get('/', jwt.verifyToken, async(req, res)=>{
    res.sendStatus(200);
});
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
