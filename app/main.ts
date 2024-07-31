import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
const PATH_REGEX = /\/echo\/[a-zA-Z0-9]*/;

function isEchoPath(path: string) {
  return PATH_REGEX.test(path)
}

function extractEndpoint(path: string): string {
  const [_emptyStr, _echo, str] = path.split('/')
  return str
}



// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });

  socket.on('data', (data) => {
    const message = data.toString()
    const [requestLine, _headers, _body] = message.split('\r\n')
    const [_method, target, _version] = requestLine.split(' ')

    if (target === '/') {
      socket.write(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"))
    }
    else if (isEchoPath(target)) {
      const str = extractEndpoint(target)
      socket.write(Buffer.from(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`))
    }
    else {
      socket.write(Buffer.from("HTTP/1.1 404 Not Found\r\n\r\n"))
    }
  })
});

server.listen(4221, "localhost");
