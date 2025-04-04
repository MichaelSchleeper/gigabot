const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
process.on('SIGINT', shutDownServer);
process.on('SIGTERM', shutDownServer);
const app = express();
const port = 3000;

// Serve the static files
app.use(express.static(path.join(__dirname, 'video')));

// Route to stream video and audio from webcam
app.get('/stream', (req, res) => {
    res.contentType('flv'); // Define the streaming format (FLV is commonly used for Flash)

    // Start FFmpeg process to capture video and audio
    const ffmpeg = spawn('ffmpeg', [
        '-f', 'v4l2',                // Video capture format
        '-i', '/dev/video0',         // Webcam device
        '-f', 'alsa',                // Audio format
        '-i', 'hw:1,0',              // Audio device
        '-c:v', 'libx264',           // Video codec
        '-preset', 'fast',           // Encoding preset
        '-c:a', 'aac',               // Audio codec
        '-ar', '44100',              // Audio sample rate
        '-b:a', '128k',              // Audio bitrate
        '-f', 'flv',                 // FLV output format
        'pipe:1'                     // Pipe output to the server response
    ]);

    // Pipe the output from FFmpeg to the response
    ffmpeg.stdout.pipe(res);

    // Handle errors
    ffmpeg.on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.sendStatus(500);
    });

    // Handle FFmpeg process exit
    ffmpeg.on('close', () => {
        console.log('FFmpeg process finished.');
        res.end();
    });
});

// Serve a basic HTML page to display the stream
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'video.html'));
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
function shutDownServer(){
    console.log("Shutting down server"); 
    server.close()
    console.log("Server shut down!\nGoodbye!"); 
    process.exit(0);
}
