import { EventEmitter } from 'events';

class SocketMock extends EventEmitter {
  writable = true;

  readable = true;

  destroyed = false;

  data = '';

  write(data: string) {
    if (!this.writable) {
      throw new Error('Socket is not writable');
    }
    this.data += data;
    return true;
  }

  end(data: string) {
    if (data) {
      this.write(data);
    }
    this.emit('end');
    this.writable = false;
    this.readable = false;
  }

  destroy() {
    this.destroyed = true;
    this.writable = false;
    this.readable = false;
    this.emit('close');
  }
}

export { SocketMock };
