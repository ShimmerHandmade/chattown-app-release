import * as React from 'react';

if (!('use' in React)) {
  (React as any).use = function use<T>(promise: Promise<T> | T): T {
    if (promise instanceof Promise) {
      throw new Error(
        'React.use() with Promises is not supported in React 18. ' +
        'Please upgrade to React 19 or use suspense boundaries with async operations.'
      );
    }
    return promise;
  };
}

export {};
