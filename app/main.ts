import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
const PATH_REGEX = /\/echo\/[a-zA-Z0-9]*/;

function pathMatches(regex: RegExp, path: string) {
  return regex.test(path)
}

function extractEndpoint(path: string): string {
  const [_emptyStr, _echo, str] = path.split('/')
  return str
}

function build200Response(body: string) {
  return (`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${body.length}\r\n\r\n${body}`)
}

interface HttpRequestData {
  method: string;
  endpoint: string;
  version: string;
  host: string;
  userAgent: string;
  accept: string;
  body: string;
}

function parseHttpRequest(request: string): HttpRequestData {
  const lines = request.split('\r\n');
  const [method, endpoint, version] = lines[0].split(' ');

  let host = '';
  let userAgent = '';
  let accept = '';
  let body = '';

  let isBody = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (isBody) {
      body += line;
    } else if (line === '') {
      isBody = true;
    } else {
      const [key, value] = line.split(': ');

      switch (key.toLowerCase()) {
        case 'host':
          host = value;
          break;
        case 'user-agent':
          userAgent = value;
          break;
        case 'accept':
          accept = value;
          break;
      }
    }
  }

  return {
    method,
    endpoint,
    version,
    host,
    userAgent,
    accept,
    body
  };
}
// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });

  socket.on('data', (data: Buffer) => {
    const message = data.toString()
    const [requestLine, _headers, _body] = message.split('\r\n')
    const [_method, target, _version] = requestLine.split(' ')

    if (target === '/') {
      socket.write(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"))
    }
    else if (pathMatches(/\/echo\/[a-zA-Z0-9]*/, target)) {
      const str = extractEndpoint(target)
      socket.write(Buffer.from(build200Response(str)))
    } else if (pathMatches(/\/user-agent/, target)) {
      console.log(parseHttpRequest(data.toString()))

      const { userAgent } = parseHttpRequest(data.toString())
      socket.write(Buffer.from(build200Response(userAgent)))
    }
    else {
      socket.write(Buffer.from("HTTP/1.1 404 Not Found\r\n\r\n"))
    }
  })
});

server.listen(4221, "localhost");
