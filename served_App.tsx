import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.tsx");import * as RefreshRuntime from "/@react-refresh";
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
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}

import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=d9d32f9c"; const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport2_react_jsxDevRuntime["Fragment"];
var _s = $RefreshSig$(), _s1 = $RefreshSig$();
import { Toaster } from "/src/components/ui/toaster.tsx";
import { Toaster as Sonner } from "/src/components/ui/sonner.tsx";
import { TooltipProvider } from "/src/components/ui/tooltip.tsx";
import { QueryClient, QueryClientProvider } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=9617a9de";
import { BrowserRouter, Routes, Route, Navigate } from "/node_modules/.vite/deps/react-router-dom.js?v=15adee6a";
import { AuthProvider, useAuth } from "/src/contexts/AuthContext.tsx";
import Index from "/src/pages/Index.tsx";
import Auth from "/src/pages/Auth.tsx";
import TeacherDashboard from "/src/pages/TeacherDashboard.tsx";
import CoursePage from "/src/pages/CoursePage.tsx";
import MaterialsPage from "/src/pages/MaterialsPage.tsx";
import AnnouncementsPage from "/src/pages/AnnouncementsPage.tsx";
import TeacherCoursePage from "/src/pages/TeacherCoursePage.tsx"; // New import
import NotFound from "/src/pages/NotFound.tsx";
import ClassroomPosts from "/src/components/teacher/ClassroomPosts.tsx";
import ChatDiscussion from "/src/components/teacher/ChatDiscussion.tsx";
const queryClient = new QueryClient();
// Protected Route Component
function ProtectedRoute({ children }) {
    _s();
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return /*#__PURE__*/ _jsxDEV("div", {
            className: "flex items-center justify-center min-h-screen",
            children: /*#__PURE__*/ _jsxDEV("div", {
                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 29,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this);
    }
    return isAuthenticated ? /*#__PURE__*/ _jsxDEV(_Fragment, {
        children: children
    }, void 0, false) : /*#__PURE__*/ _jsxDEV(Navigate, {
        to: "/auth",
        replace: true
    }, void 0, false, {
        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
        lineNumber: 34,
        columnNumber: 46
    }, this);
}
_s(ProtectedRoute, "F3aPsg481KjBH7Z7iYl6LJifZz0=", false, function() {
    return [
        useAuth
    ];
});
_c = ProtectedRoute;
function AppRoutes() {
    _s1();
    const { isAuthenticated } = useAuth();
    return /*#__PURE__*/ _jsxDEV(Routes, {
        children: [
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/auth",
                element: isAuthenticated ? /*#__PURE__*/ _jsxDEV(Navigate, {
                    to: "/",
                    replace: true
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 44,
                    columnNumber: 36
                }, void 0) : /*#__PURE__*/ _jsxDEV(Auth, {}, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 44,
                    columnNumber: 66
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(Index, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 51,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 50,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/course/:courseCode",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(CoursePage, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 60,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 59,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/course/:courseCode/materials",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(MaterialsPage, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 69,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 68,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/course/:courseCode/announcements",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(AnnouncementsPage, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 78,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 77,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/course/:courseCode/chat",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(ChatDiscussion, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 87,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 86,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/course/:courseCode/posts",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(ClassroomPosts, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 96,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 95,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/teacher-dashboard",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(TeacherDashboard, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 105,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 104,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "/teacher/course/:courseCode",
                element: /*#__PURE__*/ _jsxDEV(ProtectedRoute, {
                    children: /*#__PURE__*/ _jsxDEV(TeacherCoursePage, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 115,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 114,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV(Route, {
                path: "*",
                element: /*#__PURE__*/ _jsxDEV(NotFound, {}, void 0, false, {
                    fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                    lineNumber: 120,
                    columnNumber: 32
                }, void 0)
            }, void 0, false, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
_s1(AppRoutes, "1LGxUrjNz4q7iKM/2JDC9lJQ3xY=", false, function() {
    return [
        useAuth
    ];
});
_c1 = AppRoutes;
function App() {
    return /*#__PURE__*/ _jsxDEV(QueryClientProvider, {
        client: queryClient,
        children: /*#__PURE__*/ _jsxDEV(AuthProvider, {
            children: /*#__PURE__*/ _jsxDEV(TooltipProvider, {
                children: [
                    /*#__PURE__*/ _jsxDEV(Sonner, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 130,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ _jsxDEV(Toaster, {}, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 131,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ _jsxDEV(BrowserRouter, {
                        future: {
                            v7_startTransition: true,
                            v7_relativeSplatPath: true
                        },
                        children: /*#__PURE__*/ _jsxDEV(AppRoutes, {}, void 0, false, {
                            fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                            lineNumber: 138,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
                lineNumber: 129,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
            lineNumber: 128,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx",
        lineNumber: 127,
        columnNumber: 5
    }, this);
}
_c2 = App;
export default App;
var _c, _c1, _c2;
$RefreshReg$(_c, "ProtectedRoute");
$RefreshReg$(_c1, "AppRoutes");
$RefreshReg$(_c2, "App");


if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}


if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/MADINA Akbari/Weavora/Weavora_new/src/App.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkFwcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9hc3RlciB9IGZyb20gXCJAL2NvbXBvbmVudHMvdWkvdG9hc3RlclwiO1xyXG5pbXBvcnQgeyBUb2FzdGVyIGFzIFNvbm5lciB9IGZyb20gXCJAL2NvbXBvbmVudHMvdWkvc29ubmVyXCI7XHJcbmltcG9ydCB7IFRvb2x0aXBQcm92aWRlciB9IGZyb20gXCJAL2NvbXBvbmVudHMvdWkvdG9vbHRpcFwiO1xyXG5pbXBvcnQgeyBRdWVyeUNsaWVudCwgUXVlcnlDbGllbnRQcm92aWRlciB9IGZyb20gXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIjtcclxuaW1wb3J0IHsgQnJvd3NlclJvdXRlciwgUm91dGVzLCBSb3V0ZSwgTmF2aWdhdGUgfSBmcm9tIFwicmVhY3Qtcm91dGVyLWRvbVwiO1xyXG5pbXBvcnQgeyBBdXRoUHJvdmlkZXIsIHVzZUF1dGggfSBmcm9tIFwiQC9jb250ZXh0cy9BdXRoQ29udGV4dFwiO1xyXG5cclxuaW1wb3J0IEluZGV4IGZyb20gXCIuL3BhZ2VzL0luZGV4XCI7XHJcbmltcG9ydCBBdXRoIGZyb20gXCIuL3BhZ2VzL0F1dGhcIjtcclxuaW1wb3J0IFRlYWNoZXJEYXNoYm9hcmQgZnJvbSBcIi4vcGFnZXMvVGVhY2hlckRhc2hib2FyZFwiO1xyXG5pbXBvcnQgQ291cnNlUGFnZSBmcm9tIFwiLi9wYWdlcy9Db3Vyc2VQYWdlXCI7XHJcbmltcG9ydCBNYXRlcmlhbHNQYWdlIGZyb20gXCIuL3BhZ2VzL01hdGVyaWFsc1BhZ2VcIjtcclxuaW1wb3J0IEFubm91bmNlbWVudHNQYWdlIGZyb20gXCIuL3BhZ2VzL0Fubm91bmNlbWVudHNQYWdlXCI7XHJcbmltcG9ydCBUZWFjaGVyQ291cnNlUGFnZSBmcm9tIFwiLi9wYWdlcy9UZWFjaGVyQ291cnNlUGFnZVwiOyAvLyBOZXcgaW1wb3J0XHJcbmltcG9ydCBOb3RGb3VuZCBmcm9tIFwiLi9wYWdlcy9Ob3RGb3VuZFwiO1xyXG5pbXBvcnQgQ2xhc3Nyb29tUG9zdHMgZnJvbSBcIi4vY29tcG9uZW50cy90ZWFjaGVyL0NsYXNzcm9vbVBvc3RzXCI7XHJcbmltcG9ydCBDaGF0UGFnZSBmcm9tIFwiLi9jb21wb25lbnRzL3RlYWNoZXIvQ2hhdFBhZ2VcIjtcclxuaW1wb3J0IENoYXREaXNjdXNzaW9uIGZyb20gXCIuL2NvbXBvbmVudHMvdGVhY2hlci9DaGF0RGlzY3Vzc2lvblwiO1xyXG5cclxuY29uc3QgcXVlcnlDbGllbnQgPSBuZXcgUXVlcnlDbGllbnQoKTtcclxuXHJcbi8vIFByb3RlY3RlZCBSb3V0ZSBDb21wb25lbnRcclxuZnVuY3Rpb24gUHJvdGVjdGVkUm91dGUoeyBjaGlsZHJlbiB9OiB7IGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGUgfSkge1xyXG4gIGNvbnN0IHsgaXNBdXRoZW50aWNhdGVkLCBsb2FkaW5nIH0gPSB1c2VBdXRoKCk7XHJcblxyXG4gIGlmIChsb2FkaW5nKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG1pbi1oLXNjcmVlblwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYW5pbWF0ZS1zcGluIHJvdW5kZWQtZnVsbCBoLTEyIHctMTIgYm9yZGVyLWItMiBib3JkZXItZ3JheS05MDBcIj48L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGlzQXV0aGVudGljYXRlZCA/IDw+e2NoaWxkcmVufTwvPiA6IDxOYXZpZ2F0ZSB0bz1cIi9hdXRoXCIgcmVwbGFjZSAvPjtcclxufVxyXG5cclxuZnVuY3Rpb24gQXBwUm91dGVzKCkge1xyXG4gIGNvbnN0IHsgaXNBdXRoZW50aWNhdGVkIH0gPSB1c2VBdXRoKCk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8Um91dGVzPlxyXG4gICAgICA8Um91dGVcclxuICAgICAgICBwYXRoPVwiL2F1dGhcIlxyXG4gICAgICAgIGVsZW1lbnQ9e2lzQXV0aGVudGljYXRlZCA/IDxOYXZpZ2F0ZSB0bz1cIi9cIiByZXBsYWNlIC8+IDogPEF1dGggLz59XHJcbiAgICAgIC8+XHJcblxyXG4gICAgICA8Um91dGVcclxuICAgICAgICBwYXRoPVwiL1wiXHJcbiAgICAgICAgZWxlbWVudD17XHJcbiAgICAgICAgICA8UHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgICAgIDxJbmRleCAvPlxyXG4gICAgICAgICAgPC9Qcm90ZWN0ZWRSb3V0ZT5cclxuICAgICAgICB9XHJcbiAgICAgIC8+XHJcblxyXG4gICAgICA8Um91dGVcclxuICAgICAgICBwYXRoPVwiL2NvdXJzZS86Y291cnNlQ29kZVwiXHJcbiAgICAgICAgZWxlbWVudD17XHJcbiAgICAgICAgICA8UHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgICAgIDxDb3Vyc2VQYWdlIC8+XHJcbiAgICAgICAgICA8L1Byb3RlY3RlZFJvdXRlPlxyXG4gICAgICAgIH1cclxuICAgICAgLz5cclxuXHJcbiAgICAgIDxSb3V0ZVxyXG4gICAgICAgIHBhdGg9XCIvY291cnNlLzpjb3Vyc2VDb2RlL21hdGVyaWFsc1wiXHJcbiAgICAgICAgZWxlbWVudD17XHJcbiAgICAgICAgICA8UHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgICAgIDxNYXRlcmlhbHNQYWdlIC8+XHJcbiAgICAgICAgICA8L1Byb3RlY3RlZFJvdXRlPlxyXG4gICAgICAgIH1cclxuICAgICAgLz5cclxuXHJcbiAgICAgIDxSb3V0ZVxyXG4gICAgICAgIHBhdGg9XCIvY291cnNlLzpjb3Vyc2VDb2RlL2Fubm91bmNlbWVudHNcIlxyXG4gICAgICAgIGVsZW1lbnQ9e1xyXG4gICAgICAgICAgPFByb3RlY3RlZFJvdXRlPlxyXG4gICAgICAgICAgICA8QW5ub3VuY2VtZW50c1BhZ2UgLz5cclxuICAgICAgICAgIDwvUHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgfVxyXG4gICAgICAvPlxyXG5cclxuICAgICAgPFJvdXRlXHJcbiAgICAgICAgcGF0aD1cIi9jb3Vyc2UvOmNvdXJzZUNvZGUvY2hhdFwiXHJcbiAgICAgICAgZWxlbWVudD17XHJcbiAgICAgICAgICA8UHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgICAgIDxDaGF0RGlzY3Vzc2lvbiAvPlxyXG4gICAgICAgICAgPC9Qcm90ZWN0ZWRSb3V0ZT5cclxuICAgICAgICB9XHJcbiAgICAgIC8+XHJcblxyXG4gICAgICA8Um91dGVcclxuICAgICAgICBwYXRoPVwiL2NvdXJzZS86Y291cnNlQ29kZS9wb3N0c1wiXHJcbiAgICAgICAgZWxlbWVudD17XHJcbiAgICAgICAgICA8UHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgICAgIDxDbGFzc3Jvb21Qb3N0cyAvPlxyXG4gICAgICAgICAgPC9Qcm90ZWN0ZWRSb3V0ZT5cclxuICAgICAgICB9XHJcbiAgICAgIC8+XHJcblxyXG4gICAgICA8Um91dGVcclxuICAgICAgICBwYXRoPVwiL3RlYWNoZXItZGFzaGJvYXJkXCJcclxuICAgICAgICBlbGVtZW50PXtcclxuICAgICAgICAgIDxQcm90ZWN0ZWRSb3V0ZT5cclxuICAgICAgICAgICAgPFRlYWNoZXJEYXNoYm9hcmQgLz5cclxuICAgICAgICAgIDwvUHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgfVxyXG4gICAgICAvPlxyXG5cclxuICAgICAgey8qIFRlYWNoZXIgQ291cnNlIE1hbmFnZW1lbnQgUm91dGUgKi99XHJcbiAgICAgIDxSb3V0ZVxyXG4gICAgICAgIHBhdGg9XCIvdGVhY2hlci9jb3Vyc2UvOmNvdXJzZUNvZGVcIlxyXG4gICAgICAgIGVsZW1lbnQ9e1xyXG4gICAgICAgICAgPFByb3RlY3RlZFJvdXRlPlxyXG4gICAgICAgICAgICA8VGVhY2hlckNvdXJzZVBhZ2UgLz5cclxuICAgICAgICAgIDwvUHJvdGVjdGVkUm91dGU+XHJcbiAgICAgICAgfVxyXG4gICAgICAvPlxyXG5cclxuICAgICAgPFJvdXRlIHBhdGg9XCIqXCIgZWxlbWVudD17PE5vdEZvdW5kIC8+fSAvPlxyXG4gICAgPC9Sb3V0ZXM+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gQXBwKCkge1xyXG4gIHJldHVybiAoXHJcbiAgICA8UXVlcnlDbGllbnRQcm92aWRlciBjbGllbnQ9e3F1ZXJ5Q2xpZW50fT5cclxuICAgICAgPEF1dGhQcm92aWRlcj5cclxuICAgICAgICA8VG9vbHRpcFByb3ZpZGVyPlxyXG4gICAgICAgICAgPFNvbm5lciAvPlxyXG4gICAgICAgICAgPFRvYXN0ZXIgLz5cclxuICAgICAgICAgIDxCcm93c2VyUm91dGVyXHJcbiAgICAgICAgICAgIGZ1dHVyZT17e1xyXG4gICAgICAgICAgICAgIHY3X3N0YXJ0VHJhbnNpdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgICB2N19yZWxhdGl2ZVNwbGF0UGF0aDogdHJ1ZSxcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgPEFwcFJvdXRlcyAvPlxyXG4gICAgICAgICAgPC9Ccm93c2VyUm91dGVyPlxyXG4gICAgICAgIDwvVG9vbHRpcFByb3ZpZGVyPlxyXG4gICAgICA8L0F1dGhQcm92aWRlcj5cclxuICAgIDwvUXVlcnlDbGllbnRQcm92aWRlcj5cclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBcHA7XHJcbiJdLCJuYW1lcyI6WyJUb2FzdGVyIiwiU29ubmVyIiwiVG9vbHRpcFByb3ZpZGVyIiwiUXVlcnlDbGllbnQiLCJRdWVyeUNsaWVudFByb3ZpZGVyIiwiQnJvd3NlclJvdXRlciIsIlJvdXRlcyIsIlJvdXRlIiwiTmF2aWdhdGUiLCJBdXRoUHJvdmlkZXIiLCJ1c2VBdXRoIiwiSW5kZXgiLCJBdXRoIiwiVGVhY2hlckRhc2hib2FyZCIsIkNvdXJzZVBhZ2UiLCJNYXRlcmlhbHNQYWdlIiwiQW5ub3VuY2VtZW50c1BhZ2UiLCJUZWFjaGVyQ291cnNlUGFnZSIsIk5vdEZvdW5kIiwiQ2xhc3Nyb29tUG9zdHMiLCJDaGF0RGlzY3Vzc2lvbiIsInF1ZXJ5Q2xpZW50IiwiUHJvdGVjdGVkUm91dGUiLCJjaGlsZHJlbiIsImlzQXV0aGVudGljYXRlZCIsImxvYWRpbmciLCJkaXYiLCJjbGFzc05hbWUiLCJ0byIsInJlcGxhY2UiLCJBcHBSb3V0ZXMiLCJwYXRoIiwiZWxlbWVudCIsIkFwcCIsImNsaWVudCIsImZ1dHVyZSIsInY3X3N0YXJ0VHJhbnNpdGlvbiIsInY3X3JlbGF0aXZlU3BsYXRQYXRoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxTQUFTQSxPQUFPLFFBQVEsMEJBQTBCO0FBQ2xELFNBQVNBLFdBQVdDLE1BQU0sUUFBUSx5QkFBeUI7QUFDM0QsU0FBU0MsZUFBZSxRQUFRLDBCQUEwQjtBQUMxRCxTQUFTQyxXQUFXLEVBQUVDLG1CQUFtQixRQUFRLHdCQUF3QjtBQUN6RSxTQUFTQyxhQUFhLEVBQUVDLE1BQU0sRUFBRUMsS0FBSyxFQUFFQyxRQUFRLFFBQVEsbUJBQW1CO0FBQzFFLFNBQVNDLFlBQVksRUFBRUMsT0FBTyxRQUFRLHlCQUF5QjtBQUUvRCxPQUFPQyxXQUFXLGdCQUFnQjtBQUNsQyxPQUFPQyxVQUFVLGVBQWU7QUFDaEMsT0FBT0Msc0JBQXNCLDJCQUEyQjtBQUN4RCxPQUFPQyxnQkFBZ0IscUJBQXFCO0FBQzVDLE9BQU9DLG1CQUFtQix3QkFBd0I7QUFDbEQsT0FBT0MsdUJBQXVCLDRCQUE0QjtBQUMxRCxPQUFPQyx1QkFBdUIsNEJBQTRCLENBQUMsYUFBYTtBQUN4RSxPQUFPQyxjQUFjLG1CQUFtQjtBQUN4QyxPQUFPQyxvQkFBb0Isc0NBQXNDO0FBRWpFLE9BQU9DLG9CQUFvQixzQ0FBc0M7QUFFakUsTUFBTUMsY0FBYyxJQUFJbEI7QUFFeEIsNEJBQTRCO0FBQzVCLFNBQVNtQixlQUFlLEVBQUVDLFFBQVEsRUFBaUM7O0lBQ2pFLE1BQU0sRUFBRUMsZUFBZSxFQUFFQyxPQUFPLEVBQUUsR0FBR2Y7SUFFckMsSUFBSWUsU0FBUztRQUNYLHFCQUNFLFFBQUNDO1lBQUlDLFdBQVU7c0JBQ2IsY0FBQSxRQUFDRDtnQkFBSUMsV0FBVTs7Ozs7Ozs7Ozs7SUFHckI7SUFFQSxPQUFPSCxnQ0FBa0I7a0JBQUdEO3NDQUFlLFFBQUNmO1FBQVNvQixJQUFHO1FBQVFDLE9BQU87Ozs7OztBQUN6RTtHQVpTUDs7UUFDOEJaOzs7S0FEOUJZO0FBY1QsU0FBU1E7O0lBQ1AsTUFBTSxFQUFFTixlQUFlLEVBQUUsR0FBR2Q7SUFFNUIscUJBQ0UsUUFBQ0o7OzBCQUNDLFFBQUNDO2dCQUNDd0IsTUFBSztnQkFDTEMsU0FBU1IsZ0NBQWtCLFFBQUNoQjtvQkFBU29CLElBQUc7b0JBQUlDLE9BQU87Ozs7OzJDQUFNLFFBQUNqQjs7Ozs7Ozs7OzswQkFHNUQsUUFBQ0w7Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNYOzs7Ozs7Ozs7Ozs7Ozs7MEJBS1AsUUFBQ0o7Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNSOzs7Ozs7Ozs7Ozs7Ozs7MEJBS1AsUUFBQ1A7Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNQOzs7Ozs7Ozs7Ozs7Ozs7MEJBS1AsUUFBQ1I7Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNOOzs7Ozs7Ozs7Ozs7Ozs7MEJBS1AsUUFBQ1Q7Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNGOzs7Ozs7Ozs7Ozs7Ozs7MEJBS1AsUUFBQ2I7Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNIOzs7Ozs7Ozs7Ozs7Ozs7MEJBS1AsUUFBQ1o7Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNUOzs7Ozs7Ozs7Ozs7Ozs7MEJBTVAsUUFBQ047Z0JBQ0N3QixNQUFLO2dCQUNMQyx1QkFDRSxRQUFDVjs4QkFDQyxjQUFBLFFBQUNMOzs7Ozs7Ozs7Ozs7Ozs7MEJBS1AsUUFBQ1Y7Z0JBQU13QixNQUFLO2dCQUFJQyx1QkFBUyxRQUFDZDs7Ozs7Ozs7Ozs7Ozs7OztBQUdoQztJQXRGU1k7O1FBQ3FCcEI7OztNQURyQm9CO0FBd0ZULFNBQVNHO0lBQ1AscUJBQ0UsUUFBQzdCO1FBQW9COEIsUUFBUWI7a0JBQzNCLGNBQUEsUUFBQ1o7c0JBQ0MsY0FBQSxRQUFDUDs7a0NBQ0MsUUFBQ0Q7Ozs7O2tDQUNELFFBQUNEOzs7OztrQ0FDRCxRQUFDSzt3QkFDQzhCLFFBQVE7NEJBQ05DLG9CQUFvQjs0QkFDcEJDLHNCQUFzQjt3QkFDeEI7a0NBRUEsY0FBQSxRQUFDUDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNYjtNQW5CU0c7QUFxQlQsZUFBZUEsSUFBSSJ9
