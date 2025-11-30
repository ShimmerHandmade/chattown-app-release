import * as React from 'react';

const REACT_CONTEXT_TYPE = Symbol.for('react.context');
const REACT_CONSUMER_TYPE = Symbol.for('react.consumer');

if (typeof React !== 'undefined' && !(React as any).use) {
  const ContextSymbol = REACT_CONTEXT_TYPE;
  const ConsumerSymbol = REACT_CONSUMER_TYPE;

  (React as any).use = function use<T>(usable: any): T {
    if (usable !== null && typeof usable === 'object') {
      if (
        usable.$$typeof === ContextSymbol ||
        usable.$$typeof === ConsumerSymbol
      ) {
        const context = usable.$$typeof === ConsumerSymbol ? usable._context : usable;
        
        try {
          const dispatcher = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current;
          if (dispatcher && dispatcher.readContext) {
            return dispatcher.readContext(context);
          }
        } catch {
          console.warn('Failed to read context via dispatcher, falling back to _currentValue');
        }
        
        if (context._currentValue !== undefined) {
          return context._currentValue;
        }
        if (context._currentValue2 !== undefined) {
          return context._currentValue2;
        }
      }

      if (typeof usable.then === 'function') {
        throw new Error(
          'React.use() with Promises is not natively supported in React 18.\n' +
          'This feature requires React 19 or later.\n' +
          'Current React version: ' + React.version
        );
      }
    }

    throw new Error(
      'An unsupported type was passed to use(): ' + String(usable) + '\n' +
      'Current React version: ' + React.version
    );
  };
}

export {};
