const http = require('http');
const { spawn } = require('child_process');

// Create an HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/stream') {
        // Set response headers for MJPEG streaming
        res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        });

        // Spawn ffmpeg to capture video from the webcam
        const ffmpeg = spawn('ffmpeg', [
            '-f', 'v4l2',           // Use v4l2 input format (for webcams)
            '-i', '/dev/video0',    // Input device
            '-f', 'mjpeg',          // Output format: MJPEG (motion jpeg)
            '-q:v', '5',            // Video quality (lower is better)
            '-r', '100',             // Set framerate to 10fps
            'pipe:1'                // Pipe the output to stdout
        ]);

        ffmpeg.stdout.on('data', (data) => {
            // MJPEG format requires boundary to separate frames
            const boundary = '--frame\r\n';
            const contentType = 'Content-Type: image/jpeg\r\n\r\n';
            
            res.write(boundary);
            res.write(contentType);
            res.write(data);  // Send the JPEG frame data
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
                    <img src="/stream" alt="Webcam Stream" />
                </body>
            </html>
        `);
    }
});

// Start the server on port 8080
server.listen(25566, () => {
    console.log('Server is listening on http://localhost:25566');
});
