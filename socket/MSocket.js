// const mProctor = require('../proctors/models');

// module.exports = function(socket, io){
//     console.log('Socket connected :', socket.id);

//     socket.on('get-participant-exam', async(exam_id)=>{
//         const data = await mProctor.getExamParticipantLogs(exam_id);
//         if(data !== false){
//             socket.emit('participant-exam-data', data);
//             console.log(data);
//         }else{
//             socket.emit('participant-exam-error', {message : 'Internal server error'});
//         }
//     });

//     socket.on('get-logs', async(prtId)=>{
//         const data = await mProctor.getLogs(prtId);
//         if(data !== false){
//             socket.emit('logs-data', data);
//         }else{
//             socket.emit('logs-error', {message : 'Internal server error'});
//         }
//     });

//     socket.on('get-section', async(sectionId)=>{
//         const data = await mProctor.getSection(sectionId);
//         if(data !== false){
//             socket.emit('section-data', data);
//         }else{
//             socket.emit('section-error', {message : 'Internal server error'});
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('Socket disconnected:', socket.id);
//     });      

// }