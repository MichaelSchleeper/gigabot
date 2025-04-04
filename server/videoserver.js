const http = require('http');
const { spawn } = require('child_process');

// Create an HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/stream') {
        // Set response headers for WebM streaming (supports both video and audio)
        res.writeHead(200, {
            'Content-Type': 'video/webm',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Spawn ffmpeg to capture video and audio from the webcam and mic
        const ffmpeg = spawn('ffmpeg', [
            '-f', 'v4l2',           // Use v4l2 input format (for webcams)
            '-i', '/dev/video0',    // Input device for video (webcam)
            '-f', 'alsa',           // Use ALSA for audio capture
            '-i', 'hw:3,0',         // Use the correct audio device (hw:3,0 as per your `arecord` command)
            '-ac', '1',             // Mono audio (1 channel)
            '-ar', '44100',         // Sample rate of 44.1 kHz
            '-c:v', 'vp8',          // VP8 codec for video (WebM)
            '-c:a', 'libopus',      // Opus codec for audio (WebM)
            '-b:v', '1M',           // Video bitrate
            '-b:a', '64k',          // Audio bitrate (adjust as necessary)
            '-f', 'webm',           // WebM container format
            '-async', '1',          // Synchronize audio and video
            'pipe:1'                // Pipe the output to stdout
        ]);

        ffmpeg.stdout.on('data', (data) => {
            // Send the WebM data (both video and audio) to the client
            res.write(data);
        });

        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        ffmpeg.on('close', (code) => {
            console.log(`ffmpeg process exited with code ${code}`);
        });

        ffmpeg.on('error', (err) => {
            console.error('Failed to start ffmpeg:', err);
        });

        // Handle WebSocket or client disconnection
        req.on('close', () => {
            ffmpeg.kill(); // Kill the ffmpeg process if client disconnects
            console.log('Client disconnected');
        });
    } else {
        // Serve the HTML page if the request is not for the stream
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <body>
                    <h1>Webcam Stream</h1>
                    <video id="video-stream" controls autoplay>
                        <source src="/stream" type="video/webm">
                        Your browser does not support the video tag.
                    </video>
                </body>
            </html>
        `);
    }
});

// Start the server on port 25566
server.listen(25566, () => {
    console.log('Server is listening on http://localhost:25566');
});
