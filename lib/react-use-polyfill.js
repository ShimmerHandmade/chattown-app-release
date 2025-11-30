import React from "react";
const ReactModule = require('react');

const REACT_CONTEXT_TYPE = Symbol.for('react.context');
const REACT_CONSUMER_TYPE = Symbol.for('react.consumer');

if (typeof ReactModule !== 'undefined' && !ReactModule.use) {
  const ContextSymbol = REACT_CONTEXT_TYPE;
  const ConsumerSymbol = REACT_CONSUMER_TYPE;

  ReactModule.use = function use(usable) {
    if (usable !== null && typeof usable === 'object') {
      if (
        usable.$$typeof === ContextSymbol ||
        usable.$$typeof === ConsumerSymbol
      ) {
        const context = usable.$$typeof === ConsumerSymbol ? usable._context : usable;
        
        const contextValue = context._currentValue !== undefined 
          ? context._currentValue 
          : context._currentValue2;
        
        if (contextValue !== undefined) {
          return contextValue;
        }
      }

      if (typeof usable.then === 'function') {
        throw new Error(
          'React.use() with Promises is not supported in React 18'
        );
      }
    }

    throw new Error(
      'Unsupported type passed to use(): ' + String(usable)
    );
  };
  
  console.log('[Polyfill] React.use() polyfill installed for React ' + ReactModule.version);
}

module.exports = {};
