import * as net from 'net'
import fs from 'fs'

type TempFilePath = `/files/${string}`

interface HttpRequestData {
    method: string
    endpoint: string
    version: string
    host: string
    userAgent: string
    accept: string
    body: string
}

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here!')
const PATH_REGEX = /\/echo\/[a-zA-Z0-9]*/

function pathMatches(regex: RegExp, path: string) {
    return regex.test(path)
}

function extractEndpoint(path: string): string {
    const [_emptyStr, _echo, str] = path.split('/')
    return str
}

function build200Response(body: string, contentType: 'text/plain' | 'application/octet-stream') {
    return `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${body.length}\r\n\r\n${body}`
}

function parseHttpRequest(request: string): HttpRequestData {
    const lines = request.split('\r\n')
    const [method, endpoint, version] = lines[0].split(' ')

    const headers: { [key: string]: string } = {}
    let body = ''
    let isBody = false

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]

        if (isBody) {
            body += line
        } else if (line === '') {
            isBody = true
        } else {
            const [key, value] = line.split(': ')
            if (key && value) {
                headers[key.toLowerCase()] = value
            }
        }
    }

    return {
        method,
        endpoint,
        version,
        host: headers['host'] || '',
        userAgent: headers['user-agent'] || '',
        accept: headers['accept'] || '',
        body,
    }
}
// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('close', () => {
        socket.end()
    })

    socket.on('data', (data: Buffer) => {
        const request = parseHttpRequest(data.toString())
        const { endpoint } = request
        if (endpoint === '/') {
            socket.write(Buffer.from('HTTP/1.1 200 OK\r\n\r\n'))
        } else if (pathMatches(/\/echo\/[a-zA-Z0-9]*/, endpoint)) {
            const str = extractEndpoint(endpoint)
            socket.write(Buffer.from(build200Response(str, 'text/plain')))
        } else if (pathMatches(/\/user-agent/, endpoint)) {
            const { userAgent } = parseHttpRequest(data.toString())
            socket.write(Buffer.from(build200Response(userAgent, 'text/plain')))
        } else if (pathMatches(/\/files\/[a-zA-Z0-9]*/, endpoint)) {
            const filesEndpoint = endpoint as TempFilePath
            const [_, fileName] = filesEndpoint.split('/files/')
            const pathToTmpFile = `../tmp/data/codecrafters.io/http-server-tester/${fileName}`
            if (fs.existsSync(pathToTmpFile)) {
                fs.readFile(pathToTmpFile, (error, content) => {
                    if (error) {
                        socket.write(Buffer.from('HTTP/1.1 404 Not Found\r\n\r\n'))
                    } else {
                        socket.write(Buffer.from(build200Response(content.toString(), 'application/octet-stream')))
                    }
                })
            } else {
                socket.write(Buffer.from('HTTP/1.1 404 Not Found\r\n\r\n'))
            }
        } else {
            socket.write(Buffer.from('HTTP/1.1 404 Not Found\r\n\r\n'))
        }
    })
})

server.listen(4221, 'localhost')
