const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

// Create an HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
            <body>
                <h1>Webcam Stream</h1>
                <video id="videoElement" width="640" height="360" autoplay></video>
                <script>
                    var videoElement = document.getElementById('videoElement');
                    var ws = new WebSocket('ws://localhost:8080');
                    ws.onmessage = function(event) {
                        var arrayBufferView = new Uint8Array(event.data);
                        var blob = new Blob([arrayBufferView], { type: "video/webm" });
                        var url = URL.createObjectURL(blob);
                        videoElement.src = url;
                    };
                </script>
            </body>
        </html>
    `);
});

// Set up WebSocket server to send video data to clients
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Spawn the ffmpeg process to capture video from the webcam
    const ffmpeg = spawn('ffmpeg', [
        '-f', 'v4l2',           // Use video4linux2 input format
        '-i', '/dev/video0',    // Input device
        '-t', '10',             // Capture 10 seconds (adjust for your use case)
        '-f', 'webm',           // Output format (webm is efficient for streaming)
        '-c:v', 'vp8',          // Video codec (VP8 for webm)
        '-b:v', '1M',           // Video bitrate
        '-an',                  // No audio
        'pipe:1'                // Send output to stdout
    ]);

    ffmpeg.stdout.on('data', (data) => {
        console.log('Sending video data');
        // Send video stream data to WebSocket client
        ws.send(data);
    });

    ffmpeg.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        console.log(`ffmpeg process exited with code ${code}`);
    });

    // Handle WebSocket closing
    ws.on('close', () => {
        console.log('Client disconnected');
        ffmpeg.kill(); // Stop ffmpeg if the WebSocket connection is closed
    });
});

// Start the server on port 8080
server.listen(8080, () => {
    console.log('Server is listening on http://localhost:8080');
});
