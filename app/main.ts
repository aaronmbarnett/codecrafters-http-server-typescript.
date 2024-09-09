import * as net from 'net';
import * as zlib from 'zlib';
import fs from 'fs';
import * as process from 'process';
import {
    buildHttpResponse,
    extractEndpoint,
    HttpRequestData,
    parseHttpRequest,
    pathMatches,
    TempFilePath,
} from './utils';

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here!');
// Uncomment this to pass the first stage

const server = net.createServer((socket) => {
    socket.on('close', () => {
        socket.end();
    });

    socket.on('data', (data: Buffer) => {
        const request = parseHttpRequest(data.toString());
        switch (request.method) {
            case 'GET':
                handleGetRequest(request, socket);
                break;
            case 'POST':
                handlePostRequest(request, socket);
                break;
            default:
                break;
        }
    });
});

server.listen(4221, 'localhost');

function handleGetRequest(request: HttpRequestData, socket: net.Socket): void {
    const { endpoint, userAgent } = request;
    if (endpoint === '/') {
        socket.write(Buffer.from('HTTP/1.1 200 OK\r\n\r\n'));
    } else if (pathMatches(/\/echo\/[a-zA-Z0-9]*/, endpoint)) {
        handleEchoRequest(request, socket);
    } else if (pathMatches(/\/user-agent/, endpoint)) {
        socket.write(
            Buffer.from(
                buildHttpResponse(200, { _type: 'unencrypted', content: userAgent }, { 'Content-Type': 'text/plain' })
            )
        );
    } else if (pathMatches(/\/files\/[a-zA-Z0-9]*/, endpoint)) {
        const filesEndpoint = endpoint as TempFilePath;
        const [_, fileName] = filesEndpoint.split('/files/');
        const pathToTmpFile = `../tmp/data/codecrafters.io/http-server-tester/${fileName}`;
        if (fs.existsSync(pathToTmpFile)) {
            fs.readFile(pathToTmpFile, (error, content) => {
                if (error) {
                    socket.write(Buffer.from('HTTP/1.1 404 Not Found\r\n\r\n'));
                } else {
                    socket.write(
                        Buffer.from(
                            buildHttpResponse(
                                200,
                                { _type: 'unencrypted', content: content.toString() },
                                {
                                    'Content-Type': 'application/octet-stream',
                                }
                            )
                        )
                    );
                }
            });
        } else {
            socket.write(Buffer.from('HTTP/1.1 404 Not Found\r\n\r\n'));
        }
    } else {
        socket.write(Buffer.from('HTTP/1.1 404 Not Found\r\n\r\n'));
    }
}

function handleEchoRequest(request: HttpRequestData, socket: net.Socket) {
    const { endpoint, acceptEncoding } = request;
    const body = extractEndpoint(endpoint);
    if (acceptEncoding.includes('gzip')) {
        const compressedBuffer = zlib.gzipSync(body);
        socket.write(
            Buffer.from(
                buildHttpResponse(
                    200,
                    { _type: 'encrypted', content: compressedBuffer },
                    {
                        'Content-Encoding': 'gzip',
                    }
                )
            )
        );
        socket.write(compressedBuffer);
    } else {
        socket.write(Buffer.from(buildHttpResponse(200, { _type: 'unencrypted', content: body }, {})));
    }
}

function handlePostRequest(request: HttpRequestData, socket: net.Socket) {
    const directory = process.argv[3];
    const { endpoint, body } = request;

    if (pathMatches(/\/files\/[a-zA-Z0-9]*/, endpoint)) {
        const [_, fileName] = endpoint.split('/files/');
        fs.writeFile(directory + fileName, body, (error) => {
            if (error) {
                console.log(error);
            } else {
                socket.write(Buffer.from('HTTP/1.1 201 Created\r\n\r\n'));
            }
        });
    }
}
