export type TempFilePath = `/files/${string}`;

export interface HttpRequestData {
    method: string;
    endpoint: string;
    version: string;
    host: string;
    userAgent: string;
    accept: string;
    acceptEncoding: string[];
    body: string;
}
export const PATH_REGEX = /\/echo\/[a-zA-Z0-9]*/;

export function pathMatches(regex: RegExp, path: string) {
    return regex.test(path);
}

type Body = { _type: 'encrypted'; content: Buffer } | { _type: 'unencrypted'; content: string };
export function buildHttpResponse(statusCode: number, body: Body, headers: { [key: string]: string }): string {
    let bodyString: string;
    let contentLength: string;
    switch (body._type) {
        case 'unencrypted':
            contentLength = body.content.length.toString();
            bodyString = body.content;
            break;
        case 'encrypted':
            contentLength = body.content.length.toString();
            bodyString = '';
            break;
    }

    console.log('bodyString: ', bodyString);
    console.log(contentLength);
    // Default headers (can be overridden by user-specified headers)
    const defaultHeaders: { [key: string]: string } = {
        'Content-Type': 'text/plain',
        'Content-Length': contentLength,
    };

    // Combine default headers with user-specified headers
    const combinedHeaders = { ...defaultHeaders, ...headers };

    // Build the response status line
    const statusMessage = getStatusMessage(statusCode);
    const responseLine = `HTTP/1.1 ${statusCode} ${statusMessage}`;

    // Build the header lines
    const headerLines = Object.entries(combinedHeaders)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\r\n');

    // Combine the response line, headers, and body into the final response
    const response = `${responseLine}\r\n${headerLines}\r\n\r\n${bodyString}`;

    return response;
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
    const acceptEncoding = headers['accept-encoding']
        ? headers['accept-encoding'].split(',').map((enc) => enc.trim())
        : [];

    return {
        method,
        endpoint,
        version,
        host: headers['host'] || '',
        userAgent: headers['user-agent'] || '',
        accept: headers['accept'] || '',
        acceptEncoding,
        body,
    };
}
