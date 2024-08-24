export type TempFilePath = `/files/${string}`;

export interface HttpRequestData {
    method: string;
    endpoint: string;
    version: string;
    host: string;
    userAgent: string;
    accept: string;
    body: string;
}

export const PATH_REGEX = /\/echo\/[a-zA-Z0-9]*/;

export function pathMatches(regex: RegExp, path: string) {
    return regex.test(path);
}

export function buildHttpResponse(statusCode: number, contentType: string, body: string): string {
    // HTTP status message based on status code
    const statusMessage = getStatusMessage(statusCode);

    // Building the response header
    const responseHeader = `HTTP/1.1 ${statusCode} ${statusMessage}\r\nContent-Type: ${contentType}\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n`;

    // Concatenating header and body to form the full response
    const responseMessage = responseHeader + body;

    return responseMessage;
}

// Helper function to get status message based on code
function getStatusMessage(statusCode: number): string {
    const statusMessages: { [key: number]: string } = {
        200: 'OK',
        201: 'Created',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        // Add more status codes and messages as needed
    };

    return statusMessages[statusCode] || 'Unknown Status';
}

export function extractEndpoint(path: string): string {
    const [_emptyStr, _echo, str] = path.split('/');
    return str;
}

export function build200Response(body: string, contentType: 'text/plain' | 'application/octet-stream') {
    return `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${body.length}\r\n\r\n${body}`;
}

export function parseHttpRequest(request: string): HttpRequestData {
    const lines = request.split('\r\n');
    const [method, endpoint, version] = lines[0].split(' ');

    const headers: { [key: string]: string } = {};
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
            if (key && value) {
                headers[key.toLowerCase()] = value;
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
    };
}
