import { Response } from '../http/src/Response';
import { SocketMock } from './mocks/Socket.mock';

describe('Response class', () => {
  let socketMock: SocketMock;
  let response: Response;

  beforeEach(() => {
    socketMock = new SocketMock();
    response = new Response(socketMock as any);
  });

  test('should set the status code and message correctly', () => {
    response.status(404);
    expect(response.statusCode).toBe(404);
    expect(response.statusMessage).toBe('NOT_FOUND');

    response.status(500);
    expect(response.statusCode).toBe(500);
    expect(response.statusMessage).toBe('SERVER_ERROR');
  });

  test('should send a text response with proper headers', () => {
    const body = 'Hello, World!';
    response.send(body);

    expect(socketMock.data).toContain('HTTP/1.1 200 OK');
    expect(socketMock.data).toContain('Content-Type: text/html');
    expect(socketMock.data).toContain(`Content-Length: ${Buffer.byteLength(body)}`);
    expect(socketMock.data).toContain(body);
  });

  test('should send a JSON response with proper headers', () => {
    const jsonResponse = { message: 'Success' };
    response.json(jsonResponse);

    expect(socketMock.data).toContain('HTTP/1.1 200 OK');
    expect(socketMock.data).toContain('Content-Type: application/json');
    expect(socketMock.data).toContain(`Content-Length: ${Buffer.byteLength(JSON.stringify(jsonResponse))}`);
    expect(socketMock.data).toContain(JSON.stringify(jsonResponse));
  });

  test('should set and retrieve cookies', () => {
    response.cookie('sessionId', 'abc123');
    expect(response.cookies.sessionId).toBe('abc123');

    response.cookie('userPreference', 'darkMode');
    response.send('Cookies test');

    expect(socketMock.data).toContain('Set-Cookie: sessionId=abc123; userPreference=darkMode');
  });

  test('should write headers only once', () => {
    response.send('First response');
    expect(response.isAlreadySent).toBe(true);

    expect(() => response.send('Second response')).toThrow('Headers have already been sent');
  });

  test('should set custom headers', () => {
    response.set('X-Custom-Header', 'CustomValue');
    response.send('Custom header test');

    expect(socketMock.data).toContain('X-Custom-Header: CustomValue');
  });

  test('should set multiple headers at once', () => {
    response.set({
      'X-Custom-Header1': 'Value1',
      'X-Custom-Header2': 'Value2'
    });
    response.send('Multiple headers test');

    expect(socketMock.data).toContain('X-Custom-Header1: Value1');
    expect(socketMock.data).toContain('X-Custom-Header2: Value2');
  });

  test('should handle errors when sending response', () => {
    socketMock.write = jest.fn(() => { throw new Error('Write error'); });

    expect(() => response.send('Error test')).toThrow('Write error');
    expect(response.isAlreadySent).toBe(false);
  });

  test('should respect the charset setting', () => {
    response.charset = 'utf-8' as any;
    response.send('Charset test');

    expect(socketMock.data).toContain('Content-Type: text/html; charset=utf-8');
  });
});
