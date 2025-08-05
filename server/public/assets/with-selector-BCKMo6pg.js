import{r as w,ci as R,cj as p}from"./index-B8YngC3q.js";var j={exports:{}},V={};/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var s=w,y=R;function z(r,u){return r===u&&(r!==0||1/r===1/u)||r!==r&&u!==u}var D=typeof Object.is=="function"?Object.is:z,M=y.useSyncExternalStore,x=s.useRef,O=s.useEffect,h=s.useMemo,C=s.useDebugValue;V.useSyncExternalStoreWithSelector=function(r,u,v,n,f){var o=x(null);if(o.current===null){var t={hasValue:!1,value:null};o.current=t}else t=o.current;o=h(function(){function m(e){if(!d){if(d=!0,c=e,e=n(e),f!==void 0&&t.hasValue){var a=t.value;if(f(a,e))return l=a}return l=e}if(a=l,D(c,e))return a;var b=n(e);return f!==void 0&&f(a,b)?(c=e,a):(c=e,l=b)}var d=!1,c,l,E=v===void 0?null:v;return[function(){return m(u())},E===null?void 0:function(){return m(E())}]},[u,v,n,f]);var i=M(r,o[0],o[1]);return O(function(){t.hasValue=!0,t.value=i},[i]),C(i),i};j.exports=V;var F=j.exports;const I=p(F);export{I as u,F as w};
