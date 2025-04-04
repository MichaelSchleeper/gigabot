const { spawn } = require('child_process');

let ffmpeg; // Declare ffmpeg globally to control its process

const server = http.createServer((req, res) => {
    if (req.url === '/stream') {
        // Set response headers for MJPEG streaming
        res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        });

        // If there's an existing ffmpeg process, kill it
        if (ffmpeg) {
            ffmpeg.kill('SIGTERM');
            console.log('Previous ffmpeg process killed');
        }

        // Spawn a new ffmpeg process to capture video from the webcam
        ffmpeg = spawn('ffmpeg', [
            '-f', 'v4l2',           // Use v4l2 input format (for webcams)
            '-i', '/dev/video0',    // Input device
            '-f', 'mjpeg',          // Output format: MJPEG (motion jpeg)
            '-q:v', '5',            // Video quality (lower is better)
            '-r', '30',             // Set framerate to 30fps
            '-bufsize', '512k',     // Set the buffer size to 512KB (prevent large buffering)
            '-tune', 'zerolatency', // Tune for low latency (useful for real-time streaming)
            'pipe:1'                // Pipe the output to stdout
        ]);

        // Stream the output from ffmpeg to the client
        ffmpeg.stdout.on('data', (data) => {
            const boundary = '--frame\r\n';
            const contentType = 'Content-Type: image/jpeg\r\n\r\n';

            res.write(boundary);    // Write boundary
            res.write(contentType); // Write content type
            res.write(data);         // Write the actual frame data
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

        req.on('close', () => {
            ffmpeg.kill('SIGTERM'); // Terminate the ffmpeg process if client disconnects
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
server.listen(25565, () => {
    console.log('Server is listening on http://localhost:8080');
});
