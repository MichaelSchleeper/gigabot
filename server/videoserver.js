const http = require('http');
const { spawn } = require('child_process');

let ffmpeg; // Declare ffmpeg globally to control its process

const server = http.createServer((req, res) => {
    if (req.url === '/stream') {
        // Set response headers for video streaming
        res.writeHead(200, {
            'Content-Type': 'video/x-flv',
            'Cache-Control': 'no-cache', // Prevent caching of the video stream
            'Connection': 'keep-alive'   // Keep connection alive
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
            '-f', 'flv',            // FLV output format (better for H.264 streams)
            '-vcodec', 'libx264',   // H.264 codec
            '-preset', 'ultrafast', // Use ultrafast preset for low latency
            '-tune', 'zerolatency', // Tune for low latency
            '-b:v', '1M',           // Video bitrate (adjust as needed)
            'pipe:1'                // Pipe the output to stdout
        ]);

        // Stream the output from ffmpeg to the client
        ffmpeg.stdout.on('data', (data) => {
            res.write(data); // Send the video data to the browser
        });

        // Capture stderr output to see any issues with ffmpeg
        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`);
        });

        // Log when ffmpeg process closes
        ffmpeg.on('close', (code) => {
            console.log(`ffmpeg process exited with code ${code}`);
        });

        // Handle error events
        ffmpeg.on('error', (err) => {
            console.error('Failed to start ffmpeg:', err);
        });

        // Close the ffmpeg process if the client disconnects
        req.on('close', () => {
            ffmpeg.kill('SIGTERM');
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
                        <source src="/stream" type="video/x-flv">
                        Your browser does not support the video tag.
                    </video>
                </body>
            </html>
        `);
    }
});

// Start the server on port 8080
server.listen(25565, () => {
    console.log('Server is listening on http://localhost:25565');
});
