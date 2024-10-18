import { pathToRegexp, Key } from 'path-to-regexp';
import { parseUrl, SocketRequest } from './utils/httpParser';
import { Request } from '../../http/src/Request';
import { Response } from '../../http/src/Response';

type NextFunction = (err?: any) => void;
type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

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

  private readonly regexp?: RegExp; // 경로를 정규식으로 변환한 값

  private params?: { [key: string]: string }; // URL에서 추출된 매개변수

  private readonly keys: Array<Key>;

  constructor(
    path: string,
    method: string,
    handle: (req: Request, res: Response, next: NextFunction) => void,
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
    // (req: Request, res: Response, next: NextFunction) => {};
    //
    // this.middleware = {
    //   GET: defaultMiddleware,
    //   POST: defaultMiddleware,
    //   PUT: defaultMiddleware,
    //   DELETE: defaultMiddleware,
    // };
  }

  handleRequest(socketRequest: SocketRequest, res: Response, next: NextFunction): void | Promise<void>;




  handleRequest(socketRequest: SocketRequest, expressResponse: Response, next: NextFunction) {
    const match = this.regexp?.test(socketRequest.url);
    if (this.isInvalidMethod(socketRequest) || !match) {
      return next();
    }

    const expressRequest = new Request(socketRequest);

    if (this.regexp) {
      const { params, query, path } = parseUrl(socketRequest.url, this.regexp, this.keys);
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

  private handleError(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    try {
      this.handle(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

export { Layer, type NextFunction };
