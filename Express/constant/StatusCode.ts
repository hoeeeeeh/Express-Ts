enum StatusCode {
  OK = 200,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

export { StatusCode };
