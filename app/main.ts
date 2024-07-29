import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });

  socket.on('data', (data) => {
    const message = data.toString()
    const [requestLine, _headers] = message.split('\r\n')
    const [_method, target, _version] = requestLine.split(' ')
    if (target === '/') {
      socket.write(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"))
    } else {
      socket.write(Buffer.from("HTTP/1.1 404 Not Found\r\n\r\n"))
    }
  })
});

server.listen(4221, "localhost");
