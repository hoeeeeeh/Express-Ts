import { ExpressRequest } from '../ExpressRequest';
import { ExpressResponse } from '../ExpressResponse';
import { Layer } from '../Layer'; // Layer 클래스를 불러옵니다.

type NextFunction = (err?: any) => void;

describe('Layer class', () => {
  let mockRequest: Partial<ExpressRequest>;
  let mockResponse: Partial<ExpressResponse>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/users/123',
    };

    mockResponse = {
      send: jest.fn(), // 응답을 모의합니다.
      status: jest.fn().mockReturnThis(), // 상태 코드 설정 모의
    };

    nextFunction = jest.fn(); // next 함수는 jest의 mock 함수로 처리
  });

  it('should match the route and call the handle function', () => {
    const mockHandle = jest.fn(); // 핸들러를 모의
    const layer = new Layer('/users/:id', 'GET', mockHandle);

    layer.handleRequest(mockRequest as any, mockResponse as any, nextFunction);

    expect(mockHandle).toHaveBeenCalled(); // 핸들러 호출 확인
    expect(mockHandle).toHaveBeenCalledWith(
      mockRequest,
      mockResponse,
      nextFunction
    );
  });

  it('should not call the handle function if the method does not match', () => {
    const mockHandle = jest.fn();
    const layer = new Layer('/users/:id', 'POST', mockHandle); // POST를 기대하는 경우

    layer.handleRequest(mockRequest as any, mockResponse as any, nextFunction);

    expect(mockHandle).not.toHaveBeenCalled(); // 핸들러가 호출되지 않아야 함
    expect(nextFunction).toHaveBeenCalled(); // 대신 next()가 호출되었는지 확인
  });

  it('should not call the handle function if the path does not match', () => {
    const mockHandle = jest.fn();
    const layer = new Layer('/products/:id', 'GET', mockHandle); // 다른 경로

    layer.handleRequest(mockRequest as any, mockResponse as any, nextFunction);

    expect(mockHandle).not.toHaveBeenCalled(); // 핸들러가 호출되지 않아야 함
    expect(nextFunction).toHaveBeenCalled(); // next() 호출 확인
  });

  it('should call next with error when handle throws an error', () => {
    const mockHandle = jest.fn(() => {
      throw new Error('Test error');
    });
    const layer = new Layer('/users/:id', 'GET', mockHandle);

    layer.handleRequest(mockRequest as any, mockResponse as any, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(new Error('Test error')); // next가 에러와 함께 호출되었는지 확인
  });

  it('should extract parameters from the path', () => {
    const mockHandle = jest.fn();

    // layer.params 가 private 속성이므로 이를 우회하기위해 any 로 타입 단언
    // 실제로 런타임에서는 private 가 작동하지 않으므로 typescript 만 any 로 우회하면 된다.
    const layer = new Layer('/users/:id', 'GET', mockHandle) as any;

    layer.handleRequest(mockRequest as any, mockResponse as any, nextFunction);

    expect(layer.params).toEqual({ id: '123' }); // 경로에서 추출된 id 확인
  });
});
