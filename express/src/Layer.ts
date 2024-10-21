import { pathToRegexp, Key } from 'path-to-regexp';
import { parseUrl, SocketRequest } from './utils/httpParser';
import { Request } from '../../http/src/Request';
import { Response } from '../../http/src/Response';

type NextFunction = (err?: any) => void;
type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

interface Middleware {
  GET : MiddlewareFunction[],
  POST : MiddlewareFunction[],
  PUT : MiddlewareFunction[],
  DELETE : MiddlewareFunction[],
}

// Layer 클래스 정의
class Layer {
  private middleware: Middleware = { GET: [], POST: [], PUT: [], DELETE: [] };

  private path: string;

  private readonly regexp?: RegExp; // 경로를 정규식으로 변환한 값

  private params?: { [key: string]: string }; // URL에서 추출된 매개변수

  private readonly keys: Array<Key>;

  constructor(path: string) {
    this.path = path;
    const {
      regexp,
      keys,
    } = pathToRegexp(path, { end: false });
    // end: false 를 주면 해당 정규식으로 '끝나는' 것 아니다. (정규식 중에서 $ 가 뒤에 달리지 않는다.)
    this.regexp = regexp;
    this.keys = keys;
    this.params = undefined;
  }

  use(middleware: MiddlewareFunction) {
    this.get(middleware);
    this.post(middleware);
    this.put(middleware);
    this.delete(middleware);
  }

  get(middleware: MiddlewareFunction) {
    this.middleware.GET.push(middleware);
  }

  post(middleware: MiddlewareFunction) {
    this.middleware.POST.push(middleware);
  }

  put(middleware: MiddlewareFunction) {
    this.middleware.POST.push(middleware);
  }

  delete(middleware: MiddlewareFunction) {
    this.middleware.DELETE.push(middleware);
  }

  handle(req: Request, res: Response, next: NextFunction) {
    if(!req.method || !(req.method in this.middleware)) return;
    const method = req.method as keyof Middleware;
    this.middleware[method].forEach((middleware)=> middleware(req, res, next));
  }

  handleRequest(socketRequest: SocketRequest, res: Response, next: NextFunction): void | Promise<void>;
  handleRequest(socketRequest: SocketRequest, expressResponse: Response, next: NextFunction) {
    const match = this.regexp?.test(socketRequest.url);
    if (!match) {
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
