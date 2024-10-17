import { SocketRequest } from './utils/httpParser';

const Method = ['GET', 'POST', 'PUT', 'DELETE'];

const Protocol = ['HTTP', 'HTTPS'];

interface Header {
  [key: string]: string;
}

/**
 * https://localhost:8080/cardId/1?name=hello&password=1234
 * params : /cardId/1
 * query : ? 이후
 */

class ExpressRequest {
  headers?: Header;

  body: string | object = '';

  method?: string;

  // 전체 url
  url?: string;

  protocol?: string;

  version?: string;

  // 여기까지가 SocketRequest

  // /user/:id 에서 id
  params: object = {};

  // /search?keyword=naver { keyword : naver }
  query: object = {};

  // /user?id=123 에서 /user
  path?: string;

  constructor(socketRequest? : SocketRequest) {
    if (socketRequest) {
      const { headers, body, method, url, protocol, version } = socketRequest;
      this.setHeader(headers);
      this.setBody(body);
      this.setMethod(method);
      this.setUrl(url);
      this.setProtocol(protocol);
      this.setProtocolVersion(version);
    }
  }

  get(field: string) {
    return this.headers?.[field];
  }

  setHeader(header: object) {
    this.headers = { ...this.headers, ...header };
    return this;
  }

  setBody(body: string | object) {
    this.body = body;
    return this;
  }

  setParams(params: object) {
    this.params = { ...this.params, ...params };
    return this;
  }

  setQuery(query: object) {
    this.query = { ...this.query, ...query };
    return this;
  }

  setPath(path: string) {
    this.path = path;
    return this;
  }

  setMethod(method: string) {
    if (method in Method) this.method = method;
    return this;
  }

  setUrl(url: string) {
    this.url = url;
    return this;
  }

  setProtocol(protocol: string) {
    if (protocol in Protocol) this.protocol = protocol;
    return this;
  }

  setProtocolVersion(version: string) {
    this.version = version;
    return this;
  }

  get cookies() {
    return this.headers?.Cookie;
  }
}

export { ExpressRequest, Method, Protocol };
