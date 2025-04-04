const { spawn } = require('child_process');
const express = require('express');
const path = require('path');

const app = express();
const port = 2000;

app.use(express.static(path.join(__dirname, 'video.html')));

app.get('/stream', (req, res) => {
    res.contentType('flv');

    const ffmpeg = spawn('ffmpeg', [
        '-f', 'v4l2',               // Video capture format
        '-i', '/dev/video0',        // Correct video device (e.g., /dev/video1)
        '-f', 'alsa',               // Audio format
        '-i', 'hw:0,0',             // Correct audio device (e.g., hw:0,0)
        '-c:v', 'libx264',          // Video codec
        '-preset', 'fast',          // Encoding preset
        '-c:a', 'aac',              // Audio codec
        '-ar', '44100',             // Audio sample rate
        '-b:a', '128k',             // Audio bitrate
        '-f', 'flv',                // FLV output format
        'pipe:1'                    // Pipe output to the server response
    ]);

    ffmpeg.stdout.on('data', (data) => {
        console.log('FFmpeg stdout:', data.toString());
    });

    ffmpeg.stderr.on('data', (data) => {
        console.error('FFmpeg stderr:', data.toString());
    });

    ffmpeg.on('close', (code) => {
        if (code !== 0) {
            console.error(`FFmpeg process exited with code ${code}`);
        }
        res.end();
    });

    ffmpeg.on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).send('FFmpeg error');
    });

    ffmpeg.stdout.pipe(res);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'video.html'));
});

app.listen(port);

// Catch unhandled promise rejections and unhandled exceptions
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);  // Exit the process to prevent it from continuing in an invalid state
});
