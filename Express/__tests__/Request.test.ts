import { ExpressRequest, Method, Protocol } from '../ExpressRequest'; // 경로에 맞게 수정

describe('Request Class', () => {
  let req: ExpressRequest;

  // 매번 새로운 Request 객체를 생성하여 초기화
  beforeEach(() => {
    req = new ExpressRequest();
  });

  test('should set and get headers correctly', () => {
    req.setHeader({ 'Content-Type': 'application/json' });
    expect(req.get('Content-Type')).toBe('application/json');

    req.setHeader({ Authorization: 'Bearer token' });
    expect(req.get('Authorization')).toBe('Bearer token');
  });

  test('should set and get body correctly', () => {
    const bodyData = { key: 'value' };
    req.setBody(bodyData);
    expect(req.body).toEqual(bodyData);
  });

  test('should set and get params correctly', () => {
    const paramsData = { id: '123' };
    req.setParams(paramsData);
    expect(req.params).toEqual(paramsData);
  });

  test('should set and get query correctly', () => {
    const queryData = { name: 'test', password: '1234' };
    req.setQuery(queryData);
    expect(req.query).toEqual(queryData);
  });

  test('should set and get method correctly', () => {
    req.setMethod('POST');
    expect(req.method).toBe('POST');

    req.setMethod('GET');
    expect(req.method).toBe('GET');
  });

  test('should set and get URL correctly', () => {
    const url = 'https://localhost:8080/cardId/1';
    req.setUrl(url);
    expect(req.url).toBe(url);
  });

  // test('should set and get cookies correctly', () => {
  //   const cookies = { sessionId: 'abc123' };
  //   req.setCookies(cookies);
  //   expect(req.cookies).toEqual(cookies);
  //
  //   // Adding another cookie
  //   req.setCookies({ userId: 'user123' });
  //   expect(req.cookies).toEqual({ sessionId: 'abc123', userId: 'user123' });
  // });
  //
  // test('should set and get protocol correctly', () => {
  //   req.setProtocol(Protocol.HTTPS);
  //   expect(req.protocol).toBe(Protocol.HTTPS);
  //
  //   req.setProtocol(Protocol.HTTP);
  //   expect(req.protocol).toBe(Protocol.HTTP);
  // });

  test('should combine multiple headers correctly', () => {
    req.setHeader({ 'Content-Type': 'application/json' });
    req.setHeader({ Authorization: 'Bearer token' });

    expect(req.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    });
  });

  test('should combine multiple bodies correctly', () => {
    req.setBody({ key1: 'value1' });
    req.setBody({ key2: 'value2' });

    expect(req.body).toEqual({
      key1: 'value1',
      key2: 'value2',
    });
  });
});
