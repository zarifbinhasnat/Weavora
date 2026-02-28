import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/main.tsx");import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react-swc can't detect preamble. Something is wrong."
    );
  }

  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}

import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=d9d32f9c"; const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];
import __vite__cjsImport3_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=2134bdf6"; const createRoot = __vite__cjsImport3_reactDom_client["createRoot"];
import "/src/index.css?t=1772295924944";
function DebugApp() {
    return /*#__PURE__*/ _jsxDEV("div", {
        style: {
            padding: 24,
            fontFamily: 'Inter, sans-serif'
        },
        children: [
            /*#__PURE__*/ _jsxDEV("h1", {
                style: {
                    margin: 0
                },
                children: "DEBUG: React Mounted"
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx",
                lineNumber: 7,
                columnNumber: 4
            }, this),
            /*#__PURE__*/ _jsxDEV("p", {
                style: {
                    marginTop: 8,
                    color: '#666'
                },
                children: "If you see this, React is rendering correctly."
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx",
                lineNumber: 8,
                columnNumber: 4
            }, this),
            /*#__PURE__*/ _jsxDEV("p", {
                id: "debug-timestamp",
                style: {
                    marginTop: 8,
                    fontSize: 12
                },
                children: new Date().toString()
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx",
                lineNumber: 9,
                columnNumber: 4
            }, this)
        ]
    }, void 0, true, {
        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx",
        lineNumber: 6,
        columnNumber: 3
    }, this);
}
_c = DebugApp;
createRoot(document.getElementById("root")).render(/*#__PURE__*/ _jsxDEV(DebugApp, {}, void 0, false, {
    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx",
    lineNumber: 16,
    columnNumber: 53
}, this));
var _c;
$RefreshReg$(_c, "DebugApp");


if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}


if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/MADINA Akbari/Weavora/Weavora_new/src/main.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVJvb3QgfSBmcm9tIFwicmVhY3QtZG9tL2NsaWVudFwiO1xyXG5pbXBvcnQgXCIuL2luZGV4LmNzc1wiO1xyXG5cclxuZnVuY3Rpb24gRGVidWdBcHAoKSB7XHJcblx0cmV0dXJuIChcclxuXHRcdDxkaXYgc3R5bGU9e3sgcGFkZGluZzogMjQsIGZvbnRGYW1pbHk6ICdJbnRlciwgc2Fucy1zZXJpZicgfX0+XHJcblx0XHRcdDxoMSBzdHlsZT17eyBtYXJnaW46IDAgfX0+REVCVUc6IFJlYWN0IE1vdW50ZWQ8L2gxPlxyXG5cdFx0XHQ8cCBzdHlsZT17eyBtYXJnaW5Ub3A6IDgsIGNvbG9yOiAnIzY2NicgfX0+SWYgeW91IHNlZSB0aGlzLCBSZWFjdCBpcyByZW5kZXJpbmcgY29ycmVjdGx5LjwvcD5cclxuXHRcdFx0PHAgaWQ9XCJkZWJ1Zy10aW1lc3RhbXBcIiBzdHlsZT17eyBtYXJnaW5Ub3A6IDgsIGZvbnRTaXplOiAxMiB9fT5cclxuXHRcdFx0XHR7bmV3IERhdGUoKS50b1N0cmluZygpfVxyXG5cdFx0XHQ8L3A+XHJcblx0XHQ8L2Rpdj5cclxuXHQpO1xyXG59XHJcblxyXG5jcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicm9vdFwiKSEpLnJlbmRlcig8RGVidWdBcHAgLz4pO1xyXG4iXSwibmFtZXMiOlsiY3JlYXRlUm9vdCIsIkRlYnVnQXBwIiwiZGl2Iiwic3R5bGUiLCJwYWRkaW5nIiwiZm9udEZhbWlseSIsImgxIiwibWFyZ2luIiwicCIsIm1hcmdpblRvcCIsImNvbG9yIiwiaWQiLCJmb250U2l6ZSIsIkRhdGUiLCJ0b1N0cmluZyIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJyZW5kZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsU0FBU0EsVUFBVSxRQUFRLG1CQUFtQjtBQUM5QyxPQUFPLGNBQWM7QUFFckIsU0FBU0M7SUFDUixxQkFDQyxRQUFDQztRQUFJQyxPQUFPO1lBQUVDLFNBQVM7WUFBSUMsWUFBWTtRQUFvQjs7MEJBQzFELFFBQUNDO2dCQUFHSCxPQUFPO29CQUFFSSxRQUFRO2dCQUFFOzBCQUFHOzs7Ozs7MEJBQzFCLFFBQUNDO2dCQUFFTCxPQUFPO29CQUFFTSxXQUFXO29CQUFHQyxPQUFPO2dCQUFPOzBCQUFHOzs7Ozs7MEJBQzNDLFFBQUNGO2dCQUFFRyxJQUFHO2dCQUFrQlIsT0FBTztvQkFBRU0sV0FBVztvQkFBR0csVUFBVTtnQkFBRzswQkFDMUQsSUFBSUMsT0FBT0MsUUFBUTs7Ozs7Ozs7Ozs7O0FBSXhCO0tBVlNiO0FBWVRELFdBQVdlLFNBQVNDLGNBQWMsQ0FBQyxTQUFVQyxNQUFNLGVBQUMsUUFBQ2hCIn0=
