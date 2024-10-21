import { URL } from 'url';
import { parse as parseQuery } from 'querystring';
import { Keys } from 'path-to-regexp';
import { getContentType } from './mimeType';

interface SocketRequest {
  headers: { [key: string]: string },
  body: string | object,
  method: string,
  url: string,
  protocol: string,
  version: string,
}

/**
 * method, url, protocol, version, headers, body
 * @param rawData
 */
function parseHttpRequest(rawData: string): SocketRequest {
  const [rawHeaders, parsedBody] = rawData.split('\r\n\r\n');
  const headerLines = rawHeaders.split('\r\n');
  const statusLine = headerLines.shift();
  const [method, url, protocolWithVersion] = statusLine?.split(' ') || [];
  const [protocol, version] = protocolWithVersion?.split('/') || [];
  const headers: { [key: string]: string } = {};
  headerLines.forEach((line) => {
    const [key, value] = line.split(': ');
    headers[key] = value;
  });

  const body = headers['Content-Type'] === getContentType('.json') ? JSON.parse(parsedBody) : parsedBody;
  return {
    headers, // 파싱된 헤더 객체
    body, // 바디 내용
    method, // HTTP 메서드 (예: GET, POST 등)
    url, // 요청 경로 (예: /signin.html)
    protocol, // 프로토콜 (예: HTTP)
    version, // 프로토콜 버전 (예: 1.1)
  };
}

// URL을 분석하는 함수
function parseUrl(url: string, regexp: RegExp, keys: Keys) {
  // 1. URL을 파싱
  const parsedUrl = new URL(url, 'http://localhost'); // 두 번째 인자로 baseURL이 필요

  // 2. 쿼리 스트링을 파싱
  const query = parseQuery(parsedUrl.searchParams.toString());

  // 3. 경로 파라미터 추출
  // routeTemplate 예: '/user/:id/hello/:passwd'
  const match = regexp.exec(parsedUrl.pathname || '');

  const params: { [key: string]: string } = {};
  if (match) {
    keys.forEach((key: { name: string | number; }, index: number) => {
      params[key.name] = match[index + 1];
    });
  }

  // 4. 경로 (쿼리 스트링 제외한 경로)
  const path = parsedUrl.pathname || '';

  return {
    params, // 경로 파라미터
    query, // 쿼리 스트링
    path, // 경로
  };
}

export { parseHttpRequest, parseUrl, SocketRequest };
