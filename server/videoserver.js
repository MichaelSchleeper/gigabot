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

    // Spawn the mplayer process to capture video from the webcam
    const mplayer = spawn('mplayer', [
        'tv://', 
        '-tv', 'driver=v4l2:device=/dev/video0:input=0:width=640:height=360', 
        '-vo', 'null', 
        '-nolirc'
    ]);

    mplayer.stdout.on('data', (data) => {
        console.log('Received video data');
        // Send video stream data to WebSocket client
        ws.send(data);
    });

    mplayer.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    mplayer.on('close', (code) => {
        console.log(`mplayer process exited with code ${code}`);
    });

    // Handle WebSocket closing
    ws.on('close', () => {
        console.log('Client disconnected');
        mplayer.kill(); // Stop mplayer if the WebSocket connection is closed
    });
});

// Start the server on port 8080
server.listen(8080, () => {
    console.log('Server is listening on http://localhost:8080');
});
