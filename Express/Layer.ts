import { pathToRegexp, Key } from 'path-to-regexp';
import { parseUrl, SocketRequest } from './utils/httpParser';
import { ExpressRequest } from './ExpressRequest';
import { ExpressResponse } from './ExpressResponse';

type NextFunction = (err?: any) => void;
type MiddlewareFunction = (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => void | Promise<void>;

interface Middleware {
  GET : MiddlewareFunction,
  POST : MiddlewareFunction,
  PUT : MiddlewareFunction,
  DELETE : MiddlewareFunction,
}

// Layer 클래스 정의
class Layer {
  // private middleware: Middleware;

  private path: string;

  private readonly method: string;

  private readonly handle: MiddlewareFunction;

  private readonly regexp: RegExp | null; // 경로를 정규식으로 변환한 값

  private params?: { [key: string]: any }; // URL에서 추출된 매개변수

  private readonly keys: Array<Key>;

  constructor(
    path: string,
    method: string,
    handle: (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => void,
  ) {
    this.path = path;
    this.method = method;
    this.handle = handle;
    const {
      regexp,
      keys,
    } = pathToRegexp(path, { end: false });
    // end: false 를 주면 해당 정규식으로 '끝나는' 것 아니다. (정규식 중에서 $ 가 뒤에 달리지 않는다.)
    this.regexp = regexp;
    this.keys = keys;
    this.params = undefined;

    // const defaultMiddleware: MiddlewareFunction =
    // (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {};
    //
    // this.middleware = {
    //   GET: defaultMiddleware,
    //   POST: defaultMiddleware,
    //   PUT: defaultMiddleware,
    //   DELETE: defaultMiddleware,
    // };
  }

  // eslint-disable-next-line consistent-return
  handleRequest(socketRequest: SocketRequest, expressResponse: ExpressResponse, next: NextFunction) {
    // socket 을 통해 넘어온 socketRequest 와 `method` / `url` 검사
    const match = this.regexp?.test(socketRequest.url);
    if (this.isInvalidMethod(socketRequest) || !match) {
      return next();
    }
    // socketRequest 를 이용한 기본 Request 생성
    const expressRequest = new ExpressRequest(socketRequest);

    if (this.regexp) {
      const { params, query, path } = parseUrl(socketRequest.url, this.regexp, this.keys);
      // params, path, query 추가
      expressRequest
        .setQuery(query)
        .setParams(params)
        .setPath(path);
    }

    return this.handle(expressRequest, expressResponse, next);
  }

  private isInvalidMethod(req: SocketRequest) {
    return req.method.toUpperCase() !== this.method.toUpperCase();
  }

  // 에러 처리 메서드 (에러 핸들링 미들웨어에 사용)
  private handleError(
    err: any,
    req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction,
  ): void {
    try {
      // 에러가 있는 경우, 에러 핸들러 실행
      this.handle(req, res, next);
    } catch (error) {
      next(error); // 에러 발생 시 다음 에러 핸들러로 넘김
    }
  }
}

export { Layer, type NextFunction };
