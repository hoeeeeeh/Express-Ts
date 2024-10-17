import net from 'net';
import fs from 'fs';
import path from 'path';
import { parseHttpRequest, SocketRequest } from './utils/httpParser';
import { Layer, NextFunction } from './Layer';
import { ExpressResponse } from './ExpressResponse';
import { ExpressRequest } from './ExpressRequest';

class Express {
  private readonly layerStack: Layer[] = [];

  use(path: string, method: string, middleware: (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => void) {
    let p = path;
    if (path === '/') p = '';

    this.layerStack.push(new Layer(p, method, middleware));
  }

  listen(port: number, callback: () => void) {
    const server = net.createServer((socket) => {
      socket.on('data', (data) => {
        const res = new ExpressResponse(socket);
        const socketRequest = parseHttpRequest(data.toString());
        this.handleRequest(socketRequest, res);
      });

      socket.on('end', () => socket.destroy());

      socket.on('error', (err) => {
        socket.destroy();
      });
    });

    server.listen(port, () => {
      callback();
    });
  }

  // app.use('/static', Express.static(__dirname + path);
  static static(filePath: string) {
    return (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
      if (req.path === '/') req.setUrl('/index.html');
      const staticPath = `${filePath}${req.path}`;
      fs.readFile(staticPath, (err, data) => {
        if (err) {
          next();
        } else {
          const ext = path.extname(staticPath);

          // TODO: 캐시는 몇 분 정도가 적당할까? 테스트 용이므로 일단은 0 으로
          res.set('Cache-Control', process.env.NODE_ENV === 'test' ? 'max-age=0' : 'max-age=3600');
          res.sendFile(ext, data);
        }
      });
    };
  }

  private handleNotFoundRequest(res: ExpressResponse) {
    if (!res.isAlreadySent) {
      res.status(404).send('Not found');
    }
  }

  private handleError(err: Error, res: ExpressResponse) {
    res.status(400).send(err.message);
  }

  private handleRequest(req: SocketRequest, res: ExpressResponse) {
    let index = -1; // 초기화, 첫 번째 미들웨어는 index 0부터 시작

    const next = (err?: Error) => {
      index += 1; // 다음 미들웨어로 이동
      const layer = this.layerStack[index]; // 현재 미들웨어 레이어 가져오기
      if (!layer) {
        return this.handleNotFoundRequest(res);
      } if (err) {
        return this.handleError(err, res);
      }
      try {
        // 미들웨어 실행. err를 넘기지 않으면 일반 미들웨어, 넘기면 에러 처리 미들웨어
        const ret = layer.handleRequest(req, res, next);

        // ret 은 void | Promise<void> 인데, if(ret) 을 통과하면 Promise 라는 의미이다.
        // 즉, 비동기로 처리되는 미들웨어라는 의미이므로 비동기 함수에 대한 에러 처리 (catch) 를 달아주었다.
        // 참고 : https://github.com/davidbanham/express-async-errors/blob/master/index.js
        if (ret) {
          ret.catch((err) => {
            next(err);
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          next(error); // 에러가 발생하면 다음 에러 처리 미들웨어로 넘김
        }
      }
    };
    next(); // 첫 번째 미들웨어 실행 시작
  }
}

export { Express };
