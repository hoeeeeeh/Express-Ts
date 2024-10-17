import { Socket } from 'net';
import { logger } from '../Logger/logger';
import { StatusCode } from './constant/StatusCode';
import { getContentType } from './utils/mimeType';

type HeaderKeys =
  | 'Content-Type'
  | 'Content-Length'
  | 'Set-Cookie'
  | 'Location'
  | 'Expires'
  | 'Cache-Control'
  | 'Last-Modified'
  | 'Etag'
  | 'Transfer-Encoding'
  | 'X-Powered-By'
  | 'X-Content-Type-Options'
  | 'X-Frame-Options'
  | 'X-XSS-Protection'
  | 'X-Download-Options'
  | 'X-Permitted-Cross-Domain-Policies'
  | 'X-Custom-Header';

const fixedHeaderKeys = ['Content-Length', 'Set-Cookie', 'Location'];

type Headers = Partial<Record<HeaderKeys, string>>;

enum Charset {
  'utf-8',
  'utf-16be',
  'utf-16le',
  'iso-8859-1',
  'windows-1252',
  'ascii',
  'base64',
  'binary',
  'hex',
  'latin1',
}

interface Cookies {
  [key: string]: string;
}

class ExpressResponse {
  private socket: Socket;

  statusCode: StatusCode = StatusCode.OK;

  statusMessage?: string = StatusCode[200];

  locals: object = {};

  isAlreadySent?: boolean = false;

  charset?: Charset;

  cookies: Cookies = {};

  headers: Headers = {};

  constructor(socket: Socket) {
    this.socket = socket;
  }

  set(
    headerKey: object | HeaderKeys,
    headerValue: string | undefined = undefined
  ) {
    if (typeof headerKey === 'string') {
      this.headers[headerKey] = headerValue;
      return true;
    }
    if (typeof headerKey === 'object') {
      this.headers = { ...this.headers, ...headerKey };
      return true;
    }
    return false;
  }

  status(code: number): this {
    this.statusCode = code;
    this.statusMessage = StatusCode[code] ? StatusCode[code] : undefined;
    return this;
  }

  close() {
    this.socket.end();
  }

  write(header: string, body?: string | Buffer) {
    if (this.isAlreadySent) {
      throw new Error('Response already been sent');
    }
    this.isAlreadySent = true;
    try {
      this.socket.write(header);
      if (body) this.socket.write(body);
      this.socket.end();
    } catch (error: any) {
      this.isAlreadySent = false;
      logger.error(`Failed to send response: ${error.message}`);
      throw error;
    }
  }

  redirect(body: string | object) {
    if (typeof body === 'string') this.status(StatusCode.FOUND).send(body);
    else if (typeof body === 'object') this.status(StatusCode.FOUND).json(body);
  }

  sendFile(ext: string, body: Buffer) {
    this.write(this.getHTTPheader(getContentType(ext), body), body);
  }

  send(body?: string) {
    this.write(this.getHTTPheader('text/plain', body), body);
  }

  json(body: object) {
    this.write(this.getHTTPheader('application/json', body), JSON.stringify(body));
  }

  end() {
    this.socket.end();
  }

  getContentLength(body?: string | object | Buffer) {
    let content: string | Buffer;
    if (!body) return 0;

    if (Buffer.isBuffer(body)) {
      content = body; // Buffer일 경우 그대로 사용
    } else if (typeof body === 'object') {
      content = JSON.stringify(body); // 객체일 경우 JSON 문자열로 변환
    } else {
      content = body as string; // 문자열일 경우 그대로 사용
    }

    return Buffer.byteLength(content);
  }

  getHTTPheader(contentType: string, body?: object | string | Buffer) {
    const statusLine = `${process.env.HTTP_VERSION || 'HTTP/1.1'} ${
      this.statusCode
    } ${this.statusMessage || ''}\r\n`;

    // 기본 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': `${contentType}${
        this.charset ? `; charset=${this.charset}` : ''
      }`,
      'Content-Length': `${this.getContentLength(body)}`, // 임시값, 나중에 업데이트됨
    };

    // this.headers의 값들을 headers 객체에 추가
    Object.entries(this.headers).forEach(([key, value]) => {
      if (value !== undefined && !fixedHeaderKeys.includes(key as HeaderKeys)) {
        headers[key] = value;
      }
    });

    // Set-Cookie 헤더 처리
    if (Object.keys(this.cookies).length > 0) {
      headers['Set-Cookie'] = Object.entries(this.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    // 헤더 문자열 생성
    let headerString = statusLine;
    Object.entries(headers).forEach(([key, value]) => {
      headerString += `${key}: ${value}\r\n`;
    });

    // 빈 줄 추가로 헤더의 끝 표시
    headerString += '\r\n';

    return headerString;
  }

  /**
   * 추후에 session ID 같은 것을 구현하기 위해서 정의해두었습니다.
   * 아직까지는 전부 다 구현하지 못했습니다.
   * @returns ExpressResponse
   * @param name
   * @param value
   */
  cookie(name: string, value: string) {
    this.cookies[name] = value;
    return this;
  }

  clearCookie(name: string) {
    console.log(name);
  }
}

export { ExpressResponse };
