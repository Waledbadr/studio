module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/apps/accommodation/src/hooks/use-mobile.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useIsMobile",
    ()=>useIsMobile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
    const [isMobile, setIsMobile] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](undefined);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = ()=>{
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return ()=>mql.removeEventListener("change", onChange);
    }, []);
    return !!isMobile;
}
}),
"[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "includesNormalized",
    ()=>includesNormalized,
    "normalizeArabic",
    ()=>normalizeArabic,
    "normalizeText",
    ()=>normalizeText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function normalizeArabic(input) {
    if (!input) return '';
    let s = input.normalize('NFKC');
    // Remove diacritics (harakat)
    s = s.replace(/[\u064B-\u065F\u0670\u0674\u06D6-\u06ED]/g, '');
    // Remove tatweel/kashida
    s = s.replace(/[\u0640]/g, '');
    // Normalize alef forms to ا
    s = s.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');
    // Normalize ya/hamza seats
    s = s.replace(/[\u0649\u0626]/g, '\u064A');
    // Normalize taa marbuta to haa for loose matching (حنفية vs حنفيه)
    s = s.replace(/\u0629/g, '\u0647');
    // Normalize kaf/keheh
    s = s.replace(/[\u06A9]/g, '\u0643');
    // Remove non-letters/digits except spaces
    s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
    // Collapse spaces and lowercase
    s = s.replace(/\s+/g, ' ').trim().toLowerCase();
    return s;
}
function normalizeText(input) {
    if (!input) return '';
    // Try Arabic normalization first; fallback to lowercase for non-Arabic
    const ar = normalizeArabic(input);
    if (ar) return ar;
    return String(input).toLowerCase();
}
function includesNormalized(haystack, needle) {
    const h = normalizeText(haystack);
    const n = normalizeText(needle);
    return h.includes(n);
}
}),
"[project]/packages/ui/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sidebar",
    ()=>Sidebar,
    "SidebarContent",
    ()=>SidebarContent,
    "SidebarFooter",
    ()=>SidebarFooter,
    "SidebarGroup",
    ()=>SidebarGroup,
    "SidebarGroupAction",
    ()=>SidebarGroupAction,
    "SidebarGroupContent",
    ()=>SidebarGroupContent,
    "SidebarGroupLabel",
    ()=>SidebarGroupLabel,
    "SidebarHeader",
    ()=>SidebarHeader,
    "SidebarInput",
    ()=>SidebarInput,
    "SidebarInset",
    ()=>SidebarInset,
    "SidebarMenu",
    ()=>SidebarMenu,
    "SidebarMenuAction",
    ()=>SidebarMenuAction,
    "SidebarMenuBadge",
    ()=>SidebarMenuBadge,
    "SidebarMenuButton",
    ()=>SidebarMenuButton,
    "SidebarMenuItem",
    ()=>SidebarMenuItem,
    "SidebarMenuSkeleton",
    ()=>SidebarMenuSkeleton,
    "SidebarMenuSub",
    ()=>SidebarMenuSub,
    "SidebarMenuSubButton",
    ()=>SidebarMenuSubButton,
    "SidebarMenuSubItem",
    ()=>SidebarMenuSubItem,
    "SidebarProvider",
    ()=>SidebarProvider,
    "SidebarRail",
    ()=>SidebarRail,
    "SidebarSeparator",
    ()=>SidebarSeparator,
    "SidebarTrigger",
    ()=>SidebarTrigger,
    "useSidebar",
    ()=>useSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/panel-left.js [app-ssr] (ecmascript) <export default as PanelLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$mobile$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-mobile.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@/components/ui/button'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '@/components/ui/input'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '@/components/ui/separator'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '@/components/ui/sheet'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '@/components/ui/skeleton'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '@/components/ui/tooltip'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SidebarContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"](null);
function useSidebar() {
    const context = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"](SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }
    return context;
}
const SidebarProvider = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref)=>{
    const isMobile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$mobile$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsMobile"])();
    const [openMobile, setOpenMobile] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](defaultOpen);
    const open = openProp ?? _open;
    const setOpen = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"]((value)=>{
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
            setOpenProp(openState);
        } else {
            _setOpen(openState);
        }
        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }, [
        setOpenProp,
        open
    ]);
    // Helper to toggle the sidebar.
    const toggleSidebar = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        return isMobile ? setOpenMobile((open)=>!open) : setOpen((open)=>!open);
    }, [
        isMobile,
        setOpen,
        setOpenMobile
    ]);
    // Adds a keyboard shortcut to toggle the sidebar.
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const handleKeyDown = (event)=>{
            if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return ()=>window.removeEventListener("keydown", handleKeyDown);
    }, [
        toggleSidebar
    ]);
    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";
    const contextValue = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>({
            state,
            open,
            setOpen,
            isMobile,
            openMobile,
            setOpenMobile,
            toggleSidebar
        }), [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SidebarContext.Provider, {
        value: contextValue,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TooltipProvider, {
            delayDuration: 0,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    "--sidebar-width": SIDEBAR_WIDTH,
                    "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                    ...style
                },
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar", className),
                ref: ref,
                ...props,
                children: children
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 136,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
            lineNumber: 135,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 134,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarProvider.displayName = "SidebarProvider";
const Sidebar = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref)=>{
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
    if (collapsible === "none") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground", className),
            ref: ref,
            ...props,
            children: children
        }, void 0, false, {
            fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
            lineNumber: 183,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0));
    }
    if (isMobile) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Sheet, {
            open: openMobile,
            onOpenChange: setOpenMobile,
            ...props,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetContent, {
                "data-sidebar": "sidebar",
                "data-mobile": "true",
                className: "w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
                style: {
                    "--sidebar-width": SIDEBAR_WIDTH_MOBILE
                },
                side: side,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetTitle, {
                        className: "sr-only",
                        children: "Navigation Menu"
                    }, void 0, false, {
                        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                        lineNumber: 210,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-full w-full flex-col",
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                        lineNumber: 211,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 199,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
            lineNumber: 198,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: "group peer hidden md:block text-sidebar-foreground",
        "data-state": state,
        "data-collapsible": state === "collapsed" ? collapsible : "",
        "data-variant": variant,
        "data-side": side,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]")
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 227,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex", side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]", // Adjust the padding for floating and inset variants.
                variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]" : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l", className),
                ...props,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    "data-sidebar": "sidebar",
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex h-full w-full flex-col', // Glass background/border consistent with app
                    'bg-white/60 backdrop-blur-xl border-white/30 dark:bg-white/10 dark:border-white/10', 'group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow'),
                    children: children
                }, void 0, false, {
                    fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                    lineNumber: 251,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 237,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 218,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
Sidebar.displayName = "Sidebar";
const SidebarTrigger = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, onClick, ...props }, ref)=>{
    const { toggleSidebar } = useSidebar();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Button, {
        ref: ref,
        "data-sidebar": "trigger",
        variant: "ghost",
        size: "icon",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("h-7 w-7", className),
        onClick: (event)=>{
            onClick?.(event);
            toggleSidebar();
        },
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelLeft$3e$__["PanelLeft"], {}, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 288,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "sr-only",
                children: "Toggle Sidebar"
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 289,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 276,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarTrigger.displayName = "SidebarTrigger";
const SidebarRail = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    const { toggleSidebar } = useSidebar();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ref: ref,
        "data-sidebar": "rail",
        "aria-label": "Toggle Sidebar",
        tabIndex: -1,
        onClick: toggleSidebar,
        title: "Toggle Sidebar",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex", "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize", "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize", "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar", "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2", "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 302,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarRail.displayName = "SidebarRail";
const SidebarInset = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative flex min-h-svh flex-1 flex-col bg-background", "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 rtl:md:peer-data-[state=collapsed]:peer-data-[variant=inset]:mr-2 md:peer-data-[variant=inset]:ml-0 rtl:md:peer-data-[variant=inset]:mr-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 329,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarInset.displayName = "SidebarInset";
const SidebarInput = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Input, {
        ref: ref,
        "data-sidebar": "input",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 347,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarInput.displayName = "SidebarInput";
const SidebarHeader = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        "data-sidebar": "header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-2 p-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 365,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarHeader.displayName = "SidebarHeader";
const SidebarFooter = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        "data-sidebar": "footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-2 p-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 380,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarFooter.displayName = "SidebarFooter";
const SidebarSeparator = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Separator, {
        ref: ref,
        "data-sidebar": "separator",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("mx-2 w-auto bg-sidebar-border", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 395,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarSeparator.displayName = "SidebarSeparator";
const SidebarContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        "data-sidebar": "content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 410,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarContent.displayName = "SidebarContent";
const SidebarGroup = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        "data-sidebar": "group",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative flex w-full min-w-0 flex-col p-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 428,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarGroup.displayName = "SidebarGroup";
const SidebarGroupLabel = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "div";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        ref: ref,
        "data-sidebar": "group-label",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 445,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";
const SidebarGroupAction = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        ref: ref,
        "data-sidebar": "group-action",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden", "group-data-[collapsible=icon]:hidden", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 466,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarGroupAction.displayName = "SidebarGroupAction";
const SidebarGroupContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        "data-sidebar": "group-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("w-full text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 486,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
SidebarGroupContent.displayName = "SidebarGroupContent";
const SidebarMenu = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        ref: ref,
        "data-sidebar": "menu",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex w-full min-w-0 flex-col gap-1", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 499,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
SidebarMenu.displayName = "SidebarMenu";
const SidebarMenuItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        ref: ref,
        "data-sidebar": "menu-item",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("group/menu-item relative", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 512,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
SidebarMenuItem.displayName = "SidebarMenuItem";
const sidebarMenuButtonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 group-has-[[data-sidebar=menu-action]]/menu-item:rtl:pl-8 group-has-[[data-sidebar=menu-action]]/menu-item:rtl:pr-2 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0", {
    variants: {
        variant: {
            default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
        },
        size: {
            default: "h-8 text-sm",
            sm: "h-7 text-xs",
            lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const SidebarMenuButton = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "button";
    const { isMobile, state } = useSidebar();
    const button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        ref: ref,
        "data-sidebar": "menu-button",
        "data-size": size,
        "data-active": isActive,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(sidebarMenuButtonVariants({
            variant,
            size
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 567,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
    if (!tooltip || asChild) {
        return button;
    }
    if (typeof tooltip === "string") {
        tooltip = {
            children: tooltip
        };
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Tooltip, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TooltipTrigger, {
                asChild: true,
                children: button
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 589,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TooltipContent, {
                side: "right",
                align: "center",
                hidden: state !== "collapsed" || isMobile,
                ...tooltip
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 590,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 588,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarMenuButton.displayName = "SidebarMenuButton";
const SidebarMenuAction = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, asChild = false, showOnHover = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        ref: ref,
        "data-sidebar": "menu-action",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground rtl:left-1 rtl:right-auto [&>svg]:size-4 [&>svg]:shrink-0", // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-1.5", "peer-data-[size=lg]/menu-button:top-2.5", "group-data-[collapsible=icon]:hidden", showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 612,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarMenuAction.displayName = "SidebarMenuAction";
const SidebarMenuBadge = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        "data-sidebar": "menu-badge",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none rtl:left-1 rtl:right-auto", "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-1.5", "peer-data-[size=lg]/menu-button:top-2.5", "group-data-[collapsible=icon]:hidden", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 637,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
SidebarMenuBadge.displayName = "SidebarMenuBadge";
const SidebarMenuSkeleton = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, showIcon = false, ...props }, ref)=>{
    // Random width between 50 to 90%.
    const width = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        return `${Math.floor(Math.random() * 40) + 50}%`;
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        "data-sidebar": "menu-skeleton",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("rounded-md h-8 flex gap-2 px-2 items-center", className),
        ...props,
        children: [
            showIcon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Skeleton, {
                className: "size-4 rounded-md",
                "data-sidebar": "menu-skeleton-icon"
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 673,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Skeleton, {
                className: "h-4 flex-1 max-w-[--skeleton-width]",
                "data-sidebar": "menu-skeleton-text",
                style: {
                    "--skeleton-width": width
                }
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
                lineNumber: 678,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 666,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";
const SidebarMenuSub = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        ref: ref,
        "data-sidebar": "menu-sub",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 rtl:-translate-x-px rtl:border-r rtl:border-l-0", "group-data-[collapsible=icon]:hidden", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 696,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
SidebarMenuSub.displayName = "SidebarMenuSub";
const SidebarMenuSubItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 712,
        columnNumber: 26
    }, ("TURBOPACK compile-time value", void 0)));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
const SidebarMenuSubButton = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ asChild = false, size = "md", isActive, className, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "a";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        ref: ref,
        "data-sidebar": "menu-sub-button",
        "data-size": size,
        "data-active": isActive,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 rtl:translate-x-px aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground", "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground", size === "sm" && "text-xs", size === "md" && "text-sm", "group-data-[collapsible=icon]:hidden", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/sidebar.tsx",
        lineNumber: 726,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";
;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/accommodation/src/lib/dictionaries.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dictionaries",
    ()=>dictionaries
]);
const en = {
    // General
    boardView: 'Board View',
    board: 'Board',
    viewAll: 'View All',
    location: 'Location',
    status: 'Status',
    orderId: 'Order ID',
    mivId: 'MIV ID',
    date: 'Date',
    loading: 'Loading...',
    // Header
    changeLanguage: 'Change Language',
    notifications: 'Notifications',
    myAccount: 'My Account',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    // Analytics
    accommodationAnalytics: 'Accommodation Analytics',
    ordersAnalytics: 'Material Requests Analytics',
    // Sidebar
    sidebar: {
        // Main Section
        main: 'Main',
        dashboard: 'Dashboard',
        maintenance: 'Maintenance',
        // Stock Management Section
        stockManagement: 'Stock Management',
        inventory: 'Inventory',
        stockReconciliation: 'Stock Reconciliation',
        depreciation: 'Depreciation',
        stockTransfer: 'Stock Transfer',
        // Material Movement Section
        materialMovement: 'Material Movement',
        materialRequests: 'Material Requests',
        receiveMaterials: 'Receive Materials',
        issueMaterials: 'Issue Materials',
        // Reports Section
        reports: 'Reports',
        stockMovementReport: 'Stock Movement Report',
        lifespanReport: 'Lifespan Report',
        // Additional report labels
        reconciliations: 'Reconciliations',
        // Settings Section
        settings: 'Settings',
        residences: 'Residences',
        users: 'Users',
        aiTools: 'AI Tools',
        setup: 'Setup',
        // Legacy items
        stockTransferHistory: 'Transfer History'
    },
    // Feedback
    feedback: 'Feedback',
    myFeedback: 'My Feedback',
    feedbackBoard: 'Feedback Board',
    feedbackAnalytics: 'Feedback Analytics',
    // Dashboard Page
    dashboard: {
        totalRequests: 'Total Requests',
        totalRequestsDescription: 'Total material requests',
        totalMaintenanceRequests: 'Total maintenance requests',
        pending: 'Pending',
        requestsNeedAttention: 'Requests that need attention',
        completed: 'Completed',
        completedRequests: 'Completed requests',
        recentMaintenance: 'Recent Maintenance',
        noMaintenanceRequestsFound: 'No maintenance requests found.',
        recentMaterialRequests: 'Recent Material Requests',
        noMaterialRequestsFound: 'No material requests found.',
        recentReceipts: 'Recent Receipts',
        noRecentReceiptsFound: 'No recent receipts found.',
        recentIssues: 'Recent Issues',
        noRecentIssuesFound: 'No recent issues found.',
        recentServiceOrders: 'Recent Service Orders',
        noServiceOrdersFound: 'No service orders found.',
        recentDepreciation: 'Recent Depreciation',
        recentStockTransfers: 'Recent Stock Transfers'
    },
    // Quick Actions
    quickActions: {
        addNewOrder: 'Add New Order',
        addMaterialReceipt: 'Add Material Receipt',
        issueMaterials: 'Issue Materials',
        serviceOrder: 'Service Order',
        maintenanceRequest: 'Maintenance Request'
    },
    // Reports
    reportsTitle: 'Reports',
    reportsDescription: 'View and create reports for inventory, maintenance and more.',
    inventoryReportsTitle: 'Inventory Reports',
    inventoryReportsDescription: 'Click to go to the inventory page. From there, click any item to view its detailed movement report.',
    stockMovementReportTitle: 'Stock Movement Report',
    stockMovementReportDescription: 'A detailed report of material movements by residence, date range, and movement type.',
    lifespanReportTitle: 'Lifespan Report',
    lifespanReportDescription: 'Report highlighting items that exceeded expected lifespan or have unusual usage patterns.',
    maintenanceReportsTitle: 'Maintenance Reports',
    maintenanceReportsDescription: 'Future reports for maintenance activities will be available here.',
    // Item movement / ledger
    itemMovementReportTitle: 'Item Movement Report (Ledger)',
    itemMovementReportDescription: 'Detailed item movement ledger across residences with running balances.',
    itemNotFound: 'Item not found.',
    residenceNotFound: 'Residence not found.',
    showingHistoryFor: 'Showing history for',
    atLabel: 'at',
    acrossAllResidences: 'across all residences',
    currentStockLabel: 'Current Stock',
    totalSystemStockLabel: 'Total System Stock',
    movementDetailsTitle: 'Movement details',
    referenceLabel: 'Reference',
    openMrv: 'Open MRV',
    openMiv: 'Open MIV',
    openReconciliation: 'Open Reconciliation',
    noReconciliationLinesFound: 'No reconciliation lines found.',
    noAdditionalMovementDetails: 'No additional details available for this movement.',
    directionLabel: 'Direction',
    received: 'Received',
    issued: 'Issued',
    reconciliationsTitle: 'Reconciliations',
    allReconciliations: 'All reconciliations',
    noReconciliationsFound: 'No reconciliations found.',
    reconciliationTitle: 'Reconciliation',
    overviewLabel: 'Overview',
    performedByLabel: 'By',
    itemsLabel: 'Items',
    increaseLabel: 'Increase',
    decreaseLabel: 'Decrease',
    // top-level status
    pending: 'Pending',
    completed: 'Completed',
    // Report UI labels
    reportFilters: 'Report Filters',
    locationHierarchy: 'Location Hierarchy',
    residenceLabel: 'Residence',
    buildingLabel: 'Building',
    floorLabel: 'Floor',
    roomLabel: 'Room',
    allAssignedResidences: 'All Assigned Residences',
    allBuildings: 'All Buildings',
    allFloors: 'All Floors',
    allRooms: 'All Rooms',
    movementTypeLabel: 'Movement Type',
    itemLabel: 'Item',
    startDate: 'Start Date',
    endDate: 'End Date',
    exportToCsv: 'Export to CSV',
    // Stock movement / report UI
    movementAndItemFiltersLabel: 'Movement & Item Filters',
    dateRangeLabel: 'Date Range',
    specificItemLabel: 'Specific Item',
    generateReport: 'Generate Report',
    generating: 'Generating...',
    generatingReport: 'Generating Report...',
    exportCsvButton: 'Export CSV',
    reportResultsTitle: 'Report Results',
    noResultsFoundTitle: 'No Results Found',
    noResultsFoundMessage: 'No transactions were found matching the specified criteria. Try adjusting the filters.',
    readyToGenerate: 'Ready to generate report',
    dateTimeLabel: 'Date & Time',
    stockIn: 'Stock In',
    stockOut: 'Stock Out',
    transferIn: 'Transfer In',
    transferOut: 'Transfer Out',
    adjustmentLabel: 'Adjustment',
    returnLabel: 'Return',
    depreciationLabel: 'Depreciation',
    // Date shortcuts
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisYear: 'This Year',
    lastYear: 'Last Year',
    auditAdjustmentLabel: 'Audit Adjustment',
    scrapLabel: 'Scrap',
    noResultsIconTitle: 'No Results Found',
    quantity: 'Quantity',
    notes: 'Notes',
    details: 'Details',
    typeLabel: 'Type',
    balance: 'Balance',
    previousIssue: 'Previous Issue',
    latestIssue: 'Latest Issue',
    lifespanDays: 'Lifespan (Days)',
    actualDays: 'Actual Days',
    noLifespanExceptionsFound: 'No lifespan exceptions found.',
    noMovementHistoryFoundForThisItem: 'No movement history found for this item.',
    noMovementHistoryFoundForThisItemInResidence: 'No movement history found for this item in this residence.',
    noMovementHistoryFoundForThisItemAcrossResidences: 'No movement history found for this item across all residences.',
    backToInventory: 'Back to Inventory',
    movementFromMrvPrefix: 'Received via MRV:',
    issuedToPrefix: 'Issued to:',
    transferFromPrefix: 'Transfer from:',
    transferToPrefix: 'Transfer to:',
    viewLabel: 'View',
    supplierLabel: 'Supplier',
    invoiceLabel: 'Invoice',
    locationNotSpecified: 'Location not specified',
    // Residences
    residencesTreeTitle: 'Residences Tree',
    residencesNoData: 'No residences to display',
    residencesNoAssigned: 'The current user has no assigned residences.',
    residencesCountSuffix: 'residences',
    noBuildings: 'No buildings',
    noFloors: 'No floors',
    noRooms: 'No rooms',
    noBuildingsOrRooms: 'No buildings or rooms',
    addressesUncategorized: 'Uncategorized',
    residencesTreeHeader: 'Residences (Tree)',
    residencesTitle: 'Residences',
    residencesDescription: 'Manage your residential complexes, buildings, and units.',
    addComplex: 'Add Complex',
    addNewComplexTitle: 'Add New Complex',
    addNewComplexDescription: 'Enter the details for the new residential complex.',
    nameLabel: 'Name',
    cityLabel: 'City',
    managerLabel: 'Manager',
    selectManagerPlaceholder: 'Select a manager',
    saveComplex: 'Save Complex',
    searchResidencesPlaceholder: 'Search complexes, buildings, floors, rooms...',
    allCities: 'All Cities',
    allManagers: 'All Managers',
    complexesLabel: 'Complexes',
    buildingsLabel: 'Buildings',
    floorsLabel: 'Floors',
    roomsLabel: 'Rooms',
    facilitiesLabel: 'Facilities',
    buildingFacilitiesLabel: 'Building Facilities',
    floorFacilitiesLabel: 'Floor Facilities',
    generalFacilitiesLabel: 'Residence Facilities',
    addBuilding: 'Add Building',
    disableLabel: 'Disable',
    addRoom: 'Add Room',
    addMultipleRooms: 'Add Multiple Rooms',
    addFacility: 'Add Facility',
    addNewFacilityTitle: 'Add New Facility',
    addNewFacilityDescription: 'Add a new facility to the selected level. Use quantity for numbered items.',
    facilityNameLabel: 'Facility Name',
    facilityTypeLabel: 'Facility Type',
    facilityQuantityLabel: 'Quantity',
    // Additional UI for residence detail
    noResidenceData: 'No residence data.',
    back: 'Back',
    assignTenant: 'Assign tenant',
    tenantNamePlaceholder: 'Tenant name',
    working: 'Working...',
    assign: 'Assign',
    address: 'Address',
    notSpecified: 'Not specified',
    roomsBuildings: 'Rooms / Buildings',
    noRoomsDefined: 'No rooms defined.',
    // Maintenance
    maintenanceRequestsTitle: 'Maintenance Requests',
    maintenanceRequestsDescription: 'An overview of all maintenance requests.',
    noMaintenanceRequestsFound: 'No maintenance requests found.',
    noPendingRequests: 'No pending requests.',
    noInProgressRequests: 'No requests in progress.',
    noCompletedRequests: 'No completed requests.',
    requestId: 'Request ID',
    issue: 'Issue',
    priority: 'Priority',
    changeStatus: 'Change Status',
    inProgress: 'In Progress',
    all: 'All',
    filter: 'Filter',
    filterByPriority: 'Filter by Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    requestsNeedAttention: 'Requests that need attention',
    // Orders / Inventory
    newRequest: 'New Request',
    newMRVApproval: 'New MRV (Approval)',
    consolidatedPrinting: 'Consolidated Printing',
    activeRequests: 'Active Requests',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    totalRequestsCard: 'Total Requests',
    pendingMRVApprovals: 'Pending MRV Approvals',
    readyToReceive: 'Ready to Receive',
    noRecordsFound: 'No records found.',
    searchItemsPlaceholder: 'Search items...',
    allCategories: 'All Categories',
    recentItemsTitle: 'Recently Used Items • الأصناف المستخدمة حديثاً',
    items: 'Items',
    actions: 'Actions',
    requestForResidence: 'Request for residence:',
    submitRequest: 'Submit Request',
    exportToExcel: 'Export items to Excel',
    manageMaterialsSubtitle: 'Manage your materials and supplies for each residence.',
    stockTransfer: 'Stock Transfer',
    addCategory: 'Add Category',
    addCategoryTitle: 'Add New Category',
    addCategoryDescription: 'Enter the name for the new inventory category.',
    categoryNameLabel: 'Category Name',
    exampleCategoryPlaceholder: 'e.g., Landscaping',
    saveCategory: 'Save Category',
    addItem: 'Add Item',
    allItems: 'All Items',
    searchPlaceholder: 'Search / بحث',
    categoryPlaceholder: 'Category',
    // Common UI
    ui: {
        loading: 'Loading...',
        currentRequestEmpty: 'Your request is empty.',
        hideCompleted: 'Hide Completed',
        showCompleted: 'Show Completed',
        rejected: 'Rejected',
        cancel: 'Cancel',
        discardDraft: 'Discard Draft',
        saveChanges: 'Save Changes',
        availableInventory: 'Available Inventory',
        currentRequest: 'Current Request',
        generalNotes: 'General Notes',
        addGeneralNotesPlaceholder: 'Add any general notes for the entire request...',
        editMaterialRequest: 'Edit Material Request',
        materialsApp: 'Materials',
        accommodationApp: 'Accommodation',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        colorSettings: 'Color Settings',
        viewHistory: 'View History'
    },
    // Receive / Issue / Inventory labels
    reviewLabel: 'Review',
    approveButton: 'Approve',
    receiveButton: 'Receive',
    materialsRequestsLabel: 'Materials Requests (MR)',
    pendingMrvCardDescription: 'Requests awaiting approval or posting to stock',
    approvedMrvsTitle: 'Approved MRVs',
    approvedMrvsDescription: 'Receipts posted to stock • Click to collapse/expand',
    selectResidencePlaceholder: 'Select a residence...',
    mivTitle: 'Material Issue Voucher (MIV)',
    mivDescription: 'Issue materials from a residence\'s storeroom to specific locations.',
    viewHistoryLabel: 'View History',
    submitVoucher: 'Submit Voucher',
    selectLocationAndItemsTitle: 'Select Location & Items',
    selectLocationAndItemsDescription: 'First, select the location. Then, add items from the available inventory below.',
    issueFromLabel: 'Issue From:',
    locationTypeLabel: 'Location Type',
    unitLabel: 'Unit',
    facilityLabel: 'Facility',
    noInventoryFound: 'No inventory found.',
    voucherEmptyMessage: 'No items added to the voucher yet.',
    itemNameArLabel: 'Arabic Name',
    itemNameEnLabel: 'English Name',
    categoryLabel: 'Category',
    unitLabelShort: 'Unit',
    stockLabel: 'Stock',
    actionsLabel: 'Actions',
    noItemsWithStock: 'No items with stock in this residence.',
    // Receive / MRV specific
    invalidStatusTitle: 'Invalid Status',
    invalidStatusCannotBeReceived: 'This request has a status of "{status}" and cannot be received.',
    orderNotFoundDescription: 'Order not found.',
    receiveMrvTitle: 'Material Receive Voucher (MRV)',
    receiveMrvPageDescription: 'Review pending MRV approvals and receive approved requests.',
    receiveMrvDescription: 'Confirm quantities received for request #{id}',
    receiveAndCloseOrder: 'Receive & Close Order',
    confirmCloseTitle: 'Are you sure you want to close this order?',
    confirmCloseDescription: 'This will receive the currently entered quantities and mark the order as "Delivered", even if not all items were fully received. This action cannot be undone.',
    confirmAndClose: 'Confirm and Close',
    processing: 'Processing...',
    confirmReceiptAndUpdateStock: 'Confirm Receipt & Update Stock',
    requestDetailsTitle: 'Request Details',
    requestDetailsDescription: 'Request for {residence} on {date}',
    itemNameHeader: 'Item Name',
    qtyRequestedHeader: 'Qty Requested',
    qtyReceivedPrevHeader: 'Qty Received (Prev)',
    qtyToReceiveNowHeader: 'Qty to Receive (Now)',
    noItemsToReceive: 'No items to receive.',
    noChangeTitle: 'No Change',
    noNewQuantitiesDescription: 'No new quantities were entered to receive.',
    // New MRV page
    createMRV: 'Create MRV',
    mrvHeaderTitle: 'Header',
    optionalPlaceholder: 'Optional',
    // Receipts
    materialReceiptsTitle: 'Material Receipts',
    materialReceiptsDescription: 'Latest MRVs posted to stock.',
    receiptsLabel: 'Receipts',
    recordsCount: '{count} record(s)',
    idLabel: 'ID',
    actionLabel: 'Action',
    noReceiptsFound: 'No receipts found.',
    // Transfer page
    newStockTransferTitle: 'New Stock Transfer Request',
    newStockTransferDescription: 'Create a request to move inventory between residences.',
    submitTransferRequest: 'Submit Transfer Request',
    transferStep1Title: '1. Select Residences & Items',
    transferTypeLabel: 'Transfer Type',
    transferTypeInternal: 'Internal (Within my residences)',
    transferTypeExternal: 'External (To other residences)',
    transferFromLabel: 'Transfer From',
    selectSourcePlaceholder: 'Select source...',
    selectDestinationPlaceholder: 'Select destination...',
    searchItemsToAddPlaceholder: 'Search items to add...',
    noItemsMatchSearch: 'No items match your search.',
    selectSourceToSeeItems: 'Select a source residence to see available items.',
    transferStep2Title: '2. Review Request',
    transferReviewDescription: 'Adjust quantities before submitting the transfer request.',
    addItemsFromLeft: 'Add items from the left to begin.',
    stockLimitTitle: 'Stock Limit',
    stockLimitDescription: 'Cannot transfer more than the available {stock} units.',
    invalidTransfer: 'Please select source, destination, and add items to transfer.',
    // Stock Matrix Report (EN)
    stockMatrixReportTitle: 'Stock Matrix (By Residences)',
    stockMatrixReportDescription: 'Tabular matrix of items grouped by category across residences, with per-residence and grand totals.',
    displaySettingsTitle: 'Display Settings',
    printLabel: 'Print',
    searchItemsArEnPlaceholder: 'Search by Arabic/English name',
    hideZeroStockItemsLabel: 'Hide items with zero stock',
    categoryItemHeader: 'Category / Item',
    grandTotalLabel: 'Grand Total',
    totalLabel: 'Total',
    noDataToDisplay: 'No data to display',
    // Services / service orders in reports
    openServiceOrder: 'Open Service Order',
    serviceFilterLabel: 'Service Movements',
    serviceFilterAll: 'All',
    serviceFilterOnly: 'Only service',
    serviceFilterExclude: 'Exclude service',
    serviceDispatch: 'Service Dispatch',
    serviceReturn: 'Service Return',
    serviceScrap: 'Service Scrap'
};
const ar = {
    // General
    boardView: 'عرض اللوحة',
    board: 'اللوحة',
    viewAll: 'عرض الكل',
    location: 'الموقع',
    status: 'الحالة',
    orderId: 'معرّف الطلب',
    mivId: 'معرّف MIV',
    date: 'التاريخ',
    loading: 'جاري التحميل...',
    // Header
    changeLanguage: 'تغيير اللغة',
    notifications: 'الإشعارات',
    myAccount: 'حسابي',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    // Analytics
    accommodationAnalytics: 'تحليلات التسكين',
    ordersAnalytics: 'تحليلات طلبات المواد',
    // Sidebar
    sidebar: {
        main: 'الرئيسية',
        dashboard: 'لوحة القيادة',
        maintenance: 'الصيانة',
        stockManagement: 'إدارة المخزون',
        inventory: 'المخزون',
        stockReconciliation: 'مطابقة المخزون',
        depreciation: 'الاستهلاك',
        stockTransfer: 'نقل المخزون',
        materialMovement: 'حركة المواد',
        materialRequests: 'طلبات المواد',
        receiveMaterials: 'استلام المواد',
        issueMaterials: 'صرف المواد',
        reports: 'التقارير',
        stockMovementReport: 'تقرير حركة المخزون',
        lifespanReport: 'تقرير العمر الافتراضي',
        // Additional report labels
        reconciliations: 'المطابقات',
        settings: 'الإعدادات',
        residences: 'المساكن',
        users: 'المستخدمون',
        aiTools: 'أدوات الذكاء الاصطناعي',
        setup: 'إعداد',
        stockTransferHistory: 'سجل النقل'
    },
    // Feedback
    feedback: 'التعليقات',
    myFeedback: 'تعليقاتي',
    feedbackBoard: 'لوحة التعليقات',
    feedbackAnalytics: 'تحليلات التعليقات',
    // Dashboard Page
    dashboard: {
        totalRequests: 'إجمالي الطلبات',
        totalRequestsDescription: 'إجمالي طلبات المواد',
        totalMaintenanceRequests: 'إجمالي طلبات الصيانة',
        pending: 'قيد الانتظار',
        requestsNeedAttention: 'الطلبات التي تحتاج انتباه',
        completed: 'مكتمل',
        completedRequests: 'الطلبات المكتملة',
        recentMaintenance: 'الصيانة الأخيرة',
        noMaintenanceRequestsFound: 'لا توجد طلبات صيانة.',
        recentMaterialRequests: 'طلبات المواد الأخيرة',
        noMaterialRequestsFound: 'لا توجد طلبات مواد.',
        recentReceipts: 'الإيصالات الأخيرة',
        noRecentReceiptsFound: 'لا توجد إيصالات حديثة.',
        recentIssues: 'القضايا الأخيرة',
        noRecentIssuesFound: 'لا توجد قضايا حديثة.',
        recentServiceOrders: 'أوامر الخدمة الأخيرة',
        noServiceOrdersFound: 'لا توجد أوامر خدمة.',
        recentDepreciation: 'الاستهلاكات الأخيرة',
        recentStockTransfers: 'تحويلات المخزون الأخيرة'
    },
    // Quick Actions
    quickActions: {
        addNewOrder: 'اضافة طلب جديد',
        addMaterialReceipt: 'اضافة استلام مواد',
        issueMaterials: 'فتح توزيع الطلبات',
        serviceOrder: 'طلب خدمة',
        maintenanceRequest: 'طلب صيانة'
    },
    // Reports (AR)
    reportsTitle: 'التقارير',
    reportsDescription: 'عرض وإنشاء تقارير للمخزون والصيانة والمزيد.',
    inventoryReportsTitle: 'تقارير المخزون',
    inventoryReportsDescription: 'انقر للذهاب إلى صفحة المخزون. من هناك، انقر على أي صنف لعرض تقرير حركته المفصل.',
    stockMovementReportTitle: 'تقرير حركة المخزون',
    stockMovementReportDescription: 'تقرير مفصل لحركة المواد حسب السكن والفترة الزمنية ونوع الحركة.',
    lifespanReportTitle: 'تقرير العمر الافتراضي',
    lifespanReportDescription: 'تقرير يبرز الأصناف التي تجاوزت العمر الافتراضي المتوقع أو التي لديها أنماط استخدام غير معتادة.',
    maintenanceReportsTitle: 'تقارير الصيانة',
    maintenanceReportsDescription: 'التقارير المستقبلية لأنشطة الصيانة ستكون متاحة هنا.',
    // Stock Matrix Report (AR)
    stockMatrixReportTitle: 'تقرير مصفوفة المخزون (حسب السكنات)',
    stockMatrixReportDescription: 'مصفوفة جدولة للأصناف حسب التصنيف عبر السكنات مع مجاميع لكل سكن والإجمالي الكلي.',
    displaySettingsTitle: 'إعدادات العرض',
    printLabel: 'طباعة',
    searchItemsArEnPlaceholder: 'بحث بالاسم العربي/الإنجليزي',
    hideZeroStockItemsLabel: 'إخفاء المواد بصفر مخزون',
    categoryItemHeader: 'التصنيف / المادة',
    grandTotalLabel: 'المجموع الكلي',
    totalLabel: 'الإجمالي',
    noDataToDisplay: 'لا توجد بيانات لعرضها',
    // Item movement / ledger (AR)
    itemMovementReportTitle: 'تقرير حركة الأصناف (دفتر الأستاذ)',
    itemMovementReportDescription: 'دفتر حركة الأصناف عبر المساكن مع أرصدة جارية.',
    itemNotFound: 'الصنف غير موجود.',
    residenceNotFound: 'السكن غير موجود.',
    showingHistoryFor: 'عرض السجل لـ',
    atLabel: 'في',
    details: 'تفاصيل',
    acrossAllResidences: 'عبر جميع السكنات',
    currentStockLabel: 'المخزون الحالي',
    totalSystemStockLabel: 'إجمالي مخزون النظام',
    movementDetailsTitle: 'تفاصيل الحركة',
    referenceLabel: 'المرجع',
    openMrv: 'فتح MRV',
    openMiv: 'فتح MIV',
    openReconciliation: 'فتح المطابقة',
    noReconciliationLinesFound: 'لم يتم العثور على خطوط مطابقة.',
    reconciliationTitle: 'المطابقة',
    overviewLabel: 'نظرة عامة',
    performedByLabel: 'بواسطة',
    noAdditionalMovementDetails: 'لا توجد تفاصيل إضافية لهذه الحركة.',
    directionLabel: 'الاتجاه',
    received: 'تم الاستلام',
    issued: 'تم الصرف',
    // top-level status (AR)
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    // Residences (AR)
    residencesTreeTitle: 'الشجرية: السكنات',
    residencesNoData: 'لا توجد سكنات لعرضها',
    residencesNoAssigned: 'المستخدم الحالي لا يمتلك سكنات.',
    residencesCountSuffix: 'سكن',
    noBuildings: 'لا توجد مباني',
    noFloors: 'لا توجد طوابق',
    noRooms: 'لا توجد غرف',
    noBuildingsOrRooms: 'لا توجد مباني أو غرف',
    addressesUncategorized: 'غير مصنف',
    residencesTreeHeader: 'الشجرية: السكنات',
    noResidenceData: 'لا توجد بيانات للسكن',
    back: 'عودة',
    assignTenant: 'تعيين مستأجر',
    tenantNamePlaceholder: 'اسم المستأجر',
    working: 'جارِ التنفيذ...',
    assign: 'تعيين',
    address: 'العنوان',
    notSpecified: 'غير محدد',
    roomsBuildings: 'الغرف / المباني',
    noRoomsDefined: 'لا توجد غرف معرفة.',
    residencesTitle: 'المساكن',
    residencesDescription: 'إدارة المجمعات السكنية والمباني والوحدات.',
    addComplex: 'إضافة مجمع',
    addNewComplexTitle: 'إضافة مجمع جديد',
    addNewComplexDescription: 'أدخل تفاصيل المجمع السكني الجديد.',
    nameLabel: 'الاسم',
    cityLabel: 'المدينة',
    managerLabel: 'المدير',
    selectManagerPlaceholder: 'اختر مديراً',
    saveComplex: 'حفظ المجمع',
    searchResidencesPlaceholder: 'ابحث في المجمعات والمباني والطوابق والغرف...',
    allCities: 'كل المدن',
    allManagers: 'كل المديرين',
    complexesLabel: 'المجمعات',
    buildingsLabel: 'المباني',
    floorsLabel: 'الطوابق',
    roomsLabel: 'الغرف',
    facilitiesLabel: 'المرافق',
    buildingFacilitiesLabel: 'مرافق المبنى',
    floorFacilitiesLabel: 'مرافق الطابق',
    generalFacilitiesLabel: 'مرافق السكن',
    addBuilding: 'إضافة مبنى',
    disableLabel: 'تعطيل',
    addRoom: 'إضافة غرفة',
    addMultipleRooms: 'إضافة غرف متعددة',
    addFacility: 'إضافة مرفق',
    addNewFacilityTitle: 'إضافة مرفق جديد',
    addNewFacilityDescription: 'أضف مرفقًا جديدًا إلى المستوى المحدد. استخدم الكمية للعناصر المرقمة.',
    facilityNameLabel: 'اسم المرفق',
    facilityTypeLabel: 'نوع المرفق',
    facilityQuantityLabel: 'الكمية',
    // Orders / Inventory (AR translations below)
    newRequest: 'طلب جديد',
    newMRVApproval: 'MRV جديد (موافقة)',
    consolidatedPrinting: 'طباعة مجمعة',
    activeRequests: 'الطلبات النشطة',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    totalRequestsCard: 'إجمالي الطلبات',
    pendingMRVApprovals: 'طلبات MRV المعلقة',
    readyToReceive: 'جاهز للاستلام',
    noRecordsFound: 'لا توجد سجلات.',
    exportToExcel: 'تصدير الأصناف إلى Excel',
    manageMaterialsSubtitle: 'إدارة المواد والإمدادات لكل سكن.',
    stockTransfer: 'نقل المخزون',
    addCategory: 'إضافة تصنيف',
    addCategoryTitle: 'إضافة تصنيف جديد',
    addCategoryDescription: 'أدخل اسم التصنيف الجديد للمخزون.',
    categoryNameLabel: 'اسم التصنيف',
    exampleCategoryPlaceholder: 'مثال، تنسيق الحدائق',
    saveCategory: 'حفظ التصنيف',
    addItem: 'إضافة صنف',
    allItems: 'كل الأصناف',
    searchPlaceholder: 'بحث / Search',
    categoryPlaceholder: 'التصنيف',
    // Stock movement / report UI (AR)
    movementAndItemFiltersLabel: 'حركة ومرشحات الأصناف',
    dateRangeLabel: 'نطاق التاريخ',
    specificItemLabel: 'صنف محدد',
    generateReport: 'إنشاء التقرير',
    generating: 'جارِ الإنشاء...',
    generatingReport: 'جارِ إنشاء التقرير...',
    exportCsvButton: 'تصدير CSV',
    reportResultsTitle: 'نتائج التقرير',
    noResultsFoundTitle: 'لا توجد نتائج',
    noResultsFoundMessage: 'لم يتم العثور على معاملات تطابق المعايير المحددة. حاول تعديل المرشحات.',
    readyToGenerate: 'جاهز لإنشاء التقرير',
    dateTimeLabel: 'التاريخ والوقت',
    stockIn: 'توريد',
    stockOut: 'صرف',
    transferIn: 'تحويل وارد',
    transferOut: 'تحويل صادر',
    adjustmentLabel: 'تسوية',
    returnLabel: 'إرجاع',
    depreciationLabel: 'الاستهلاك',
    auditAdjustmentLabel: 'تسوية المراجعة',
    scrapLabel: 'شطب',
    noResultsIconTitle: 'لا توجد نتائج',
    // Date shortcuts (AR)
    today: 'اليوم',
    yesterday: 'أمس',
    thisWeek: 'هذا الأسبوع',
    lastWeek: 'الأسبوع السابق',
    thisMonth: 'هذا الشهر',
    lastMonth: 'الشهر السابق',
    thisYear: 'هذه السنة',
    lastYear: 'السنة السابقة',
    // Common UI
    ui: {
        loading: 'جاري التحميل...',
        currentRequestEmpty: 'طلبك فارغ.',
        hideCompleted: 'إخفاء المكتمل',
        showCompleted: 'عرض المكتمل',
        rejected: 'مرفوض',
        cancel: 'إلغاء',
        discardDraft: 'حذف المسودة',
        saveChanges: 'حفظ التغييرات',
        availableInventory: 'المخزون المتاح',
        currentRequest: 'الطلب الحالي',
        generalNotes: 'ملاحظات عامة',
        addGeneralNotesPlaceholder: 'أضف أي ملاحظات عامة للطلب...',
        editMaterialRequest: 'تعديل طلب المواد',
        materialsApp: 'المواد',
        accommodationApp: 'الإسكان',
        theme: 'السمة',
        light: 'فاتح',
        dark: 'داكن',
        system: 'النظام',
        colorSettings: 'إعدادات الألوان',
        viewHistory: 'عرض السجل'
    },
    // Receive / Issue / Inventory labels (AR)
    reviewLabel: 'مراجعة',
    approveButton: 'الموافقة',
    receiveButton: 'استلام',
    materialsRequestsLabel: 'طلبات المواد (MR)',
    pendingMrvCardDescription: 'الطلبات في انتظار الموافقة أو القيد بالمخزون',
    approvedMrvsTitle: 'MRVs المعتمدة',
    approvedMrvsDescription: 'الإيصالات المسجلة في المخزون • انقر للطي/التوسيع',
    selectResidencePlaceholder: 'اختر سكنًا...',
    mivTitle: 'سند صرف مواد (MIV)',
    receiveMrvTitle: 'سند استلام مواد (MRV)',
    receiveMrvPageDescription: 'مراجعة طلبات MRV المعلقة واستلام الطلبات المعتمدة.',
    receiveMrvDescription: 'تأكيد الكميات المستلمة للطلب رقم #{id}',
    mivDescription: 'صرف المواد من مخزن السكن إلى المواقع المحددة.',
    viewHistoryLabel: 'عرض السجل',
    submitVoucher: 'إرسال السند',
    selectLocationAndItemsTitle: 'حدد الموقع والأصناف',
    selectLocationAndItemsDescription: 'أولاً، اختر الموقع. ثم أضف الأصناف من المخزون المتاح أدناه.',
    issueFromLabel: 'الصرف من:',
    locationTypeLabel: 'نوع الموقع',
    unitLabel: 'وحدة',
    facilityLabel: 'مرفق',
    noInventoryFound: 'لم يتم العثور على مخزون.',
    voucherEmptyMessage: 'لم تتم إضافة أصناف إلى السند بعد.',
    itemNameArLabel: 'الاسم العربي',
    itemNameEnLabel: 'الاسم الإنجليزي',
    categoryLabel: 'التصنيف',
    unitLabelShort: 'الوحدة',
    stockLabel: 'المخزون',
    actionsLabel: 'الإجراءات',
    noItemsWithStock: 'لا توجد أصناف بالمخزون في هذا السكن.',
    // Services / service orders in reports (AR)
    openServiceOrder: 'فتح أمر صيانة/خدمة',
    serviceFilterLabel: 'حركات الخدمة/الصيانة',
    serviceFilterAll: 'الكل',
    serviceFilterOnly: 'الخدمة فقط',
    serviceFilterExclude: 'استبعاد الخدمة',
    serviceDispatch: 'إرسال للخدمة',
    serviceReturn: 'عائد من الخدمة',
    serviceScrap: 'شطب بالخدمة'
};
const dictionaries = {
    en,
    ar
};
}),
"[project]/apps/accommodation/src/context/language-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LanguageProvider",
    ()=>LanguageProvider,
    "useLanguage",
    ()=>useLanguage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$dictionaries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/dictionaries.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const LanguageContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const LanguageProvider = ({ children })=>{
    // Initialize locale from localStorage if available (client-only)
    const [locale, setLocale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        try {
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        } catch  {}
        return 'en';
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        try {
            document.documentElement.lang = locale;
            document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
            // Set CSS variable for font
            const font = locale === 'ar' ? 'Tajawal' : 'Inter';
            document.documentElement.style.setProperty('--font-body', font);
            document.documentElement.style.setProperty('--font-headline', font);
            localStorage.setItem('locale', locale);
        } catch  {}
    }, [
        locale
    ]);
    const toggleLanguage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setLocale((prev)=>prev === 'ar' ? 'en' : 'ar');
    }, []);
    const value = {
        locale,
        setLocale,
        toggleLanguage,
        // Use fallback dictionary for unknown locales
        dict: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$dictionaries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dictionaries"][locale] || __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$dictionaries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dictionaries"].en
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguageContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/language-context.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useLanguage = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(LanguageContext);
    if (context === undefined) {
        // If a consumer accidentally calls useLanguage outside the provider,
        // return a safe fallback to avoid crashing the entire app (helps during
        // hydration/order-of-mount issues). Log a warning in dev so it can be fixed.
        if ("TURBOPACK compile-time truthy", 1) {
            // eslint-disable-next-line no-console
            console.warn('useLanguage was called outside of LanguageProvider — returning fallback dictionary. Wrap your tree with <LanguageProvider> to provide translations.');
        }
        return {
            locale: 'en',
            setLocale: ()=>{},
            toggleLanguage: ()=>{},
            dict: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$dictionaries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dictionaries"].en
        };
    }
    return context;
};
}),
"[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reducer",
    ()=>reducer,
    "toast",
    ()=>toast,
    "useToast",
    ()=>useToast
]);
// Inspired by react-hot-toast library
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    const [state, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](memoryState);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        listeners.push(setState);
        return ()=>{
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []); // register once; avoid re-adding on every state change
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
;
}),
"[project]/apps/accommodation/src/lib/db-api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bulkUpdateDocuments",
    ()=>bulkUpdateDocuments,
    "createDocument",
    ()=>createDocument,
    "deleteDocument",
    ()=>deleteDocument,
    "getDocument",
    ()=>getDocument,
    "listDocuments",
    ()=>listDocuments,
    "updateDocument",
    ()=>updateDocument
]);
const BASE_URL = '/api/db';
async function fetchJson(input, init) {
    const response = await fetch(input, {
        ...init,
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers ?? {}
        }
    });
    if (!response.ok) {
        const body = await response.text();
        let error = body;
        try {
            error = JSON.parse(body);
        } catch  {
            error = body;
        }
        throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }
    return response.json();
}
function buildQueryParams(options) {
    const params = new URLSearchParams();
    if (!options) return params;
    if (options.where?.length) {
        params.set('where', JSON.stringify(options.where));
    }
    if (options.orderBy) {
        params.set('orderBy', JSON.stringify(options.orderBy));
    }
    if (typeof options.limit === 'number') {
        params.set('limit', String(options.limit));
    }
    if (typeof options.offset === 'number') {
        params.set('offset', String(options.offset));
    }
    return params;
}
async function listDocuments(collection, options) {
    const params = buildQueryParams(options);
    const url = `${BASE_URL}/${encodeURIComponent(collection)}${params.toString() ? `?${params.toString()}` : ''}`;
    return fetchJson(url, {
        method: 'GET'
    });
}
async function getDocument(collection, id) {
    const url = `${BASE_URL}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
    return fetchJson(url, {
        method: 'GET'
    });
}
async function createDocument(collection, data) {
    const url = `${BASE_URL}/${encodeURIComponent(collection)}`;
    return fetchJson(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
async function updateDocument(collection, id, data) {
    const url = `${BASE_URL}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
    return fetchJson(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}
function chunkArray(items, chunkSize) {
    const chunks = [];
    for(let i = 0; i < items.length; i += chunkSize){
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
}
async function bulkUpdateDocuments(collection, items, chunkSize = 200) {
    const result = [];
    const chunks = chunkArray(items, chunkSize);
    for (const chunk of chunks){
        const url = `${BASE_URL}/bulk/${encodeURIComponent(collection)}`;
        const chunkResult = await fetchJson(url, {
            method: 'POST',
            body: JSON.stringify(chunk)
        });
        result.push(...chunkResult);
    }
    return result;
}
async function deleteDocument(collection, id) {
    const url = `${BASE_URL}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
    await fetchJson(url, {
        method: 'DELETE'
    });
}
}),
"[project]/apps/accommodation/src/context/users-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UsersProvider",
    ()=>UsersProvider,
    "useUsers",
    ()=>useUsers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/db-api.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const UsersContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";
const USERS_LOCAL_STORAGE_KEY = 'estatecare_users';
const loadUsersFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(USERS_LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to load users from localStorage', error);
        return [];
    }
};
const saveUsersToLocalStorage = (users)=>{
    try {
        localStorage.setItem(USERS_LOCAL_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
        console.error('Failed to save users to localStorage', error);
    }
};
const UsersProvider = ({ children })=>{
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentUser, setCurrentUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const isLoaded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const lastAuthUidRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const applyTheme = (theme)=>{
        const t = theme || {
            colorTheme: 'blue',
            mode: 'system'
        };
        try {
            localStorage.setItem('colorTheme', t.colorTheme);
            localStorage.setItem('themeMode', t.mode);
            window.dispatchEvent(new CustomEvent('userThemeChanged', {
                detail: t
            }));
        } catch  {}
    };
    const loadUsers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (isLoaded.current) return;
        isLoaded.current = true;
        setLoading(true);
        const fetchUsers = async ()=>{
            try {
                let usersList = [];
                try {
                    const usersData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listDocuments"])('users', {
                        orderBy: {
                            field: 'name',
                            direction: 'ASC'
                        }
                    });
                    usersList = usersData || [];
                } catch (error) {
                    const message = error?.message || String(error);
                    if (message.includes('D1 database not configured') || message.includes('database not configured')) {
                        console.warn('UsersContext: D1 database not configured; loading users from localStorage.');
                        usersList = loadUsersFromLocalStorage();
                    } else {
                        throw error;
                    }
                }
                const sessionRes = await fetch('/api/auth/me', {
                    credentials: 'include',
                    cache: 'no-store'
                }).catch(()=>null);
                setUsers(usersList);
                let activeUser = null;
                let sessionUser = null;
                if (sessionRes && sessionRes.ok) {
                    sessionUser = await sessionRes.json();
                }
                if (sessionUser) {
                    activeUser = usersList.find((u)=>u.id === sessionUser.id) || usersList.find((u)=>(u.email || '').toLowerCase() === (sessionUser.email || '').toLowerCase()) || null;
                }
                const storedUserId = localStorage.getItem('currentUser');
                const byStored = storedUserId ? usersList.find((u)=>u.id === storedUserId) : null;
                activeUser = activeUser || byStored || (sessionUser ? usersList[0] || null : null);
                if (!currentUser || activeUser && currentUser.id !== activeUser.id) {
                    setCurrentUser(activeUser);
                    if (activeUser) {
                        try {
                            localStorage.setItem('currentUser', activeUser.id);
                        } catch  {}
                        applyTheme(activeUser.themeSettings);
                    }
                }
            } catch (error) {
                const message = error?.message ?? String(error ?? '');
                if (typeof message === 'string' && message.includes('D1 database not configured')) {
                    console.warn('UsersContext: D1 database is not configured; skipping users fetch in this environment.');
                } else {
                    console.error('Error fetching users:', error);
                    toast({
                        title: 'Data Error',
                        description: 'Could not fetch users data.',
                        variant: 'destructive'
                    });
                }
            } finally{
                setLoading(false);
            }
        };
        fetchUsers();
        pollRef.current = window.setInterval(fetchUsers, 15000);
    }, [
        toast,
        currentUser
    ]);
    // Initialize users list depending on environment/auth
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadUsers();
        return ()=>{
            if (pollRef.current !== null) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
            }
            isLoaded.current = false;
        };
    }, [
        loadUsers
    ]);
    const normalizePassword = (value)=>{
        if (!value) return undefined;
        return value.replace(/[^\u0000-\u007F]/g, '').trim();
    };
    const saveUser = async (user)=>{
        const password = 'password' in user && typeof user.password === 'string' ? normalizePassword(user.password) : undefined;
        try {
            if ('id' in user && user.id) {
                const { id, password: _pass, ...payload } = user;
                const prevUser = users.find((u)=>u.id === id) || null;
                const prevAssigned = new Set(prevUser?.assignedResidences || []);
                const nextAssigned = new Set(payload.assignedResidences || []);
                const added = [];
                const removed = [];
                nextAssigned.forEach((rid)=>{
                    if (!prevAssigned.has(rid)) added.push(rid);
                });
                prevAssigned.forEach((rid)=>{
                    if (!nextAssigned.has(rid)) removed.push(rid);
                });
                try {
                    if (password) {
                        const res = await fetch('/api/admin/users/ensure', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                id,
                                name: payload.name,
                                email: payload.email,
                                role: payload.role,
                                assignedResidences: payload.assignedResidences,
                                themeSettings: payload.themeSettings,
                                password
                            })
                        });
                        if (!res.ok) {
                            const txt = await res.text();
                            throw new Error(txt || 'Failed to update user password');
                        }
                    } else {
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDocument"])('users', id, {
                            ...payload
                        });
                    }
                } catch (error) {
                    const message = error?.message || String(error);
                    if (message.includes('D1 database not configured') || message.includes('database not configured')) {
                        const nextUsers = users.map((u)=>u.id === id ? {
                                ...u,
                                ...payload
                            } : u);
                        setUsers(nextUsers);
                        saveUsersToLocalStorage(nextUsers);
                        toast({
                            title: 'Success',
                            description: 'User updated locally.'
                        });
                    } else {
                        throw error;
                    }
                }
                try {
                    for (const rid of added){
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDocument"])('residences', rid, {
                            managerId: id
                        });
                    }
                    for (const rid of removed){
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDocument"])('residences', rid, {
                            managerId: ''
                        });
                    }
                } catch (e) {
                    console.warn('Residences sync from user update failed:', e);
                }
                toast({
                    title: 'Success',
                    description: 'User updated successfully.'
                });
            } else {
                const payload = user;
                const emailKey = String(payload.email || '').trim().toLowerCase();
                if (!emailKey) throw new Error('Email is required');
                const res = await fetch('/api/admin/users/ensure', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        name: payload.name,
                        email: emailKey,
                        role: payload.role,
                        assignedResidences: payload.assignedResidences,
                        themeSettings: payload.themeSettings,
                        password
                    })
                });
                if (!res.ok) {
                    const txt = await res.text();
                    const errorText = txt || 'Failed to create user';
                    if (errorText.includes('D1 database not configured') || errorText.includes('database not configured')) {
                        const newUser = {
                            id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                            name: payload.name,
                            email: emailKey,
                            role: payload.role,
                            assignedResidences: payload.assignedResidences || [],
                            themeSettings: payload.themeSettings
                        };
                        const nextUsers = [
                            ...users,
                            newUser
                        ];
                        setUsers(nextUsers);
                        saveUsersToLocalStorage(nextUsers);
                        toast({
                            title: 'Success',
                            description: 'User created locally.'
                        });
                        return;
                    }
                    throw new Error(errorText);
                }
                toast({
                    title: 'Success',
                    description: 'User created successfully.'
                });
            }
        } catch (error) {
            console.error('Error saving user:', error);
            const msg = error?.message || 'Failed to save user.';
            toast({
                title: 'Error',
                description: msg,
                variant: 'destructive'
            });
        }
    };
    const deleteUser = async (id)=>{
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDocument"])('users', id);
            const nextUsers = users.filter((u)=>u.id !== id);
            setUsers(nextUsers);
            saveUsersToLocalStorage(nextUsers);
            toast({
                title: 'Success',
                description: 'User deleted successfully.'
            });
        } catch (error) {
            const message = error?.message || String(error);
            if (message.includes('D1 database not configured') || message.includes('database not configured')) {
                const nextUsers = users.filter((u)=>u.id !== id);
                setUsers(nextUsers);
                saveUsersToLocalStorage(nextUsers);
                toast({
                    title: 'Success',
                    description: 'User deleted locally.'
                });
                return;
            }
            console.error('Error deleting user:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete user.',
                variant: 'destructive'
            });
        }
    };
    const switchUser = (user)=>{
        // Retained for local mode or admin emulation flows; not used in header anymore.
        setCurrentUser(user);
        try {
            localStorage.setItem('currentUser', user.id);
        } catch  {}
        applyTheme(user.themeSettings);
        toast({
            title: 'Switched User',
            description: `You are now acting as ${user.name}.`
        });
    };
    const getUserById = (id)=>{
        if (!id) return null;
        // Try direct ID
        let u = users.find((user)=>user.id === id) || null;
        if (u) return u;
        // Fallback: if id looks like an email, match by email
        const looksLikeEmail = /@/.test(id);
        if (looksLikeEmail) {
            u = users.find((user)=>(user.email || '').toLowerCase() === id.toLowerCase()) || null;
            if (u) return u;
        }
        return null;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(UsersContext.Provider, {
        value: {
            users,
            currentUser,
            loading,
            loadUsers,
            saveUser,
            deleteUser,
            switchUser,
            getUserById
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/users-context.tsx",
        lineNumber: 328,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useUsers = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(UsersContext);
    if (context === undefined) {
        throw new Error('useUsers must be used within a UsersProvider');
    }
    return context;
};
}),
"[project]/apps/accommodation/src/components/layout/sidebar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppSidebar",
    ()=>AppSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building.js [app-ssr] (ecmascript) <export default as Building>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-ssr] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wrench.js [app-ssr] (ecmascript) <export default as Wrench>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clipboard-list.js [app-ssr] (ecmascript) <export default as ClipboardList>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Move$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/move.js [app-ssr] (ecmascript) <export default as Move>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2d$ordered$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ListOrdered$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/list-ordered.js [app-ssr] (ecmascript) <export default as ListOrdered>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$minus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardMinus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clipboard-minus.js [app-ssr] (ecmascript) <export default as ClipboardMinus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AreaChart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-area.js [app-ssr] (ecmascript) <export default as AreaChart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/history.js [app-ssr] (ecmascript) <export default as History>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PackageCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package-check.js [app-ssr] (ecmascript) <export default as PackageCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-ssr] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-check.js [app-ssr] (ecmascript) <export default as FileCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/git-branch.js [app-ssr] (ecmascript) <export default as GitBranch>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$life$2d$buoy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LifeBuoy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/life-buoy.js [app-ssr] (ecmascript) <export default as LifeBuoy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-ssr] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-ssr] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-ssr] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wallet.js [app-ssr] (ecmascript) <export default as Wallet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-ssr] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../ui/avatar'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/language-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/users-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
function AppSidebar() {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const { currentUser, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUsers"])();
    const { dict } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const [isMounted, setIsMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // const [gitInfo, setGitInfo] = useState<ReturnType<typeof getFormattedGitInfo> | null>(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setIsMounted(true);
    // setGitInfo(getFormattedGitInfo());
    }, []);
    // Prevent hydration mismatches by rendering only after mount
    if (!isMounted) {
        return null;
    }
    // When inside the accommodation app, render accommodation sidebar
    const isAccommodation = pathname?.startsWith('/accommodation');
    const isTimesheet = pathname?.startsWith('/timesheet');
    const isIncomeExpenses = pathname?.startsWith('/income-expenses');
    if (isTimesheet) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarHeader"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-1 p-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        className: "h-8 w-8 text-blue-600"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 50,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xl font-semibold text-blue-600 group-data-[collapsible=icon]:hidden",
                                        children: 'Timesheet'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 51,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 49,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-2 pb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                asChild: true,
                                tooltip: 'العودة للرئيسية',
                                className: "bg-muted/50 border border-border mt-2 w-full justify-start",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 59,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "group-data-[collapsible=icon]:hidden text-sm ml-2 mr-2",
                                            children: 'العودة للرئيسية'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 60,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 58,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 57,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 47,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarContent"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenu"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                        children: dict.sidebar?.main || 'Main'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 70,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/timesheet',
                                            tooltip: "Dashboard",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/timesheet",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 76,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: 'Records'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 77,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 75,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 74,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 83,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                        children: 'Management'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 87,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/timesheet/employees',
                                            tooltip: "Employees",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/timesheet/employees",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 93,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: 'Employees'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 94,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 92,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 91,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 90,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/timesheet/history',
                                            tooltip: "Monthly Archive",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/timesheet/history",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 103,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: 'Monthly Archive'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 104,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 102,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 101,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 100,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/timesheet/requests',
                                            tooltip: "Requests",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/timesheet/requests",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 113,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: 'Requests'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 114,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 112,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 111,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 110,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/timesheet/settings',
                                            tooltip: "Settings",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/timesheet/settings",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 123,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: 'Settings'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 124,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 122,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 121,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 120,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 130,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 86,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                        children: 'Leaves Management'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 135,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/timesheet/leaves',
                                            tooltip: "Leaves Management",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/timesheet/leaves",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 141,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: 'Leaves Management'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 142,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 140,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 139,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 138,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/timesheet/events',
                                            tooltip: "Leaves & Events",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/timesheet/events",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 151,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: 'Exceptions (Events)'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 152,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 150,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 149,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 148,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 68,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 67,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarFooter"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto p-2 border rounded-md",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Avatar, {
                                        className: "size-8",
                                        children: currentUser ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {
                                                children: currentUser.name?.charAt(0) || 'U'
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 169,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {}, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 172,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 166,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "group-data-[collapsible=icon]:hidden text-left",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-semibold text-sm",
                                                children: loading ? 'Loading...' : currentUser?.name
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 176,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-muted-foreground",
                                                children: loading ? '' : currentUser?.role
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 177,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 175,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 165,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 164,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 163,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 162,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true);
    }
    if (isIncomeExpenses) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarHeader"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1 p-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"], {
                                    className: "h-8 w-8 text-green-600"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 193,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xl font-semibold text-green-600 group-data-[collapsible=icon]:hidden",
                                    children: "Income & Exp"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 194,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 192,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 191,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 190,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarContent"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenu"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                    children: "Main"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 201,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                        asChild: true,
                                        isActive: pathname === '/income-expenses',
                                        tooltip: "Dashboard",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/income-expenses",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {}, void 0, false, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                    lineNumber: 207,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "group-data-[collapsible=icon]:hidden",
                                                    children: "Dashboard"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                    lineNumber: 208,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 206,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 205,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 204,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 200,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 199,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 198,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarFooter"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto p-2 border rounded-md",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Avatar, {
                                        className: "size-8",
                                        children: currentUser ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {
                                                children: currentUser.name?.charAt(0) || 'U'
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 222,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {}, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 225,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 219,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "group-data-[collapsible=icon]:hidden text-left",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-semibold text-sm",
                                                children: loading ? 'Loading...' : currentUser?.name
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 229,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-muted-foreground",
                                                children: loading ? '' : currentUser?.role
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 230,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 228,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 218,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 217,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 216,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 215,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true);
    }
    if (isAccommodation) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarHeader"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-1 p-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building$3e$__["Building"], {
                                        className: "h-8 w-8 text-amber-600"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 246,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xl font-semibold text-amber-600 group-data-[collapsible=icon]:hidden",
                                        children: "Accommodation"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 247,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 245,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 244,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-2 pb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                asChild: true,
                                tooltip: ("TURBOPACK compile-time truthy", 1) ? 'العودة للرئيسية' : "TURBOPACK unreachable",
                                className: "bg-muted/50 border border-border mt-2 w-full justify-start",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 253,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "group-data-[collapsible=icon]:hidden text-sm ml-2 mr-2",
                                            children: ("TURBOPACK compile-time truthy", 1) ? 'العودة للرئيسية' : "TURBOPACK unreachable"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 254,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 252,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 251,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 250,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 243,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarContent"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenu"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                        children: "Main"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 265,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/overview',
                                            tooltip: "Overview",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/overview",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 271,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Overview"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 272,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 270,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 269,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 268,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 276,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 264,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                        children: "Management"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 281,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/residences',
                                            tooltip: "Residences",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/residences",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building$3e$__["Building"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Residences"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 288,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 286,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 285,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 284,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/workers',
                                            tooltip: "Workers",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/workers",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 295,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Workers"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 296,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 294,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 293,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 292,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/assign',
                                            tooltip: "Assign Workers",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/assign",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Move$3e$__["Move"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 303,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Assign Workers"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 304,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 302,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 301,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 300,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/transfers',
                                            tooltip: "Transfers",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/transfers",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__["GitBranch"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 311,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Transfers"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 312,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 310,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 309,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 308,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/pending-transfers',
                                            tooltip: "Pending Transfers",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/pending-transfers",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 319,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Pending Transfers"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 320,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 318,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 317,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 316,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 324,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 280,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                        children: "Contracts & Billing"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 329,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/companies',
                                            tooltip: "Companies",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/companies",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building$3e$__["Building"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 335,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Companies"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 336,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 334,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 333,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 332,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/contracts',
                                            tooltip: "Contracts",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/contracts",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__["FileCheck"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 343,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Contracts"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 344,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 342,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 341,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 340,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/invoices',
                                            tooltip: "Invoices",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/invoices",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 351,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Invoices"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 352,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 350,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 349,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 348,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 356,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 328,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                        children: "Reports"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 361,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/reports',
                                            tooltip: "Reports",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/reports",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AreaChart$3e$__["AreaChart"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 367,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Reports"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 366,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 365,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 364,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/analytics',
                                            tooltip: dict.accommodationAnalytics || 'Accommodation Analytics',
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/analytics",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 375,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: dict.accommodationAnalytics || 'Accommodation Analytics'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 376,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 374,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 373,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 372,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                            asChild: true,
                                            isActive: pathname === '/accommodation/worker-certificate',
                                            tooltip: "Worker Certificate",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/accommodation/worker-certificate",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {}, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 383,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "group-data-[collapsible=icon]:hidden",
                                                        children: "Worker Certificate"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 384,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 382,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 381,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 380,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 360,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 262,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 261,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarFooter"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto p-2 border rounded-md",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Avatar, {
                                        className: "size-8",
                                        children: currentUser ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarImage, {
                                                    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'%3EIMG%3C/text%3E%3C/svg%3E",
                                                    alt: currentUser.name,
                                                    "data-ai-hint": "profile picture"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                    lineNumber: 398,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {
                                                    children: currentUser.name?.charAt(0) || 'U'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                    lineNumber: 399,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {}, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 402,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 395,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "group-data-[collapsible=icon]:hidden text-left",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-semibold text-sm",
                                                children: loading ? 'Loading...' : currentUser?.name
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 406,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-muted-foreground",
                                                children: loading ? '' : currentUser?.role
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 407,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 405,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 394,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 393,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 392,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 391,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true);
    }
    // Menu structure with groupings
    const menuStructure = [
        // Main Section
        {
            title: dict.sidebar?.main || 'Main',
            items: [
                {
                    href: '/',
                    label: dict.sidebar?.dashboard || 'Dashboard',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"]
                },
                // Moved Service Orders directly under Dashboard
                {
                    href: '/inventory/service-orders',
                    label: 'Service Orders',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__["GitBranch"]
                },
                // Single Maintenance entry (always internal)
                {
                    href: '/maintenance',
                    label: dict.sidebar?.maintenance || 'Maintenance',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__["Wrench"]
                }
            ]
        },
        // Stock Management Section
        {
            title: dict.sidebar?.stockManagement || 'Stock Management',
            items: [
                {
                    href: '/inventory',
                    label: dict.sidebar?.inventory || 'Inventory',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"],
                    exact: true
                },
                {
                    href: '/inventory/inventory-audit',
                    label: dict.sidebar?.stockReconciliation || 'Stock Reconciliation',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__["FileCheck"]
                },
                {
                    href: '/inventory/depreciation',
                    label: dict.sidebar?.depreciation || 'Depreciation',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"]
                },
                {
                    href: '/inventory/transfer',
                    label: dict.sidebar?.stockTransfer || 'Stock Transfer',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Move$3e$__["Move"]
                }
            ]
        },
        // Material Movement Section
        {
            title: dict.sidebar?.materialMovement || 'Material Movement',
            items: [
                {
                    href: '/inventory/orders',
                    label: dict.sidebar?.materialRequests || 'Material Requests',
                    abbreviation: ' (MR)',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2d$ordered$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ListOrdered$3e$__["ListOrdered"]
                },
                {
                    href: '/inventory/receive',
                    label: dict.sidebar?.receiveMaterials || 'Receive Materials',
                    abbreviation: ' (MRV)',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PackageCheck$3e$__["PackageCheck"]
                },
                {
                    href: '/inventory/issue',
                    label: dict.sidebar?.issueMaterials || 'Issue Materials',
                    abbreviation: ' (MIV)',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$minus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardMinus$3e$__["ClipboardMinus"],
                    exact: true
                },
                {
                    href: '/inventory/request-issue',
                    label: 'Request + Issue (Beta)',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PackageCheck$3e$__["PackageCheck"]
                }
            ]
        },
        // Reports Section
        {
            title: dict.sidebar?.reports || 'Reports',
            items: [
                {
                    href: '/reports',
                    label: dict.sidebar?.reports || 'Reports',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AreaChart$3e$__["AreaChart"]
                },
                {
                    href: '/inventory/orders/analytics',
                    label: dict.ordersAnalytics || 'Material Requests Analytics',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
                }
            ],
            subItems: [
                {
                    href: '/inventory/reports/stock-movement',
                    label: dict.sidebar?.stockMovementReport || 'Stock Movement Report',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
                },
                {
                    href: '/inventory/reports/lifespan',
                    label: dict.sidebar?.lifespanReport || 'Lifespan Report',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"]
                },
                {
                    href: '/inventory/reports/reconciliations',
                    label: dict.sidebar?.reconciliations || 'Reconciliations',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__["FileCheck"]
                }
            ]
        },
        // Other Apps / Modules Section
        {
            title: 'Apps & Modules',
            items: [
                {
                    href: '/accommodation',
                    label: 'Accommodation',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building$3e$__["Building"]
                },
                {
                    href: '/timesheet',
                    label: 'Timesheet (سجل الدوام)',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"]
                },
                {
                    href: '#income-expenses',
                    label: 'Income & Expenses (قريباً)',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"]
                }
            ]
        },
        // Settings Section
        {
            title: dict.sidebar?.settings || 'Settings',
            items: [
                {
                    href: '/residences',
                    label: dict.sidebar?.residences || 'Residences',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building$3e$__["Building"]
                },
                ...currentUser?.role === 'Admin' ? [
                    {
                        href: '/users',
                        label: dict.sidebar?.users || 'Users',
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"]
                    },
                    {
                        href: '/setup',
                        label: dict.sidebar?.setup || 'Setup',
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
                    }
                ] : []
            ]
        },
        // Feedback Section
        {
            title: dict.feedback || 'Feedback',
            items: [
                {
                    href: '/feedback',
                    label: dict.myFeedback || 'My Feedback',
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$life$2d$buoy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LifeBuoy$3e$__["LifeBuoy"]
                },
                ...currentUser?.role === 'Admin' ? [
                    {
                        href: '/admin/feedback',
                        label: dict.feedbackBoard || 'Feedback Board',
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"]
                    },
                    {
                        href: '/admin/feedback/stats',
                        label: dict.feedbackAnalytics || 'Feedback Analytics',
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AreaChart$3e$__["AreaChart"]
                    }
                ] : []
            ]
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarHeader"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-1 p-2",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building$3e$__["Building"], {
                                className: "h-8 w-8 text-primary"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 518,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xl font-semibold group-data-[collapsible=icon]:hidden",
                                children: "EstateCare"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                lineNumber: 519,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 517,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 516,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                lineNumber: 515,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarContent"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenu"], {
                    children: menuStructure.map((section, sectionIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden",
                                    children: section.title
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 529,
                                    columnNumber: 15
                                }, this),
                                section.items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuItem"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuButton"], {
                                                asChild: true,
                                                isActive: item.exact ? pathname === item.href : pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/'),
                                                tooltip: item.label,
                                                children: item.external ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: item.href,
                                                    target: "_blank",
                                                    rel: "noopener noreferrer",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {}, void 0, false, {
                                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                            lineNumber: 543,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "group-data-[collapsible=icon]:hidden",
                                                            children: [
                                                                item.label,
                                                                item.abbreviation || ''
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                            lineNumber: 544,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                    lineNumber: 542,
                                                    columnNumber: 23
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: item.href,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {}, void 0, false, {
                                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                            lineNumber: 548,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "group-data-[collapsible=icon]:hidden",
                                                            children: [
                                                                item.label,
                                                                item.abbreviation || ''
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                            lineNumber: 549,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                    lineNumber: 547,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 536,
                                                columnNumber: 19
                                            }, this),
                                            item.href === '/reports' && section.subItems && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuSub"], {
                                                children: section.subItems.map((subItem)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuSubItem"], {
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarMenuSubButton"], {
                                                            asChild: true,
                                                            isActive: pathname === subItem.href,
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                href: subItem.href,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(subItem.icon, {}, void 0, false, {
                                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                                        lineNumber: 561,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "group-data-[collapsible=icon]:hidden",
                                                                        children: subItem.label
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                                        lineNumber: 562,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                                lineNumber: 560,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                            lineNumber: 559,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, subItem.href, false, {
                                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                        lineNumber: 558,
                                                        columnNumber: 25
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 556,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, item.href, true, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 535,
                                        columnNumber: 17
                                    }, this)),
                                sectionIndex < menuStructure.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-2"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 574,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, `section-${sectionIndex}`, true, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 527,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 525,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                lineNumber: 524,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarFooter"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-2",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto p-2 border rounded-md",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Avatar, {
                                    className: "size-8",
                                    children: currentUser ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarImage, {
                                                src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'%3EIMG%3C/text%3E%3C/svg%3E",
                                                alt: currentUser.name,
                                                "data-ai-hint": "profile picture"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 587,
                                                columnNumber: 27
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {
                                                children: currentUser.name?.charAt(0) || 'U'
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                                lineNumber: 588,
                                                columnNumber: 27
                                            }, this)
                                        ]
                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AvatarFallback, {}, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                        lineNumber: 591,
                                        columnNumber: 25
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 584,
                                    columnNumber: 22
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group-data-[collapsible=icon]:hidden text-left",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-semibold text-sm",
                                            children: loading ? 'Loading...' : currentUser?.name
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 595,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-muted-foreground",
                                            children: loading ? '' : currentUser?.role
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                            lineNumber: 596,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                                    lineNumber: 594,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                            lineNumber: 583,
                            columnNumber: 18
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                        lineNumber: 582,
                        columnNumber: 14
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                    lineNumber: 581,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/accommodation/src/components/layout/sidebar.tsx",
                lineNumber: 580,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/packages/ui/src/components/ui/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/button.tsx",
        lineNumber: 46,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
Button.displayName = "Button";
;
}),
"[project]/packages/ui/src/components/ui/dropdown-menu.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DropdownMenu",
    ()=>DropdownMenu,
    "DropdownMenuCheckboxItem",
    ()=>DropdownMenuCheckboxItem,
    "DropdownMenuContent",
    ()=>DropdownMenuContent,
    "DropdownMenuGroup",
    ()=>DropdownMenuGroup,
    "DropdownMenuItem",
    ()=>DropdownMenuItem,
    "DropdownMenuLabel",
    ()=>DropdownMenuLabel,
    "DropdownMenuPortal",
    ()=>DropdownMenuPortal,
    "DropdownMenuRadioGroup",
    ()=>DropdownMenuRadioGroup,
    "DropdownMenuRadioItem",
    ()=>DropdownMenuRadioItem,
    "DropdownMenuSeparator",
    ()=>DropdownMenuSeparator,
    "DropdownMenuShortcut",
    ()=>DropdownMenuShortcut,
    "DropdownMenuSub",
    ()=>DropdownMenuSub,
    "DropdownMenuSubContent",
    ()=>DropdownMenuSubContent,
    "DropdownMenuSubTrigger",
    ()=>DropdownMenuSubTrigger,
    "DropdownMenuTrigger",
    ()=>DropdownMenuTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-ssr] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const DropdownMenu = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"];
const DropdownMenuTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"];
const DropdownMenuGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"];
const DropdownMenuPortal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"];
const DropdownMenuSub = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sub"];
const DropdownMenuRadioGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioGroup"];
const DropdownMenuSubTrigger = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, inset, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubTrigger"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(// Glassy highlight on focus/open
        "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none", "focus:bg-white/50 data-[state=open]:bg-white/50 dark:focus:bg-white/10 dark:data-[state=open]:bg-white/10", "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
        ...props,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                className: "ml-auto"
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
                lineNumber: 40,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 27,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuSubTrigger.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubTrigger"].displayName;
const DropdownMenuSubContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubContent"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(// Glassmorphism dropdown surface
        "z-50 min-w-[8rem] overflow-hidden rounded-lg border p-1 text-popover-foreground shadow-lg backdrop-blur-xl", // Translucent backgrounds for light/dark (match Card)
        "bg-white/40 border-white/20 dark:bg-white/5 dark:border-white/5", // Animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 50,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuSubContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SubContent"].displayName;
const DropdownMenuContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, sideOffset = 4, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
            ref: ref,
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(// Glassmorphism menu surface
            "z-50 min-w-[8rem] overflow-hidden rounded-lg border p-1 text-popover-foreground shadow-lg backdrop-blur-xl", // Translucent backgrounds for light/dark (match Card)
            "bg-white/40 border-white/20 dark:bg-white/5 dark:border-white/5", // Animations
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
            ...props
        }, void 0, false, {
            fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
            lineNumber: 72,
            columnNumber: 3
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 71,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"].displayName;
const DropdownMenuItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, inset, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Item"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(// Glassy item highlight
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors", "focus:bg-white/50 dark:focus:bg-white/10", "data-[disabled]:pointer-events-none data-[disabled]:opacity-50", "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 96,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Item"].displayName;
const DropdownMenuCheckboxItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, children, checked, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CheckboxItem"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors", "focus:bg-white/50 dark:focus:bg-white/10", "data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        checked: checked,
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ItemIndicator"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
                    lineNumber: 128,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
                lineNumber: 127,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 116,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuCheckboxItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CheckboxItem"].displayName;
const DropdownMenuRadioItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioItem"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors", "focus:bg-white/50 dark:focus:bg-white/10", "data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ItemIndicator"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
                        className: "h-2 w-2 fill-current"
                    }, void 0, false, {
                        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
                        lineNumber: 154,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
                    lineNumber: 153,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
                lineNumber: 152,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 142,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuRadioItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioItem"].displayName;
const DropdownMenuLabel = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, inset, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 168,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuLabel.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"].displayName;
const DropdownMenuSeparator = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Separator"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("-mx-1 my-1 h-px bg-white/30 dark:bg-white/10", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 184,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
DropdownMenuSeparator.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Separator"].displayName;
const DropdownMenuShortcut = ({ className, ...props })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("ml-auto text-xs tracking-widest opacity-60", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/dropdown-menu.tsx",
        lineNumber: 197,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
;
}),
"[project]/packages/ui/src/components/ui/avatar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Avatar",
    ()=>Avatar,
    "AvatarFallback",
    ()=>AvatarFallback,
    "AvatarImage",
    ()=>AvatarImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-avatar/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const Avatar = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/avatar.tsx",
        lineNumber: 12,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
Avatar.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"].displayName;
const AvatarImage = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Image"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("aspect-square h-full w-full", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/avatar.tsx",
        lineNumber: 27,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
AvatarImage.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Image"].displayName;
const AvatarFallback = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fallback"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/avatar.tsx",
        lineNumber: 39,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
AvatarFallback.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fallback"].displayName;
;
}),
"[project]/apps/accommodation/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "includesNormalized",
    ()=>includesNormalized,
    "normalizeArabic",
    ()=>normalizeArabic,
    "normalizeText",
    ()=>normalizeText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function normalizeArabic(input) {
    if (!input) return '';
    let s = input.normalize('NFKC');
    // Remove diacritics (harakat)
    s = s.replace(/[\u064B-\u065F\u0670\u0674\u06D6-\u06ED]/g, '');
    // Remove tatweel/kashida
    s = s.replace(/[\u0640]/g, '');
    // Normalize alef forms to ا
    s = s.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');
    // Normalize ya/hamza seats
    s = s.replace(/[\u0649\u0626]/g, '\u064A');
    // Normalize taa marbuta to haa for loose matching (حنفية vs حنفيه)
    s = s.replace(/\u0629/g, '\u0647');
    // Normalize kaf/keheh
    s = s.replace(/[\u06A9]/g, '\u0643');
    // Remove non-letters/digits except spaces
    s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
    // Collapse spaces and lowercase
    s = s.replace(/\s+/g, ' ').trim().toLowerCase();
    return s;
}
function normalizeText(input) {
    if (!input) return '';
    // Try Arabic normalization first; fallback to lowercase for non-Arabic
    const ar = normalizeArabic(input);
    if (ar) return ar;
    return String(input).toLowerCase();
}
function includesNormalized(haystack, needle) {
    const h = normalizeText(haystack);
    const n = normalizeText(needle);
    return h.includes(n);
}
}),
"[project]/apps/accommodation/src/context/notifications-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NotificationsProvider",
    ()=>NotificationsProvider,
    "useNotifications",
    ()=>useNotifications
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/db-api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/users-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function toDate(value) {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (typeof value?.toDate === 'function') return value.toDate();
    return new Date(String(value));
}
const NotificationsContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const firebaseErrorMessage = "Error: Firebase is not configured.";
const NotificationsProvider = ({ children })=>{
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const { currentUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUsers"])();
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!currentUser?.id) {
            setNotifications([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        let cancelled = false;
        const loadNotifications = async ()=>{
            try {
                const authEmail = currentUser.email?.toLowerCase() || null;
                const authUid = currentUser.id;
                const rows = [];
                if (authEmail) {
                    const emailRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listDocuments"])('notifications', {
                        where: [
                            {
                                field: 'userEmail',
                                op: '=',
                                value: authEmail
                            }
                        ],
                        orderBy: {
                            field: 'createdAt',
                            direction: 'DESC'
                        }
                    });
                    rows.push(...emailRows);
                }
                if (authUid) {
                    const uidRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listDocuments"])('notifications', {
                        where: [
                            {
                                field: 'userId',
                                op: '=',
                                value: authUid
                            }
                        ],
                        orderBy: {
                            field: 'createdAt',
                            direction: 'DESC'
                        }
                    });
                    rows.push(...uidRows);
                }
                if (cancelled) return;
                const mergedMap = new Map();
                for (const row of rows){
                    mergedMap.set(row.id, {
                        ...row,
                        createdAt: toDate(row.createdAt)
                    });
                }
                const merged = Array.from(mergedMap.values()).sort((a, b)=>toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
                setNotifications(merged);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                toast({
                    title: 'Data Error',
                    description: 'Could not fetch notifications.',
                    variant: 'destructive'
                });
                setNotifications([]);
            } finally{
                if (!cancelled) setLoading(false);
            }
        };
        loadNotifications();
        return ()=>{
            cancelled = true;
        };
    }, [
        currentUser,
        toast
    ]);
    const addNotification = async (payload)=>{
        if (!currentUser?.id) {
            console.warn('Cannot add notification without current user');
            return;
        }
        try {
            let userEmail = payload.userEmail || null;
            if (!userEmail) {
                const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocument"])('users', payload.userId);
                userEmail = user?.email ? String(user.email).toLowerCase() : null;
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createDocument"])('notifications', {
                ...payload,
                isRead: false,
                createdAt: new Date().toISOString(),
                userEmail: userEmail || null
            });
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    };
    const markAsRead = async (notificationId)=>{
        if (!notificationId) return;
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDocument"])('notifications', notificationId, {
                isRead: true
            });
            setNotifications((prev)=>prev.map((n)=>n.id === notificationId ? {
                        ...n,
                        isRead: true
                    } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };
    const markAllAsRead = async ()=>{
        const unreadNotifications = notifications.filter((n)=>!n.isRead);
        if (unreadNotifications.length === 0) return;
        try {
            await Promise.all(unreadNotifications.map((n)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$db$2d$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDocument"])('notifications', n.id, {
                    isRead: true
                })));
            setNotifications((prev)=>prev.map((n)=>({
                        ...n,
                        isRead: true
                    })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NotificationsContext.Provider, {
        value: {
            notifications,
            loading,
            addNotification,
            markAsRead,
            markAllAsRead
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/notifications-context.tsx",
        lineNumber: 172,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useNotifications = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
};
}),
"[project]/apps/accommodation/src/lib/themes.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyTheme",
    ()=>applyTheme,
    "colorThemes",
    ()=>colorThemes,
    "getTheme",
    ()=>getTheme
]);
const colorThemes = [
    {
        id: 'blue',
        name: 'blue',
        displayName: 'الأزرق الكلاسيكي',
        description: 'الثيم الافتراضي الهادئ والمريح للعين',
        preview: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#0ea5e9'
        },
        light: {
            primary: '217 91% 60%',
            primaryForeground: '210 40% 98%',
            secondary: '240 5% 96%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '240 5% 90%',
            accentForeground: '222.2 47.4% 11.2%',
            background: '240 10% 99%',
            foreground: '222.2 84% 4.9%',
            card: '255 100% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '240 6% 90%',
            input: '240 6% 90%',
            ring: '217 91% 60%',
            muted: '240 5% 96%',
            mutedForeground: '215.4 16.3% 46.9%',
            destructive: '0 84.2% 60.2%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '240 10% 99%',
                foreground: '222.2 84% 4.9%',
                primary: '217 91% 60%',
                primaryForeground: '210 40% 98%',
                accent: '240 5% 90%',
                accentForeground: '222.2 47.4% 11.2%',
                border: '240 6% 90%',
                ring: '217 91% 60%'
            }
        },
        dark: {
            primary: '217 91% 60%',
            primaryForeground: '210 40% 98%',
            secondary: '217.2 32.6% 17.5%',
            secondaryForeground: '210 40% 98%',
            accent: '217.2 32.6% 17.5%',
            accentForeground: '210 40% 98%',
            background: '222 47% 11%',
            foreground: '210 40% 98%',
            card: '222 47% 11%',
            cardForeground: '210 40% 98%',
            border: '217.2 32.6% 17.5%',
            input: '217.2 32.6% 17.5%',
            ring: '217 91% 60%',
            muted: '217.2 32.6% 17.5%',
            mutedForeground: '215 20.2% 65.1%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '224 71% 4%',
                foreground: '210 40% 98%',
                primary: '217 91% 60%',
                primaryForeground: '210 40% 98%',
                accent: '217.2 32.6% 17.5%',
                accentForeground: '210 40% 98%',
                border: '217.2 32.6% 17.5%',
                ring: '217.2 91.2% 59.8%'
            }
        }
    },
    {
        id: 'emerald',
        name: 'emerald',
        displayName: 'الأخضر الزمردي',
        description: 'ثيم طبيعي يبعث على الراحة والهدوء',
        preview: {
            primary: '#10b981',
            secondary: '#6b7280',
            accent: '#059669'
        },
        light: {
            primary: '160 84% 39%',
            primaryForeground: '210 40% 98%',
            secondary: '240 5% 96%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '142 76% 36%',
            accentForeground: '210 40% 98%',
            background: '138 76% 97%',
            foreground: '222.2 84% 4.9%',
            card: '255 100% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '142 76% 88%',
            input: '142 76% 88%',
            ring: '160 84% 39%',
            muted: '142 76% 92%',
            mutedForeground: '215.4 16.3% 46.9%',
            destructive: '0 84.2% 60.2%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '138 76% 97%',
                foreground: '222.2 84% 4.9%',
                primary: '160 84% 39%',
                primaryForeground: '210 40% 98%',
                accent: '142 76% 88%',
                accentForeground: '222.2 47.4% 11.2%',
                border: '142 76% 88%',
                ring: '160 84% 39%'
            }
        },
        dark: {
            primary: '160 84% 39%',
            primaryForeground: '210 40% 98%',
            secondary: '155 7.7% 15.3%',
            secondaryForeground: '210 40% 98%',
            accent: '155 7.7% 15.3%',
            accentForeground: '210 40% 98%',
            background: '160 21% 8%',
            foreground: '210 40% 98%',
            card: '160 21% 8%',
            cardForeground: '210 40% 98%',
            border: '155 7.7% 15.3%',
            input: '155 7.7% 15.3%',
            ring: '160 84% 39%',
            muted: '155 7.7% 15.3%',
            mutedForeground: '215 20.2% 65.1%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '160 28% 4%',
                foreground: '210 40% 98%',
                primary: '160 84% 39%',
                primaryForeground: '210 40% 98%',
                accent: '155 7.7% 15.3%',
                accentForeground: '210 40% 98%',
                border: '155 7.7% 15.3%',
                ring: '160 84% 39%'
            }
        }
    },
    {
        id: 'purple',
        name: 'purple',
        displayName: 'البنفسجي الملكي',
        description: 'ثيم أنيق يضفي لمسة من الفخامة',
        preview: {
            primary: '#8b5cf6',
            secondary: '#6b7280',
            accent: '#7c3aed'
        },
        light: {
            primary: '258 90% 66%',
            primaryForeground: '210 40% 98%',
            secondary: '240 5% 96%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '262 83% 58%',
            accentForeground: '210 40% 98%',
            background: '258 100% 99%',
            foreground: '222.2 84% 4.9%',
            card: '255 100% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '258 100% 92%',
            input: '258 100% 92%',
            ring: '258 90% 66%',
            muted: '258 100% 96%',
            mutedForeground: '215.4 16.3% 46.9%',
            destructive: '0 84.2% 60.2%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '258 100% 99%',
                foreground: '222.2 84% 4.9%',
                primary: '258 90% 66%',
                primaryForeground: '210 40% 98%',
                accent: '258 100% 92%',
                accentForeground: '222.2 47.4% 11.2%',
                border: '258 100% 92%',
                ring: '258 90% 66%'
            }
        },
        dark: {
            primary: '258 90% 66%',
            primaryForeground: '210 40% 98%',
            secondary: '263 3.3% 17.1%',
            secondaryForeground: '210 40% 98%',
            accent: '263 3.3% 17.1%',
            accentForeground: '210 40% 98%',
            background: '263 15% 8%',
            foreground: '210 40% 98%',
            card: '263 15% 8%',
            cardForeground: '210 40% 98%',
            border: '263 3.3% 17.1%',
            input: '263 3.3% 17.1%',
            ring: '258 90% 66%',
            muted: '263 3.3% 17.1%',
            mutedForeground: '215 20.2% 65.1%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '263 25% 4%',
                foreground: '210 40% 98%',
                primary: '258 90% 66%',
                primaryForeground: '210 40% 98%',
                accent: '263 3.3% 17.1%',
                accentForeground: '210 40% 98%',
                border: '263 3.3% 17.1%',
                ring: '258 90% 66%'
            }
        }
    },
    {
        id: 'orange',
        name: 'orange',
        displayName: 'البرتقالي الدافئ',
        description: 'ثيم حيوي ينشط ويحفز الإبداع',
        preview: {
            primary: '#f97316',
            secondary: '#6b7280',
            accent: '#ea580c'
        },
        light: {
            primary: '24 95% 53%',
            primaryForeground: '210 40% 98%',
            secondary: '240 5% 96%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '20 91% 48%',
            accentForeground: '210 40% 98%',
            background: '33 100% 98%',
            foreground: '222.2 84% 4.9%',
            card: '255 100% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '33 100% 90%',
            input: '33 100% 90%',
            ring: '24 95% 53%',
            muted: '33 100% 94%',
            mutedForeground: '215.4 16.3% 46.9%',
            destructive: '0 84.2% 60.2%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '33 100% 98%',
                foreground: '222.2 84% 4.9%',
                primary: '24 95% 53%',
                primaryForeground: '210 40% 98%',
                accent: '33 100% 90%',
                accentForeground: '222.2 47.4% 11.2%',
                border: '33 100% 90%',
                ring: '24 95% 53%'
            }
        },
        dark: {
            primary: '24 95% 53%',
            primaryForeground: '210 40% 98%',
            secondary: '33 3.3% 15.7%',
            secondaryForeground: '210 40% 98%',
            accent: '33 3.3% 15.7%',
            accentForeground: '210 40% 98%',
            background: '33 15% 7%',
            foreground: '210 40% 98%',
            card: '33 15% 7%',
            cardForeground: '210 40% 98%',
            border: '33 3.3% 15.7%',
            input: '33 3.3% 15.7%',
            ring: '24 95% 53%',
            muted: '33 3.3% 15.7%',
            mutedForeground: '215 20.2% 65.1%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '33 25% 3%',
                foreground: '210 40% 98%',
                primary: '24 95% 53%',
                primaryForeground: '210 40% 98%',
                accent: '33 3.3% 15.7%',
                accentForeground: '210 40% 98%',
                border: '33 3.3% 15.7%',
                ring: '24 95% 53%'
            }
        }
    },
    {
        id: 'rose',
        name: 'rose',
        displayName: 'الوردي الأنيق',
        description: 'ثيم رقيق يضفي لمسة أنثوية راقية',
        preview: {
            primary: '#f43f5e',
            secondary: '#6b7280',
            accent: '#e11d48'
        },
        light: {
            primary: '347 77% 50%',
            primaryForeground: '210 40% 98%',
            secondary: '240 5% 96%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '346 87% 43%',
            accentForeground: '210 40% 98%',
            background: '347 77% 98%',
            foreground: '222.2 84% 4.9%',
            card: '255 100% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '347 77% 90%',
            input: '347 77% 90%',
            ring: '347 77% 50%',
            muted: '347 77% 94%',
            mutedForeground: '215.4 16.3% 46.9%',
            destructive: '0 84.2% 60.2%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '347 77% 98%',
                foreground: '222.2 84% 4.9%',
                primary: '347 77% 50%',
                primaryForeground: '210 40% 98%',
                accent: '347 77% 90%',
                accentForeground: '222.2 47.4% 11.2%',
                border: '347 77% 90%',
                ring: '347 77% 50%'
            }
        },
        dark: {
            primary: '347 77% 50%',
            primaryForeground: '210 40% 98%',
            secondary: '347 3.3% 15.7%',
            secondaryForeground: '210 40% 98%',
            accent: '347 3.3% 15.7%',
            accentForeground: '210 40% 98%',
            background: '347 15% 7%',
            foreground: '210 40% 98%',
            card: '347 15% 7%',
            cardForeground: '210 40% 98%',
            border: '347 3.3% 15.7%',
            input: '347 3.3% 15.7%',
            ring: '347 77% 50%',
            muted: '347 3.3% 15.7%',
            mutedForeground: '215 20.2% 65.1%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '347 25% 3%',
                foreground: '210 40% 98%',
                primary: '347 77% 50%',
                primaryForeground: '210 40% 98%',
                accent: '347 3.3% 15.7%',
                accentForeground: '210 40% 98%',
                border: '347 3.3% 15.7%',
                ring: '347 77% 50%'
            }
        }
    },
    {
        id: 'teal',
        name: 'teal',
        displayName: 'التيل المهدئ',
        description: 'ثيم مريح يجمع بين الأزرق والأخضر',
        preview: {
            primary: '#14b8a6',
            secondary: '#6b7280',
            accent: '#0f766e'
        },
        light: {
            primary: '173 80% 40%',
            primaryForeground: '210 40% 98%',
            secondary: '240 5% 96%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '175 84% 32%',
            accentForeground: '210 40% 98%',
            background: '173 80% 98%',
            foreground: '222.2 84% 4.9%',
            card: '255 100% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '173 80% 90%',
            input: '173 80% 90%',
            ring: '173 80% 40%',
            muted: '173 80% 94%',
            mutedForeground: '215.4 16.3% 46.9%',
            destructive: '0 84.2% 60.2%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '173 80% 98%',
                foreground: '222.2 84% 4.9%',
                primary: '173 80% 40%',
                primaryForeground: '210 40% 98%',
                accent: '173 80% 90%',
                accentForeground: '222.2 47.4% 11.2%',
                border: '173 80% 90%',
                ring: '173 80% 40%'
            }
        },
        dark: {
            primary: '173 80% 40%',
            primaryForeground: '210 40% 98%',
            secondary: '173 3.3% 15.7%',
            secondaryForeground: '210 40% 98%',
            accent: '173 3.3% 15.7%',
            accentForeground: '210 40% 98%',
            background: '173 15% 7%',
            foreground: '210 40% 98%',
            card: '173 15% 7%',
            cardForeground: '210 40% 98%',
            border: '173 3.3% 15.7%',
            input: '173 3.3% 15.7%',
            ring: '173 80% 40%',
            muted: '173 3.3% 15.7%',
            mutedForeground: '215 20.2% 65.1%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '173 25% 3%',
                foreground: '210 40% 98%',
                primary: '173 80% 40%',
                primaryForeground: '210 40% 98%',
                accent: '173 3.3% 15.7%',
                accentForeground: '210 40% 98%',
                border: '173 3.3% 15.7%',
                ring: '173 80% 40%'
            }
        }
    },
    {
        id: 'indigo',
        name: 'indigo',
        displayName: 'النيلي العميق',
        description: 'ثيم عميق يبعث على التركيز والهدوء',
        preview: {
            primary: '#6366f1',
            secondary: '#6b7280',
            accent: '#4f46e5'
        },
        light: {
            primary: '239 84% 67%',
            primaryForeground: '210 40% 98%',
            secondary: '240 5% 96%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '243 75% 59%',
            accentForeground: '210 40% 98%',
            background: '239 84% 98%',
            foreground: '222.2 84% 4.9%',
            card: '255 100% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '239 84% 90%',
            input: '239 84% 90%',
            ring: '239 84% 67%',
            muted: '239 84% 94%',
            mutedForeground: '215.4 16.3% 46.9%',
            destructive: '0 84.2% 60.2%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '239 84% 98%',
                foreground: '222.2 84% 4.9%',
                primary: '239 84% 67%',
                primaryForeground: '210 40% 98%',
                accent: '239 84% 90%',
                accentForeground: '222.2 47.4% 11.2%',
                border: '239 84% 90%',
                ring: '239 84% 67%'
            }
        },
        dark: {
            primary: '239 84% 67%',
            primaryForeground: '210 40% 98%',
            secondary: '239 3.3% 15.7%',
            secondaryForeground: '210 40% 98%',
            accent: '239 3.3% 15.7%',
            accentForeground: '210 40% 98%',
            background: '239 15% 7%',
            foreground: '210 40% 98%',
            card: '239 15% 7%',
            cardForeground: '210 40% 98%',
            border: '239 3.3% 15.7%',
            input: '239 3.3% 15.7%',
            ring: '239 84% 67%',
            muted: '239 3.3% 15.7%',
            mutedForeground: '215 20.2% 65.1%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            sidebar: {
                background: '239 25% 3%',
                foreground: '210 40% 98%',
                primary: '239 84% 67%',
                primaryForeground: '210 40% 98%',
                accent: '239 3.3% 15.7%',
                accentForeground: '210 40% 98%',
                border: '239 3.3% 15.7%',
                ring: '239 84% 67%'
            }
        }
    }
];
function getTheme(themeId) {
    return colorThemes.find((theme)=>theme.id === themeId) || colorThemes[0];
}
function applyTheme(themeId, mode) {
    const theme = getTheme(themeId);
    const colors = theme[mode];
    const root = document.documentElement;
    // Apply CSS custom properties
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.input);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--destructive', colors.destructive);
    root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
    // Apply sidebar colors
    root.style.setProperty('--sidebar-background', colors.sidebar.background);
    root.style.setProperty('--sidebar-foreground', colors.sidebar.foreground);
    root.style.setProperty('--sidebar-primary', colors.sidebar.primary);
    root.style.setProperty('--sidebar-primary-foreground', colors.sidebar.primaryForeground);
    root.style.setProperty('--sidebar-accent', colors.sidebar.accent);
    root.style.setProperty('--sidebar-accent-foreground', colors.sidebar.accentForeground);
    root.style.setProperty('--sidebar-border', colors.sidebar.border);
    root.style.setProperty('--sidebar-ring', colors.sidebar.ring);
}
}),
"[project]/apps/accommodation/src/components/theme-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider,
    "useTheme",
    ()=>useTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$themes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/themes.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function ThemeProvider({ children }) {
    const [colorTheme, setColorThemeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('blue');
    const [mode, setModeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('system');
    const [resolvedMode, setResolvedMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('dark');
    const [isLoaded, setIsLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const updateResolvedMode = (currentMode)=>{
        let resolved;
        if (currentMode === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            resolved = currentMode;
        }
        setResolvedMode(resolved);
        // Apply theme classes
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
        return resolved;
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Get theme settings from localStorage
        const storedColorTheme = localStorage.getItem('colorTheme') || 'blue';
        const storedMode = localStorage.getItem('themeMode') || 'system';
        setColorThemeState(storedColorTheme);
        setModeState(storedMode);
        const resolved = updateResolvedMode(storedMode);
        // Apply the theme immediately
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$themes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyTheme"])(storedColorTheme, resolved);
        setIsLoaded(true);
        // Listen for system theme changes and apply only when mode === 'system'
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = ()=>{
            const currentMode = localStorage.getItem('themeMode') || mode || 'system';
            if (currentMode === 'system') {
                const newResolved = mediaQuery.matches ? 'dark' : 'light';
                setResolvedMode(newResolved);
                // keep classes in sync
                document.documentElement.classList.toggle('dark', newResolved === 'dark');
                document.documentElement.classList.toggle('light', newResolved === 'light');
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$themes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyTheme"])(storedColorTheme, newResolved);
            }
        };
        // Listen for user theme changes via a custom event (other parts of app may dispatch this)
        const handleUserThemeChange = (event)=>{
            try {
                // event may be CustomEvent with detail
                const ce = event;
                const detail = ce.detail || {};
                const newColorTheme = detail.colorTheme || localStorage.getItem('colorTheme') || colorTheme;
                const newMode = detail.mode || localStorage.getItem('themeMode') || mode;
                setColorThemeState(newColorTheme);
                setModeState(newMode);
                const resolvedNew = updateResolvedMode(newMode);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$themes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyTheme"])(newColorTheme, resolvedNew);
            } catch (e) {
                console.warn('userThemeChanged handler error', e);
            }
        };
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        window.addEventListener('userThemeChanged', handleUserThemeChange);
        return ()=>{
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
            window.removeEventListener('userThemeChanged', handleUserThemeChange);
        };
    }, []);
    // Keep theme in sync when colorTheme or explicit mode changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const resolved = updateResolvedMode(mode);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$themes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyTheme"])(colorTheme, resolved);
    }, [
        colorTheme,
        mode
    ]);
    const setColorTheme = (newColorTheme)=>{
        setColorThemeState(newColorTheme);
        localStorage.setItem('colorTheme', newColorTheme);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$themes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyTheme"])(newColorTheme, resolvedMode);
    };
    const setMode = (newMode)=>{
        setModeState(newMode);
        localStorage.setItem('themeMode', newMode);
        const resolved = updateResolvedMode(newMode);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$themes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyTheme"])(colorTheme, resolved);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: {
            colorTheme,
            mode,
            resolvedMode,
            setColorTheme,
            setMode,
            isLoaded
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/components/theme-provider.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
function useTheme() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
}),
"[project]/packages/ui/src/components/ui/badge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            outline: "text-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge({ className, variant, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/packages/ui/src/components/ui/badge.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/apps/accommodation/src/components/layout/header.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppHeader",
    ()=>AppHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/components/ui/dropdown-menu.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.js [app-ssr] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-ssr] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-ssr] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/monitor.js [app-ssr] (ecmascript) <export default as Monitor>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$palette$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Palette$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/palette.js [app-ssr] (ecmascript) <export default as Palette>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-ssr] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-ssr] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-ssr] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left-right.js [app-ssr] (ecmascript) <export default as ArrowLeftRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-ssr] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PackageCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package-check.js [app-ssr] (ecmascript) <export default as PackageCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell-ring.js [app-ssr] (ecmascript) <export default as BellRing>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-ssr] (ecmascript) <export default as PlusCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-ssr] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-ssr] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clipboard-list.js [app-ssr] (ecmascript) <export default as ClipboardList>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wrench.js [app-ssr] (ecmascript) <export default as Wrench>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/components/ui/avatar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/language-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/users-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$notifications$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/notifications-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$theme$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/components/theme-provider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/components/ui/badge.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$formatDistanceToNow$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/formatDistanceToNow.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-ssr] (ecmascript)");
;
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const FeedbackWidget = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(async ()=>{}, {
    loadableGenerated: {
        modules: [
            "[project]/apps/accommodation/src/components/feedback/feedback-widget.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
function toDate(value) {
    if (!value) return new Date(0);
    if (typeof value === 'string') return new Date(value);
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    return new Date(String(value));
}
function AppHeader({ className, ...props }) {
    const { currentUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUsers"])();
    const { notifications, markAsRead, markAllAsRead } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$notifications$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useNotifications"])();
    const { mode, setMode, resolvedMode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$theme$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [isMounted, setIsMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const atAccommodation = pathname?.startsWith('/accommodation');
    const { isMobile, openMobile, setOpenMobile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSidebar"])();
    const toggleApp = ()=>{
        if (atAccommodation) router.push('/');
        else router.push('/accommodation');
    };
    const unreadCount = notifications.filter((n)=>!n.isRead).length;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setIsMounted(true);
    }, []);
    // Auto-close the mobile sidebar whenever the route changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isMobile && openMobile) {
            setOpenMobile(false);
        }
    }, [
        pathname,
        isMobile,
        openMobile,
        setOpenMobile
    ]);
    const handleThemeSettingsClick = ()=>{
        router.push('/setup#themes');
    };
    const handleProfileClick = ()=>{
        router.push('/profile');
    };
    const handleNotificationClick = (notificationId, href)=>{
        markAsRead(notificationId);
        router.push(href);
    };
    const handleLogout = async ()=>{
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.error(e);
        }
        router.replace('/login');
    };
    const { locale, toggleLanguage } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const { dict } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    // Visual mapping for notification types
    const getNotificationMeta = (type)=>{
        switch(type){
            case 'new_order':
                return {
                    Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"],
                    color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/60',
                    ring: 'ring-blue-200 dark:ring-blue-900/50'
                };
            case 'order_approved':
                return {
                    Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"],
                    color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/60',
                    ring: 'ring-emerald-200 dark:ring-emerald-900/50'
                };
            case 'transfer_request':
                return {
                    Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__["ArrowLeftRight"],
                    color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/60',
                    ring: 'ring-amber-200 dark:ring-amber-900/50'
                };
            case 'feedback_update':
                return {
                    Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"],
                    color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/60',
                    ring: 'ring-purple-200 dark:ring-purple-900/50'
                };
            case 'mrv_request':
                return {
                    Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PackageCheck$3e$__["PackageCheck"],
                    color: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950/60',
                    ring: 'ring-cyan-200 dark:ring-cyan-900/50'
                };
            case 'generic':
            default:
                return {
                    Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__["BellRing"],
                    color: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/70',
                    ring: 'ring-slate-200 dark:ring-slate-800'
                };
        }
    };
    const headerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(// Glassmorphism header
    'sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 sm:px-6', 'bg-white/60 dark:bg-white/10 backdrop-blur-xl border-white/30 dark:border-white/10', className);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: headerClass,
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarTrigger"], {
                className: "md:hidden"
            }, void 0, false, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ml-3 flex items-center gap-2 overflow-x-auto no-scrollbar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: atAccommodation ? '/' : '/accommodation',
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted whitespace-nowrap", atAccommodation && "bg-muted"),
                        title: atAccommodation ? `تطبيق ${dict.ui.materialsApp}` : `تطبيق ${dict.ui.accommodationApp}`,
                        children: atAccommodation ? dict.ui.materialsApp : dict.ui.accommodationApp
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/timesheet",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("hidden sm:inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted whitespace-nowrap", pathname?.startsWith('/timesheet') && "bg-muted"),
                        children: [
                            "Timesheet ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-1 text-xs opacity-75",
                                children: "(قريباً)"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 130,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/income-expenses",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("hidden md:inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted whitespace-nowrap", pathname?.startsWith('/income-expenses') && "bg-muted"),
                        children: [
                            "Income & Expenses ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-1 text-xs opacity-75",
                                children: "(قريباً)"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 139,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1"
            }, void 0, false, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 143,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-1 mr-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        title: dict.quickActions?.addNewOrder || 'Add New Order',
                        className: "inline-flex h-9 w-9 items-center justify-center rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50",
                        onClick: ()=>router.push('/inventory/new-order'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 153,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: dict.quickActions?.addNewOrder || 'Add New Order'
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 154,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        title: dict.quickActions?.addMaterialReceipt || 'Add Material Receipt',
                        className: "inline-flex h-9 w-9 items-center justify-center rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/50",
                        onClick: ()=>router.push('/inventory/receive/new-approval'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: dict.quickActions?.addMaterialReceipt || 'Add Material Receipt'
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        title: dict.quickActions?.issueMaterials || 'Issue Materials',
                        className: "inline-flex h-9 w-9 items-center justify-center rounded-md text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/50",
                        onClick: ()=>router.push('/inventory/issue'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 173,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: dict.quickActions?.issueMaterials || 'Issue Materials'
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 174,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 167,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        title: dict.quickActions?.serviceOrder || 'Service Order',
                        className: "inline-flex h-9 w-9 items-center justify-center rounded-md text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-950/50",
                        onClick: ()=>router.push('/inventory/service-orders/new'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 183,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: dict.quickActions?.serviceOrder || 'Service Order'
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 184,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 177,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        title: dict.quickActions?.maintenanceRequest || 'Maintenance Request',
                        className: "inline-flex h-9 w-9 items-center justify-center rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50",
                        onClick: ()=>router.push('/maintenance/new'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__["Wrench"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 193,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: dict.quickActions?.maintenanceRequest || 'Maintenance Request'
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 194,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-6 w-px bg-border mx-1"
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 197,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FeedbackWidget, {}, void 0, false, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 201,
                columnNumber: 3
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenu"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuTrigger"], {
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "ghost",
                            size: "icon",
                            className: "rounded-full",
                            children: [
                                resolvedMode === 'light' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 205,
                                    columnNumber: 41
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 205,
                                    columnNumber: 71
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "sr-only",
                                    children: dict.ui.theme
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 206,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                            lineNumber: 204,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuContent"], {
                        align: "end",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuLabel"], {
                                children: dict.ui.theme
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 210,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuSeparator"], {}, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 211,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: ()=>setMode('light'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                                        className: "mr-2 h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 213,
                                        columnNumber: 13
                                    }, this),
                                    dict.ui.light,
                                    mode === 'light' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                        className: "ml-auto h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 215,
                                        columnNumber: 34
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: ()=>setMode('dark'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                                        className: "mr-2 h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 218,
                                        columnNumber: 13
                                    }, this),
                                    dict.ui.dark,
                                    mode === 'dark' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                        className: "ml-auto h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 220,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 217,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: ()=>setMode('system'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__["Monitor"], {
                                        className: "mr-2 h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 223,
                                        columnNumber: 13
                                    }, this),
                                    dict.ui.system,
                                    mode === 'system' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                        className: "ml-auto h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 225,
                                        columnNumber: 35
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 222,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuSeparator"], {}, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 227,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: handleThemeSettingsClick,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$palette$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Palette$3e$__["Palette"], {
                                        className: "mr-2 h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 229,
                                        columnNumber: 13
                                    }, this),
                                    dict.ui.colorSettings
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 228,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 202,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenu"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuTrigger"], {
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "ghost",
                            size: "icon",
                            className: "rounded-full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__["ArrowLeftRight"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 239,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "sr-only",
                                    children: "Change language"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 240,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                            lineNumber: 238,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 237,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuContent"], {
                        align: "end",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuLabel"], {
                                children: dict.changeLanguage
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 244,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuSeparator"], {}, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 245,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: ()=>{
                                    if (locale !== 'en') toggleLanguage();
                                },
                                children: [
                                    "English ",
                                    locale === 'en' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                        className: "ml-auto h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 247,
                                        columnNumber: 41
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 246,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: ()=>{
                                    if (locale !== 'ar') toggleLanguage();
                                },
                                children: [
                                    "العربية ",
                                    locale === 'ar' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                        className: "ml-auto h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 250,
                                        columnNumber: 41
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 249,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 243,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 236,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenu"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuTrigger"], {
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "ghost",
                            size: "icon",
                            className: "rounded-full relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 258,
                                    columnNumber: 17
                                }, this),
                                isMounted && unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Badge"], {
                                    variant: "destructive",
                                    className: "absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0",
                                    children: unreadCount
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 260,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "sr-only",
                                    children: "Notifications"
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 262,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                            lineNumber: 257,
                            columnNumber: 12
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuContent"], {
                        align: "end",
                        className: "w-96",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuLabel"], {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-semibold",
                                        children: dict.notifications
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 267,
                                        columnNumber: 17
                                    }, this),
                                    isMounted && unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: "link",
                                        size: "sm",
                                        className: "h-auto p-0",
                                        onClick: markAllAsRead,
                                        children: dict.viewAll
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 268,
                                        columnNumber: 50
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 266,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuSeparator"], {}, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 270,
                                columnNumber: 13
                            }, this),
                            isMounted && notifications.length > 0 ? notifications.slice(0, 8).map((notification)=>{
                                const meta = getNotificationMeta(notification.type);
                                const { Icon } = meta;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                    onSelect: ()=>handleNotificationClick(notification.id, notification.href),
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex items-start gap-3 whitespace-normal py-3', 'focus:bg-accent/60', !notification.isRead ? 'bg-accent/40' : ''),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ring-1', meta.color, meta.ring),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                                lineNumber: 285,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                            lineNumber: 284,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-start justify-between gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "font-medium leading-snug truncate",
                                                            children: notification.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                                            lineNumber: 289,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "shrink-0 text-[11px] text-muted-foreground",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$formatDistanceToNow$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDistanceToNow"])(toDate(notification.createdAt), {
                                                                addSuffix: true
                                                            })
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                                            lineNumber: 290,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                                    lineNumber: 288,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-0.5 text-xs text-muted-foreground line-clamp-2",
                                                    children: notification.message
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                                    lineNumber: 292,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                            lineNumber: 287,
                                            columnNumber: 21
                                        }, this),
                                        !notification.isRead && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "ml-1 mt-1 inline-block h-2 w-2 rounded-full bg-primary",
                                            "aria-hidden": true
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                            lineNumber: 294,
                                            columnNumber: 46
                                        }, this)
                                    ]
                                }, notification.id, true, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 275,
                                    columnNumber: 19
                                }, this);
                            }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                disabled: true,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "p-2 text-sm text-muted-foreground text-center w-full",
                                    children: dict.notifications
                                }, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 299,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 298,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 255,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenu"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuTrigger"], {
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "ghost",
                            className: "relative h-9 w-9 rounded-full",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Avatar"], {
                                className: "h-9 w-9",
                                children: isMounted && currentUser ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AvatarImage"], {
                                            src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'%3EIMG%3C/text%3E%3C/svg%3E`,
                                            alt: currentUser.name,
                                            "data-ai-hint": "profile picture"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                            lineNumber: 311,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AvatarFallback"], {
                                            children: currentUser.name?.charAt(0) || 'U'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                            lineNumber: 312,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AvatarFallback"], {}, void 0, false, {
                                    fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                    lineNumber: 315,
                                    columnNumber: 18
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 308,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                            lineNumber: 307,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 306,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuContent"], {
                        align: "end",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuLabel"], {
                                children: isMounted && currentUser ? currentUser.name : dict.myAccount
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 321,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuSeparator"], {}, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 322,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: handleProfileClick,
                                children: dict.profile
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 323,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                children: dict.settings
                            }, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 324,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuSeparator"], {}, void 0, false, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 325,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                onClick: handleLogout,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                        className: "mr-2 h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                        lineNumber: 327,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    dict.logout
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                                lineNumber: 326,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                        lineNumber: 320,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
                lineNumber: 305,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/accommodation/src/components/layout/header.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/accommodation/src/components/auth/require-auth-cloudflare.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RequireAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function RequireAuth({ children }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [authenticated, setAuthenticated] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let isMounted = true;
        async function checkSession() {
            try {
                const res = await fetch('/api/auth/me', {
                    credentials: 'include',
                    cache: 'no-store'
                });
                if (!isMounted) return;
                if (!res.ok) {
                    setAuthenticated(false);
                    if (pathname !== '/login') {
                        router.replace('/login');
                    }
                } else {
                    setAuthenticated(true);
                    if (pathname === '/login') {
                        router.replace('/accommodation');
                    }
                }
            } catch (e) {
                if (isMounted) {
                    setAuthenticated(false);
                    if (pathname !== '/login') {
                        router.replace('/login');
                    }
                }
            } finally{
                if (isMounted) setReady(true);
            }
        }
        checkSession();
        return ()=>{
            isMounted = false;
        };
    }, [
        pathname,
        router
    ]);
    if (!ready) return null;
    if (!authenticated) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-[40vh] grid place-items-center text-muted-foreground text-sm",
            children: "Redirecting to login…"
        }, void 0, false, {
            fileName: "[project]/apps/accommodation/src/components/auth/require-auth-cloudflare.tsx",
            lineNumber: 49,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
}),
"[externals]/firebase/app [external] (firebase/app, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("firebase/app");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/firebase/firestore [external] (firebase/firestore, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("firebase/firestore");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/firebase/storage [external] (firebase/storage, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("firebase/storage");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/firebase/app-check [external] (firebase/app-check, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("firebase/app-check");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/apps/accommodation/src/lib/firebase.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// Import the functions you need from the SDKs you need
__turbopack_context__.s([
    "app",
    ()=>app,
    "auth",
    ()=>auth,
    "authReady",
    ()=>authReady,
    "db",
    ()=>db,
    "firebaseEnabled",
    ()=>firebaseEnabled,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/app [external] (firebase/app, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/storage [external] (firebase/storage, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app$2d$check__$5b$external$5d$__$28$firebase$2f$app$2d$check$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/app-check [external] (firebase/app-check, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app$2d$check__$5b$external$5d$__$28$firebase$2f$app$2d$check$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app$2d$check__$5b$external$5d$__$28$firebase$2f$app$2d$check$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: ("TURBOPACK compile-time value", "sample-firebase-ai-app-55f54"),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
let app = null;
let db = null;
const auth = null;
let storage = null;
// Check if Firebase config is properly set (require only essential keys)
const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId'
];
const isFirebaseConfigured = requiredKeys.every((k)=>{
    const v = firebaseConfig[k];
    return v && typeof v === 'string' && v.trim().length > 0 && !v.includes('your_') && v !== 'your_api_key_here';
});
// In the cloudflare branch we generally avoid talking to Firebase by default.
// This can be overridden in local development via NEXT_PUBLIC_DISABLE_FIREBASE=false
const disableFirebase = String(process.env.NEXT_PUBLIC_DISABLE_FIREBASE || 'true').toLowerCase() !== 'false';
const firebaseEnabled = isFirebaseConfigured && !disableFirebase;
// A promise that resolves when auth state is ready (client-only)
let authReady = Promise.resolve();
if (firebaseEnabled) {
    try {
        app = !(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$29$__["getApps"])().length ? (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$29$__["initializeApp"])(firebaseConfig) : (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$29$__["getApp"])();
        // Quieter console: only errors
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setLogLevel"])('error');
        // Initialize App Check if configured (helps when enforcement is enabled)
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Decide cache strategy
        const useMemoryCache = (process.env.NEXT_PUBLIC_FIRESTORE_CACHE || '').toLowerCase() === 'memory' || ("TURBOPACK compile-time value", "development") !== 'production';
        // Initialize Firestore with memory cache only because Workers and edge runtimes do not support IndexedDB.
        db = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["initializeFirestore"])(app, {
            localCache: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["memoryLocalCache"])(),
            ignoreUndefinedProperties: true
        });
        // If an emulator host is provided via env, connect the client to it so
        // local development doesn't try to reach production Firestore.
        // Accepts formats like "localhost:8080" or "localhost,8080" or just "localhost"
        const emulatorEnv = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
        if (emulatorEnv) {
            try {
                let host = String(emulatorEnv);
                let port = 8080;
                if (host.includes(':')) {
                    const [h, p] = host.split(':');
                    host = h;
                    port = Number(p) || port;
                } else if (host.includes(',')) {
                    const [h, p] = host.split(',');
                    host = h;
                    port = Number(p) || port;
                }
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            } catch (err) {
                console.warn('Failed to connect to Firestore emulator:', err);
            }
        }
        storage = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$29$__["getStorage"])(app);
        // Firebase Auth is not used in the Cloudflare/D1 branch; session auth is handled by server-side JWT cookies.
        if ("TURBOPACK compile-time truthy", 1) {
            const key = String(firebaseConfig.apiKey || '');
            const masked = key ? `${key.slice(0, 6)}...${key.slice(-2)}` : 'missing';
            console.log(`Firebase initialized. apiKey: ${masked}`);
        } else //TURBOPACK unreachable
        ;
    } catch (e) {
        console.error("Firebase initialization error. Make sure you have set up your .env file correctly.", e);
    }
} else {
    if (disableFirebase) {
        console.warn("Firebase explicitly disabled via NEXT_PUBLIC_DISABLE_FIREBASE. Cloudflare/D1 branch will not use Firestore.");
    } else {
        console.warn("Firebase not configured. Using local storage fallback. Please configure Firebase in .env.local for full functionality.");
    }
}
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/lib/messaging.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "enablePushIfGranted",
    ()=>enablePushIfGranted,
    "setupForegroundMessageListener",
    ()=>setupForegroundMessageListener
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
// Lazy import messaging modules because not all environments support it
let _isSupported;
let _getMessaging;
let _getToken;
let _onMessage;
async function loadMessaging() {
    if (_isSupported) return;
    const m = await __turbopack_context__.A("[externals]/firebase/messaging [external] (firebase/messaging, esm_import, async loader)");
    _isSupported = m.isSupported;
    _getMessaging = m.getMessaging;
    _getToken = m.getToken;
    _onMessage = m.onMessage;
}
async function enablePushIfGranted(userId) {
    try {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        // Ensure service worker is registered for messaging
        let reg;
        const messaging = undefined;
        // VAPID key is optional if configured in console, but recommended
        const vapidKey = undefined;
        const token = undefined;
        // Store/Upsert token document
        // Using deterministic doc id with the token avoids duplicates
        const tokenId = undefined;
    } catch (e) {
    // noop
    }
}
async function setupForegroundMessageListener(cb) {
    try {
        if ("TURBOPACK compile-time truthy", 1) return ()=>{};
        //TURBOPACK unreachable
        ;
        const messaging = undefined;
        const unsub = undefined;
    } catch  {
        return ()=>{};
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/components/layout/app-layout.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AppLayout",
    ()=>AppLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/components/layout/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$layout$2f$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/components/layout/header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$auth$2f$require$2d$auth$2d$cloudflare$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/components/auth/require-auth-cloudflare.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/users-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$messaging$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/messaging.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/language-context.tsx [app-ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$messaging$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$messaging$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
'use client';
;
;
;
;
;
;
;
;
;
;
;
const FeedbackWidget = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(async ()=>{}, {
    loadableGenerated: {
        modules: [
            "[project]/apps/accommodation/src/components/feedback/feedback-widget.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
function AppLayoutInner({ children }) {
    const { currentUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUsers"])();
    const { locale } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$messaging$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["enablePushIfGranted"])(currentUser?.id);
    }, [
        currentUser?.id
    ]);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    // Render bare page for login route (no sidebar/header/guard)
    if (pathname === '/login') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "flex min-h-screen items-center justify-center bg-background p-4",
            children: children
        }, void 0, false, {
            fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$auth$2f$require$2d$auth$2d$cloudflare$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarProvider"], {
            defaultOpen: true,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sidebar"], {
                    side: locale === 'ar' ? 'right' : 'left',
                    className: "no-print",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AppSidebar"], {}, void 0, false, {
                        fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
                        lineNumber: 39,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarInset"], {
                    className: "flex flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$components$2f$layout$2f$header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AppHeader"], {
                            className: "no-print"
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                            className: "flex-1 overflow-y-auto p-4 lg:p-6 bg-background",
                            children: children
                        }, void 0, false, {
                            fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
                            lineNumber: 43,
                            columnNumber: 6
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
                    lineNumber: 41,
                    columnNumber: 3
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
            lineNumber: 37,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
function AppLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$language$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LanguageProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AppLayoutInner, {
            children: children
        }, void 0, false, {
            fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
            lineNumber: 55,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/components/layout/app-layout.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/packages/ui/src/components/ui/toaster.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@/components/ui/toast'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-ssr] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-ssr] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-ssr] (ecmascript) <export default as XCircle>");
"use client";
;
;
;
;
function Toaster() {
    const { toasts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastProvider, {
        children: [
            toasts.map(function({ id, title, description, action, variant, ...props }) {
                const icon = variant === "success" ? "success" : variant === "destructive" ? "destructive" : variant === "warning" ? "warning" : "default";
                const iconClasses = variant === "success" ? "text-emerald-600" : variant === "destructive" ? "text-red-600" : variant === "warning" ? "text-amber-600" : "text-sky-600";
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Toast, {
                    variant: variant,
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-start gap-3",
                            dir: "rtl",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 shadow-sm ${iconClasses}`,
                                    children: icon === "success" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                        lineNumber: 41,
                                        columnNumber: 39
                                    }, this) : icon === "destructive" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                        lineNumber: 41,
                                        columnNumber: 103
                                    }, this) : icon === "warning" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                        lineNumber: 41,
                                        columnNumber: 158
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                        lineNumber: 41,
                                        columnNumber: 198
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                    lineNumber: 40,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid gap-1 flex-1",
                                    children: [
                                        title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastTitle, {
                                            className: "text-right font-semibold",
                                            children: title
                                        }, void 0, false, {
                                            fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                            lineNumber: 44,
                                            columnNumber: 27
                                        }, this),
                                        description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastDescription, {
                                            className: "text-right text-sm text-slate-700 dark:text-slate-300",
                                            children: description
                                        }, void 0, false, {
                                            fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                            lineNumber: 46,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                                    lineNumber: 43,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                            lineNumber: 39,
                            columnNumber: 13
                        }, this),
                        action,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastClose, {}, void 0, false, {
                            fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                            lineNumber: 51,
                            columnNumber: 13
                        }, this)
                    ]
                }, id, true, {
                    fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                    lineNumber: 38,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastViewport, {}, void 0, false, {
                fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/packages/ui/src/components/ui/toaster.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/accommodation/src/lib/firestore-utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "safeOnSnapshot",
    ()=>safeOnSnapshot
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
function safeOnSnapshot(query, next, error, options) {
    let retried = false;
    const wrappedError = (err)=>{
        try {
            console.error('Firestore listener error (safeOnSnapshot):', err);
        } catch  {}
        // Firestore sometimes closes watch streams with a specific message;
        // offer a single retry when configured.
        const message = err && err.message || String(err);
        const isWatchClose = /watch stream closed|UNAVAILABLE|Failed to get new host/i.test(message);
        if (options?.retryOnClose && !retried && isWatchClose) {
            retried = true;
            console.warn('safeOnSnapshot: retrying listener once after watch-stream-close');
            // re-subscribe: return a fresh subscription
            return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])(query, next, (e)=>wrappedError(e));
        }
        if (typeof error === 'function') error(err);
    };
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])(query, next, (e)=>wrappedError(e));
}
const __TURBOPACK__default__export__ = safeOnSnapshot;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/context/residences-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "ResidencesProvider",
    ()=>ResidencesProvider,
    "useResidences",
    ()=>useResidences
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firestore$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firestore-utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firestore$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firestore$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
'use client';
;
;
;
;
;
;
const ResidencesContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const firebaseErrorMessage = "Firebase is not configured. Using local storage. To enable cloud sync, please configure Firebase in .env.local";
// Helper function to save residences to localStorage
const saveToLocalStorage = (residences)=>{
    try {
        localStorage.setItem('estatecare_residences', JSON.stringify(residences));
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
};
function normalizeResidence(raw) {
    const name = raw.name || raw.title || raw.nameEn || raw.nameAr || raw.complexName || raw.residenceName || raw.complexTitle || raw.roomName || raw.address || 'Unnamed residence';
    const city = raw.city || raw.address || raw.locationString || raw.region || '';
    return {
        id: raw.id || raw.uid || raw._id || '',
        name,
        nameAr: raw.nameAr,
        nameEn: raw.nameEn,
        title: raw.title,
        city,
        managerId: raw.managerId || raw.manager || '',
        buildings: Array.isArray(raw.buildings) ? raw.buildings : [],
        rooms: Array.isArray(raw.rooms) ? raw.rooms : undefined,
        facilities: Array.isArray(raw.facilities) ? raw.facilities : undefined,
        disabled: !!raw.disabled,
        isEmergencyMode: !!raw.isEmergencyMode,
        address: raw.address,
        location: raw.location,
        locationString: raw.locationString
    };
}
const ResidencesProvider = ({ children })=>{
    const [residences, setResidences] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const unsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isLoaded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const loadResidences = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (isLoaded.current) return;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            console.log("Firebase not configured, using local storage");
            // Load from localStorage
            try {
                const storedResidences = localStorage.getItem('estatecare_residences');
                const residuesRaw = storedResidences ? JSON.parse(storedResidences) : [];
                const residencesData = Array.isArray(residuesRaw) ? residuesRaw.map(normalizeResidence) : [];
                setResidences(residencesData);
            } catch (error) {
                console.error("Error loading from localStorage:", error);
                setResidences([]);
            }
            setLoading(false);
            isLoaded.current = true;
            return;
        }
        isLoaded.current = true;
        setLoading(true);
        const residencesCollection = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences");
        // Use safeOnSnapshot to provide clearer logs and a single retry on transient watch closures
        unsubscribeRef.current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firestore$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(residencesCollection, (snapshot)=>{
            const residencesData = snapshot.docs.map((doc)=>normalizeResidence({
                    id: doc.id,
                    ...doc.data()
                }));
            setResidences(residencesData);
            setLoading(false);
        }, (error)=>{
            console.error("Error fetching residences:", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch residences data. Check your Firebase config and security rules.",
                variant: "destructive"
            });
            setLoading(false);
        }, {
            retryOnClose: true
        });
    }, [
        toast
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Try once on mount (will no-op if waiting for auth)
        loadResidences();
        // Also subscribe to auth changes to trigger loading after sign-in
        return ()=>{
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                isLoaded.current = false;
            }
        };
    }, [
        loadResidences
    ]);
    const addComplex = async (name, city, managerId)=>{
        const trimmedName = name.trim();
        if (residences.some((c)=>c.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({
                title: "Error",
                description: "A complex with this name already exists.",
                variant: "destructive"
            });
            return;
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Use localStorage when Firebase is not available
            try {
                const newComplex = {
                    id: `complex-${Date.now()}`,
                    name: trimmedName,
                    city: city.trim(),
                    managerId,
                    buildings: [],
                    facilities: [],
                    disabled: false
                };
                const updatedResidences = [
                    ...residences,
                    newComplex
                ];
                setResidences(updatedResidences);
                saveToLocalStorage(updatedResidences);
                // Also update local users assignedResidences for the manager
                try {
                    const storedUsers = localStorage.getItem('estatecare_users');
                    if (storedUsers) {
                        const usersData = JSON.parse(storedUsers);
                        const updatedUsers = usersData.map((u)=>{
                            if (u.id !== managerId) return u;
                            const assigned = Array.isArray(u.assignedResidences) ? u.assignedResidences : [];
                            return {
                                ...u,
                                assignedResidences: Array.from(new Set([
                                    ...assigned,
                                    newComplex.id
                                ]))
                            };
                        });
                        localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
                    }
                } catch (e) {
                    console.warn('Local users sync failed (addComplex):', e);
                }
                toast({
                    title: "Success",
                    description: "New residential complex added (locally)."
                });
            } catch (error) {
                console.error("Error saving to localStorage:", error);
                toast({
                    title: "Error",
                    description: "Failed to add complex locally.",
                    variant: "destructive"
                });
            }
            return;
        }
        const docRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences"));
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(docRef, {
            id: docRef.id,
            name: trimmedName,
            city: city.trim(),
            managerId,
            buildings: [],
            facilities: [],
            disabled: false
        });
        // Sync user's assignedResidences with this new residence
        try {
            if (managerId) {
                const userRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'users', managerId);
                // Use set with merge to create if missing
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(userRef, {
                    assignedResidences: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["arrayUnion"])(docRef.id)
                }, {
                    merge: true
                });
            }
        } catch (e) {
            console.warn('User sync failed (addComplex):', e);
        }
        toast({
            title: "Success",
            description: "New residential complex added."
        });
    };
    const updateRoomName = async (complexId, buildingId, floorId, roomId, newName)=>{
        const trimmed = newName.trim();
        if (!trimmed) return;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    return {
                        ...c,
                        buildings: c.buildings.map((b)=>{
                            if (b.id !== buildingId) return b;
                            return {
                                ...b,
                                floors: b.floors.map((f)=>{
                                    if (f.id !== floorId) return f;
                                    if (f.rooms.some((r)=>r.id !== roomId && r.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                                        toast({
                                            title: 'مكرر',
                                            description: 'يوجد غرفة بنفس الاسم.',
                                            variant: 'destructive'
                                        });
                                        return f;
                                    }
                                    return {
                                        ...f,
                                        rooms: f.rooms.map((r)=>r.id === roomId ? {
                                                ...r,
                                                name: trimmed
                                            } : r)
                                    };
                                })
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'تم',
                    description: 'تم تحديث اسم الغرفة.'
                });
            } catch (e) {
                console.error('updateRoomName local error:', e);
                toast({
                    title: 'خطأ',
                    description: 'فشل تحديث الاسم محلياً.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            const b = data.buildings.find((x)=>x.id === buildingId);
            const f = b?.floors.find((x)=>x.id === floorId);
            if (!b || !f) throw new Error('Not found');
            if (f.rooms.some((r)=>r.id !== roomId && r.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                toast({
                    title: 'مكرر',
                    description: 'يوجد غرفة بنفس الاسم.',
                    variant: 'destructive'
                });
                return;
            }
            const buildings = data.buildings.map((x)=>x.id !== buildingId ? x : {
                    ...x,
                    floors: x.floors.map((fl)=>fl.id !== floorId ? fl : {
                            ...fl,
                            rooms: fl.rooms.map((r)=>r.id === roomId ? {
                                    ...r,
                                    name: trimmed
                                } : r)
                        })
                });
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(ref, {
                buildings
            });
            toast({
                title: 'تم',
                description: 'تم تحديث اسم الغرفة.'
            });
        } catch (e) {
            console.error('updateRoomName error:', e);
            toast({
                title: 'Error',
                description: 'Failed to update room name.',
                variant: 'destructive'
            });
        }
    };
    const updateFacilityName = async (complexId, level, facilityId, newName, buildingId, floorId)=>{
        const trimmed = newName.trim();
        if (!trimmed) return;
        const updateInComplex = (c)=>{
            if (level === 'complex') {
                if ((c.facilities || []).some((f)=>f.id !== facilityId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                    toast({
                        title: 'مكرر',
                        description: 'يوجد تجهيز بنفس الاسم.',
                        variant: 'destructive'
                    });
                    return c;
                }
                return {
                    ...c,
                    facilities: (c.facilities || []).map((f)=>f.id === facilityId ? {
                            ...f,
                            name: trimmed
                        } : f)
                };
            }
            return {
                ...c,
                buildings: c.buildings.map((b)=>{
                    if (b.id !== buildingId) return b;
                    if (level === 'building') {
                        if ((b.facilities || []).some((f)=>f.id !== facilityId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                            toast({
                                title: 'مكرر',
                                description: 'يوجد تجهيز بنفس الاسم.',
                                variant: 'destructive'
                            });
                            return b;
                        }
                        return {
                            ...b,
                            facilities: (b.facilities || []).map((f)=>f.id === facilityId ? {
                                    ...f,
                                    name: trimmed
                                } : f)
                        };
                    }
                    const fl = b.floors.find((fl)=>fl.id === floorId);
                    if (fl && (fl.facilities || []).some((f)=>f.id !== facilityId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                        toast({
                            title: 'مكرر',
                            description: 'يوجد تجهيز بنفس الاسم.',
                            variant: 'destructive'
                        });
                        return b;
                    }
                    return {
                        ...b,
                        floors: b.floors.map((fl)=>fl.id !== floorId ? fl : {
                                ...fl,
                                facilities: (fl.facilities || []).map((f)=>f.id === facilityId ? {
                                        ...f,
                                        name: trimmed
                                    } : f)
                            })
                    };
                })
            };
        };
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>c.id === complexId ? updateInComplex(c) : c);
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'تم',
                    description: 'تم تحديث اسم التجهيز.'
                });
            } catch (e) {
                console.error('updateFacilityName local error:', e);
                toast({
                    title: 'خطأ',
                    description: 'فشل تحديث الاسم محلياً.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            const buildings = updateInComplex(data).buildings;
            const facilities = updateInComplex(data).facilities || [];
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(ref, {
                buildings,
                facilities
            });
            toast({
                title: 'تم',
                description: 'تم تحديث اسم التجهيز.'
            });
        } catch (e) {
            console.error('updateFacilityName error:', e);
            toast({
                title: 'Error',
                description: 'Failed to update facility name.',
                variant: 'destructive'
            });
        }
    };
    const updateFloorName = async (complexId, buildingId, floorId, newName)=>{
        const trimmed = newName.trim();
        if (!trimmed) return;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    return {
                        ...c,
                        buildings: c.buildings.map((b)=>{
                            if (b.id !== buildingId) return b;
                            if (b.floors.some((f)=>f.id !== floorId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                                toast({
                                    title: 'مكرر',
                                    description: 'يوجد طابق بنفس الاسم.',
                                    variant: 'destructive'
                                });
                                return b;
                            }
                            return {
                                ...b,
                                floors: b.floors.map((f)=>f.id === floorId ? {
                                        ...f,
                                        name: trimmed
                                    } : f)
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'تم',
                    description: 'تم تحديث اسم الطابق.'
                });
            } catch (e) {
                console.error('updateFloorName local error:', e);
                toast({
                    title: 'خطأ',
                    description: 'فشل تحديث الاسم محلياً.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            const b = data.buildings.find((x)=>x.id === buildingId);
            if (!b) throw new Error('Building not found');
            if (b.floors.some((f)=>f.id !== floorId && f.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                toast({
                    title: 'مكرر',
                    description: 'يوجد طابق بنفس الاسم.',
                    variant: 'destructive'
                });
                return;
            }
            const buildings = data.buildings.map((x)=>x.id !== buildingId ? x : {
                    ...x,
                    floors: x.floors.map((f)=>f.id === floorId ? {
                            ...f,
                            name: trimmed
                        } : f)
                });
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(ref, {
                buildings
            });
            toast({
                title: 'تم',
                description: 'تم تحديث اسم الطابق.'
            });
        } catch (e) {
            console.error('updateFloorName error:', e);
            toast({
                title: 'Error',
                description: 'Failed to update floor name.',
                variant: 'destructive'
            });
        }
    };
    const updateBuildingName = async (complexId, buildingId, newName)=>{
        const trimmed = newName.trim();
        if (!trimmed) return;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    if (c.buildings.some((b)=>b.id !== buildingId && b.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                        toast({
                            title: 'مكرر',
                            description: 'يوجد مبنى بنفس الاسم.',
                            variant: 'destructive'
                        });
                        return c;
                    }
                    return {
                        ...c,
                        buildings: c.buildings.map((b)=>b.id === buildingId ? {
                                ...b,
                                name: trimmed
                            } : b)
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'تم',
                    description: 'تم تحديث اسم المبنى.'
                });
            } catch (e) {
                console.error('updateBuildingName local error:', e);
                toast({
                    title: 'خطأ',
                    description: 'فشل تحديث الاسم محلياً.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            if (data.buildings.some((b)=>b.id !== buildingId && b.name.trim().toLowerCase() === trimmed.toLowerCase())) {
                toast({
                    title: 'مكرر',
                    description: 'يوجد مبنى بنفس الاسم.',
                    variant: 'destructive'
                });
                return;
            }
            const buildings = data.buildings.map((b)=>b.id === buildingId ? {
                    ...b,
                    name: trimmed
                } : b);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(ref, {
                buildings
            });
            toast({
                title: 'تم',
                description: 'تم تحديث اسم المبنى.'
            });
        } catch (e) {
            console.error('updateBuildingName error:', e);
            toast({
                title: 'Error',
                description: 'Failed to update building name.',
                variant: 'destructive'
            });
        }
    };
    const moveRoomAnywhere = async (from, to, roomId)=>{
        // Same complex + same building => floor move
        if (from.complexId === to.complexId && from.buildingId === to.buildingId) {
            return moveRoom(from.complexId, from.buildingId, from.floorId, to.floorId, roomId);
        }
        // Same complex + different buildings => single atomic update
        if (from.complexId === to.complexId && from.buildingId !== to.buildingId) {
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
                try {
                    const compIndex = residences.findIndex((r)=>r.id === from.complexId);
                    if (compIndex < 0) return;
                    const comp = residences[compIndex];
                    const srcB = comp.buildings.find((b)=>b.id === from.buildingId);
                    const dstB = comp.buildings.find((b)=>b.id === to.buildingId);
                    const srcF = srcB?.floors.find((f)=>f.id === from.floorId);
                    const dstF = dstB?.floors.find((f)=>f.id === to.floorId);
                    const room = srcF?.rooms.find((r)=>r.id === roomId);
                    if (!srcB || !dstB || !srcF || !dstF || !room) return;
                    if (dstF.rooms.some((r)=>r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
                        toast({
                            title: 'مكرر',
                            description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.',
                            variant: 'destructive'
                        });
                        return;
                    }
                    const updatedComp = {
                        ...comp,
                        buildings: comp.buildings.map((b)=>{
                            if (b.id === from.buildingId) {
                                return {
                                    ...b,
                                    floors: b.floors.map((f)=>f.id === from.floorId ? {
                                            ...f,
                                            rooms: f.rooms.filter((r)=>r.id !== roomId)
                                        } : f)
                                };
                            }
                            if (b.id === to.buildingId) {
                                return {
                                    ...b,
                                    floors: b.floors.map((f)=>f.id === to.floorId ? {
                                            ...f,
                                            rooms: [
                                                ...f.rooms,
                                                {
                                                    ...room,
                                                    floorId: to.floorId
                                                }
                                            ]
                                        } : f)
                                };
                            }
                            return b;
                        })
                    };
                    const updated = residences.map((r)=>r.id === updatedComp.id ? updatedComp : r);
                    setResidences(updated);
                    saveToLocalStorage(updated);
                    toast({
                        title: 'Success',
                        description: 'Room moved.'
                    });
                } catch (e) {
                    console.error('Error moving room same-complex (local):', e);
                    toast({
                        title: 'Error',
                        description: 'Failed to move room locally.',
                        variant: 'destructive'
                    });
                }
                return;
            }
            try {
                const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', from.complexId);
                const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
                if (!snap.exists()) throw new Error('Complex not found');
                const data = snap.data();
                const srcB = data.buildings.find((b)=>b.id === from.buildingId);
                const dstB = data.buildings.find((b)=>b.id === to.buildingId);
                const srcF = srcB?.floors.find((f)=>f.id === from.floorId);
                const dstF = dstB?.floors.find((f)=>f.id === to.floorId);
                const room = srcF?.rooms.find((r)=>r.id === roomId);
                if (!srcB || !dstB || !srcF || !dstF || !room) throw new Error('Room/building/floor not found');
                if (dstF.rooms.some((r)=>r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
                    toast({
                        title: 'مكرر',
                        description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.',
                        variant: 'destructive'
                    });
                    return;
                }
                const buildings = data.buildings.map((b)=>{
                    if (b.id === from.buildingId) {
                        return {
                            ...b,
                            floors: b.floors.map((f)=>f.id === from.floorId ? {
                                    ...f,
                                    rooms: f.rooms.filter((r)=>r.id !== roomId)
                                } : f)
                        };
                    }
                    if (b.id === to.buildingId) {
                        return {
                            ...b,
                            floors: b.floors.map((f)=>f.id === to.floorId ? {
                                    ...f,
                                    rooms: [
                                        ...f.rooms,
                                        {
                                            ...room,
                                            floorId: to.floorId
                                        }
                                    ]
                                } : f)
                        };
                    }
                    return b;
                });
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(ref, {
                    buildings
                });
                toast({
                    title: 'Success',
                    description: 'Room moved.'
                });
            } catch (e) {
                console.error('Error moving room same-complex cross-building:', e);
                toast({
                    title: 'Error',
                    description: 'Failed to move room.',
                    variant: 'destructive'
                });
            }
            return;
        }
        // Cross-complex move (different documents)
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const src = residences.find((r)=>r.id === from.complexId);
                const dst = residences.find((r)=>r.id === to.complexId);
                if (!src || !dst) return;
                const srcB = src.buildings.find((b)=>b.id === from.buildingId);
                const dstB = dst.buildings.find((b)=>b.id === to.buildingId);
                const srcF = srcB?.floors.find((f)=>f.id === from.floorId);
                const dstF = dstB?.floors.find((f)=>f.id === to.floorId);
                const room = srcF?.rooms.find((r)=>r.id === roomId);
                if (!room || !dstF) return;
                if (dstF.rooms.some((r)=>r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
                    toast({
                        title: 'مكرر',
                        description: 'يوجد غرفة بنفس الاسم في الوجهة. النقل مرفوض.',
                        variant: 'destructive'
                    });
                    return;
                }
                const updated = residences.map((c)=>{
                    if (c.id === from.complexId) {
                        return {
                            ...c,
                            buildings: c.buildings.map((b)=>b.id === from.buildingId ? {
                                    ...b,
                                    floors: b.floors.map((f)=>f.id === from.floorId ? {
                                            ...f,
                                            rooms: f.rooms.filter((r)=>r.id !== roomId)
                                        } : f)
                                } : b)
                        };
                    }
                    if (c.id === to.complexId) {
                        return {
                            ...c,
                            buildings: c.buildings.map((b)=>b.id === to.buildingId ? {
                                    ...b,
                                    floors: b.floors.map((f)=>f.id === to.floorId ? {
                                            ...f,
                                            rooms: [
                                                ...f.rooms,
                                                {
                                                    ...room,
                                                    floorId: to.floorId
                                                }
                                            ]
                                        } : f)
                                } : b)
                        };
                    }
                    return c;
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Room moved.'
                });
            } catch (e) {
                console.error('Error moving room cross-complex (local):', e);
                toast({
                    title: 'Error',
                    description: 'Failed to move room locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const fromRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', from.complexId);
            const toRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', to.complexId);
            const [fromSnap, toSnap] = await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(fromRef),
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(toRef)
            ]);
            if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Complex not found');
            const fromData = fromSnap.data();
            const toData = toSnap.data();
            const srcB = fromData.buildings.find((b)=>b.id === from.buildingId);
            const srcF = srcB?.floors.find((f)=>f.id === from.floorId);
            const room = srcF?.rooms.find((r)=>r.id === roomId);
            if (!room) throw new Error('Room not found');
            const dstB = toData.buildings.find((b)=>b.id === to.buildingId);
            const dstF = dstB?.floors.find((f)=>f.id === to.floorId);
            if (!dstF) throw new Error('Target floor not found');
            if (dstF.rooms.some((r)=>r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
                toast({
                    title: 'مكرر',
                    description: 'يوجد غرفة بنفس الاسم في الوجهة. النقل مرفوض.',
                    variant: 'destructive'
                });
                return;
            }
            const updatedFromBuildings = fromData.buildings.map((b)=>b.id === from.buildingId ? {
                    ...b,
                    floors: b.floors.map((f)=>f.id === from.floorId ? {
                            ...f,
                            rooms: f.rooms.filter((r)=>r.id !== roomId)
                        } : f)
                } : b);
            const updatedToBuildings = toData.buildings.map((b)=>b.id === to.buildingId ? {
                    ...b,
                    floors: b.floors.map((f)=>f.id === to.floorId ? {
                            ...f,
                            rooms: [
                                ...f.rooms,
                                {
                                    ...room,
                                    floorId: to.floorId
                                }
                            ]
                        } : f)
                } : b);
            await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(fromRef, {
                    buildings: updatedFromBuildings
                }),
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(toRef, {
                    buildings: updatedToBuildings
                })
            ]);
            toast({
                title: 'Success',
                description: 'Room moved.'
            });
        } catch (e) {
            console.error('Error moving room cross-complex:', e);
            toast({
                title: 'Error',
                description: 'Failed to move room.',
                variant: 'destructive'
            });
        }
    };
    const moveFacilityAnywhere = async (fromComplexId, toComplexId, from, to, facilityId)=>{
        if (fromComplexId === toComplexId) {
            return moveFacility(fromComplexId, from, to, facilityId);
        }
        const duplicateInTarget = (comp, name)=>{
            if (!name) return false;
            const norm = name.trim().toLowerCase();
            if (to.level === 'complex') return (comp.facilities || []).some((f)=>f.name.trim().toLowerCase() === norm);
            const b = comp.buildings.find((b)=>b.id === to.buildingId);
            if (!b) return false;
            if (to.level === 'building') return (b.facilities || []).some((f)=>f.name.trim().toLowerCase() === norm);
            const fl = b.floors.find((fl)=>fl.id === to.floorId);
            return (fl?.facilities || []).some((f)=>f.name.trim().toLowerCase() === norm);
        };
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const srcIndex = residences.findIndex((r)=>r.id === fromComplexId);
                const dstIndex = residences.findIndex((r)=>r.id === toComplexId);
                if (srcIndex < 0 || dstIndex < 0) return;
                const src = residences[srcIndex];
                const dst = residences[dstIndex];
                // locate facility
                const getFrom = ()=>{
                    if (from.level === 'complex') return (src.facilities || []).find((f)=>f.id === facilityId);
                    const b = src.buildings.find((b)=>b.id === from.buildingId);
                    if (!b) return undefined;
                    if (from.level === 'building') return (b.facilities || []).find((f)=>f.id === facilityId);
                    const fl = b.floors.find((fl)=>fl.id === from.floorId);
                    return (fl?.facilities || []).find((f)=>f.id === facilityId);
                };
                const fac = getFrom();
                if (!fac) return;
                if (duplicateInTarget(dst, fac.name)) {
                    toast({
                        title: 'مكرر',
                        description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.',
                        variant: 'destructive'
                    });
                    return;
                }
                // build updated residences
                const updated = residences.map((c)=>{
                    if (c.id === fromComplexId) {
                        // remove
                        const removeFrom = (cc)=>{
                            if (from.level === 'complex') return {
                                ...cc,
                                facilities: (cc.facilities || []).filter((f)=>f.id !== facilityId)
                            };
                            return {
                                ...cc,
                                buildings: cc.buildings.map((b)=>{
                                    if (from.level === 'building' && b.id === from.buildingId) return {
                                        ...b,
                                        facilities: (b.facilities || []).filter((f)=>f.id !== facilityId)
                                    };
                                    if (from.level === 'floor' && b.id === from.buildingId) return {
                                        ...b,
                                        floors: b.floors.map((fl)=>fl.id === from.floorId ? {
                                                ...fl,
                                                facilities: (fl.facilities || []).filter((f)=>f.id !== facilityId)
                                            } : fl)
                                    };
                                    return b;
                                })
                            };
                        };
                        return removeFrom(c);
                    }
                    if (c.id === toComplexId) {
                        // add
                        const addTo = (cc)=>{
                            if (to.level === 'complex') return {
                                ...cc,
                                facilities: [
                                    ...cc.facilities || [],
                                    fac
                                ]
                            };
                            return {
                                ...cc,
                                buildings: cc.buildings.map((b)=>{
                                    if (to.level === 'building' && b.id === to.buildingId) return {
                                        ...b,
                                        facilities: [
                                            ...b.facilities || [],
                                            fac
                                        ]
                                    };
                                    if (to.level === 'floor' && b.id === to.buildingId) return {
                                        ...b,
                                        floors: b.floors.map((fl)=>fl.id === to.floorId ? {
                                                ...fl,
                                                facilities: [
                                                    ...fl.facilities || [],
                                                    fac
                                                ]
                                            } : fl)
                                    };
                                    return b;
                                })
                            };
                        };
                        return addTo(c);
                    }
                    return c;
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Facility moved.'
                });
            } catch (e) {
                console.error('Error moving facility cross-complex (local):', e);
                toast({
                    title: 'Error',
                    description: 'Failed to move facility locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const [fromRef, toRef] = [
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', fromComplexId),
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', toComplexId)
            ];
            const [fromSnap, toSnap] = await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(fromRef),
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(toRef)
            ]);
            if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Complex not found');
            const fromData = fromSnap.data();
            const toData = toSnap.data();
            // locate facility and duplicate guard
            const findFrom = ()=>{
                if (from.level === 'complex') return (fromData.facilities || []).find((f)=>f.id === facilityId);
                const b = fromData.buildings.find((b)=>b.id === from.buildingId);
                if (!b) return undefined;
                if (from.level === 'building') return (b.facilities || []).find((f)=>f.id === facilityId);
                const fl = b.floors.find((fl)=>fl.id === from.floorId);
                return (fl?.facilities || []).find((f)=>f.id === facilityId);
            };
            const fac = findFrom();
            if (!fac) throw new Error('Facility not found');
            if (duplicateInTarget(toData, fac.name)) {
                toast({
                    title: 'مكرر',
                    description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.',
                    variant: 'destructive'
                });
                return;
            }
            const removeFrom = (c)=>{
                if (from.level === 'complex') return {
                    ...c,
                    facilities: (c.facilities || []).filter((f)=>f.id !== facilityId)
                };
                return {
                    ...c,
                    buildings: c.buildings.map((b)=>{
                        if (from.level === 'building' && b.id === from.buildingId) return {
                            ...b,
                            facilities: (b.facilities || []).filter((f)=>f.id !== facilityId)
                        };
                        if (from.level === 'floor' && b.id === from.buildingId) return {
                            ...b,
                            floors: b.floors.map((fl)=>fl.id === from.floorId ? {
                                    ...fl,
                                    facilities: (fl.facilities || []).filter((f)=>f.id !== facilityId)
                                } : fl)
                        };
                        return b;
                    })
                };
            };
            const addTo = (c)=>{
                if (to.level === 'complex') return {
                    ...c,
                    facilities: [
                        ...c.facilities || [],
                        fac
                    ]
                };
                return {
                    ...c,
                    buildings: c.buildings.map((b)=>{
                        if (to.level === 'building' && b.id === to.buildingId) return {
                            ...b,
                            facilities: [
                                ...b.facilities || [],
                                fac
                            ]
                        };
                        if (to.level === 'floor' && b.id === to.buildingId) return {
                            ...b,
                            floors: b.floors.map((fl)=>fl.id === to.floorId ? {
                                    ...fl,
                                    facilities: [
                                        ...fl.facilities || [],
                                        fac
                                    ]
                                } : fl)
                        };
                        return b;
                    })
                };
            };
            const updatedFrom = removeFrom(fromData);
            const updatedTo = addTo(toData);
            await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(fromRef, {
                    buildings: updatedFrom.buildings,
                    facilities: updatedFrom.facilities || []
                }),
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(toRef, {
                    buildings: updatedTo.buildings,
                    facilities: updatedTo.facilities || []
                })
            ]);
            toast({
                title: 'Success',
                description: 'Facility moved.'
            });
        } catch (e) {
            console.error('Error moving facility cross-complex:', e);
            toast({
                title: 'Error',
                description: 'Failed to move facility.',
                variant: 'destructive'
            });
        }
    };
    const moveRoom = async (complexId, buildingId, fromFloorId, toFloorId, roomId)=>{
        if (fromFloorId === toFloorId) return; // nothing to do
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const current = residences.find((r)=>r.id === complexId);
                if (current) {
                    const building = current.buildings.find((b)=>b.id === buildingId);
                    const toFloor = building?.floors.find((f)=>f.id === toFloorId);
                    const room = building?.floors.find((f)=>f.id === fromFloorId)?.rooms.find((r)=>r.id === roomId);
                    if (toFloor && room && toFloor.rooms.some((r)=>r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
                        toast({
                            title: 'مكرر',
                            description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.',
                            variant: 'destructive'
                        });
                        return;
                    }
                }
                const updated = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    return {
                        ...c,
                        buildings: c.buildings.map((b)=>{
                            if (b.id !== buildingId) return b;
                            let movingRoom;
                            const newFloors = b.floors.map((f)=>{
                                if (f.id === fromFloorId) {
                                    const remaining = f.rooms.filter((r)=>{
                                        if (r.id === roomId) {
                                            movingRoom = {
                                                ...r,
                                                floorId: toFloorId
                                            };
                                            return false;
                                        }
                                        return true;
                                    });
                                }
                                return f;
                            }).map((f)=>{
                                if (f.id === toFloorId && movingRoom) {
                                    return {
                                        ...f,
                                        rooms: [
                                            ...f.rooms,
                                            movingRoom
                                        ]
                                    };
                                }
                                return f;
                            });
                            return {
                                ...b,
                                floors: newFloors
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Room moved (locally).'
                });
            } catch (error) {
                console.error('Error moving room locally:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to move room locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const complexRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexRef);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            // Duplicate guard on target floor
            const b = data.buildings.find((b)=>b.id === buildingId);
            const toFloor = b?.floors.find((f)=>f.id === toFloorId);
            const room = b?.floors.find((f)=>f.id === fromFloorId)?.rooms.find((r)=>r.id === roomId);
            if (toFloor && room && toFloor.rooms.some((r)=>r.name.trim().toLowerCase() === room.name.trim().toLowerCase())) {
                toast({
                    title: 'مكرر',
                    description: 'يوجد غرفة بنفس الاسم في الطابق الهدف. النقل مرفوض.',
                    variant: 'destructive'
                });
                return;
            }
            const updatedBuildings = data.buildings.map((b)=>{
                if (b.id !== buildingId) return b;
                let roomToMove;
                const floorsAfterRemoval = b.floors.map((f)=>{
                    if (f.id === fromFloorId) {
                        const remaining = f.rooms.filter((r)=>{
                            if (r.id === roomId) {
                                roomToMove = {
                                    ...r,
                                    floorId: toFloorId
                                };
                                return false;
                            }
                            return true;
                        });
                        return {
                            ...f,
                            rooms: remaining
                        };
                    }
                    return f;
                });
                const floorsAfterAdd = floorsAfterRemoval.map((f)=>{
                    if (f.id === toFloorId && roomToMove) {
                        return {
                            ...f,
                            rooms: [
                                ...f.rooms,
                                roomToMove
                            ]
                        };
                    }
                    return f;
                });
                return {
                    ...b,
                    floors: floorsAfterAdd
                };
            });
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                buildings: updatedBuildings
            });
            toast({
                title: 'Success',
                description: 'Room moved.'
            });
        } catch (e) {
            console.error('Error moving room:', e);
            toast({
                title: 'Error',
                description: 'Failed to move room.',
                variant: 'destructive'
            });
        }
    };
    const updateComplex = async (id, payload)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Local mode: update residences and sync local users manager linkage
            try {
                const prev = residences.find((r)=>r.id === id);
                const updatedList = residences.map((r)=>r.id === id ? {
                        ...r,
                        ...payload
                    } : r);
                setResidences(updatedList);
                saveToLocalStorage(updatedList);
                // Sync users: remove from old manager, add to new manager
                try {
                    const storedUsers = localStorage.getItem('estatecare_users');
                    if (storedUsers) {
                        const usersData = JSON.parse(storedUsers);
                        const updatedUsers = usersData.map((u)=>{
                            let assigned = Array.isArray(u.assignedResidences) ? u.assignedResidences : [];
                            // Remove from previous manager
                            if (prev && prev.managerId && u.id === prev.managerId && prev.managerId !== payload.managerId) {
                                assigned = assigned.filter((rid)=>rid !== id);
                            }
                            // Add to new manager
                            if (payload.managerId && u.id === payload.managerId) {
                                assigned = Array.from(new Set([
                                    ...assigned,
                                    id
                                ]));
                            }
                            return {
                                ...u,
                                assignedResidences: assigned
                            };
                        });
                        localStorage.setItem('estatecare_users', JSON.stringify(updatedUsers));
                    }
                } catch (e) {
                    console.warn('Local users sync failed (updateComplex):', e);
                }
                toast({
                    title: "Success",
                    description: "Complex details updated (locally)."
                });
            } catch (e) {
                console.error('updateComplex local error:', e);
                toast({
                    title: 'Error',
                    description: 'Failed to update complex locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const complexDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences", id);
            // Fetch previous to compare managerId
            const prevSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexDocRef);
            const prevData = prevSnap.exists() ? prevSnap.data() : undefined;
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, payload);
            // Sync user documents if manager changed
            const prevManagerId = prevData?.managerId;
            const newManagerId = payload.managerId;
            if (prevManagerId && prevManagerId !== newManagerId) {
                try {
                    await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'users', prevManagerId), {
                        assignedResidences: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["arrayRemove"])(id)
                    });
                } catch (e) {
                    console.warn('Failed to remove residence from previous manager:', e);
                }
            }
            if (newManagerId && newManagerId !== prevManagerId) {
                try {
                    // Use set with merge to handle missing user doc
                    await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'users', newManagerId), {
                        assignedResidences: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["arrayUnion"])(id)
                    }, {
                        merge: true
                    });
                } catch (e) {
                    console.warn('Failed to add residence to new manager:', e);
                }
            }
            toast({
                title: "Success",
                description: "Complex details updated."
            });
        } catch (error) {
            console.error("Error updating complex:", error);
            toast({
                title: "Error",
                description: "Failed to update complex.",
                variant: "destructive"
            });
        }
    };
    const addBuilding = async (complexId, name)=>{
        const trimmedName = name.trim();
        const targetComplex = residences.find((c)=>c.id === complexId);
        if (!targetComplex) {
            toast({
                title: "Error",
                description: "Complex not found.",
                variant: "destructive"
            });
            return;
        }
        if (targetComplex.buildings.some((b)=>b.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast({
                title: "Error",
                description: "A building with this name already exists in this complex.",
                variant: "destructive"
            });
            return;
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const newBuilding = {
                    id: `building-${Date.now()}`,
                    name: trimmedName,
                    floors: [],
                    facilities: []
                };
                const updatedResidences = residences.map((c)=>c.id === complexId ? {
                        ...c,
                        buildings: [
                            ...c.buildings,
                            newBuilding
                        ]
                    } : c);
                setResidences(updatedResidences);
                saveToLocalStorage(updatedResidences);
                toast({
                    title: "Success",
                    description: "New building added to the complex (locally)."
                });
            } catch (error) {
                console.error("Error saving to localStorage:", error);
                toast({
                    title: "Error",
                    description: "Failed to add building locally.",
                    variant: "destructive"
                });
            }
            return;
        }
        try {
            const complexDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences", complexId);
            const complexDoc = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexDocRef);
            if (!complexDoc.exists()) throw new Error("Complex not found");
            const complexData = complexDoc.data();
            const newBuilding = {
                id: `building-${Date.now()}`,
                name: trimmedName,
                floors: [],
                facilities: []
            };
            const updatedBuildings = [
                ...complexData.buildings,
                newBuilding
            ];
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                buildings: updatedBuildings
            });
            toast({
                title: "Success",
                description: "New building added to the complex."
            });
        } catch (error) {
            console.error("Error adding building:", error);
            toast({
                title: "Error",
                description: "Failed to add building.",
                variant: "destructive"
            });
        }
    };
    const addFloor = async (complexId, buildingId, name)=>{
        const trimmedName = name.trim();
        const newFloor = {
            id: `floor-${Date.now()}`,
            name: trimmedName,
            rooms: [],
            facilities: []
        };
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updatedResidences = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    return {
                        ...c,
                        buildings: c.buildings.map((b)=>{
                            if (b.id !== buildingId) return b;
                            const floors = Array.isArray(b.floors) ? b.floors : [];
                            if (floors.some((f)=>f.name.toLowerCase() === trimmedName.toLowerCase())) {
                                throw new Error("A floor with this name already exists in this building.");
                            }
                            return {
                                ...b,
                                floors: [
                                    ...floors,
                                    newFloor
                                ]
                            };
                        })
                    };
                });
                setResidences(updatedResidences);
                saveToLocalStorage(updatedResidences);
                toast({
                    title: "Success",
                    description: "New floor added to the building (locally)."
                });
            } catch (error) {
                console.error("Error adding floor locally:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to add floor locally.",
                    variant: "destructive"
                });
            }
            return;
        }
        try {
            const complexDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences", complexId);
            const complexDoc = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexDocRef);
            if (!complexDoc.exists()) throw new Error("Complex not found");
            const complexData = complexDoc.data();
            const targetBuilding = (complexData.buildings || []).find((b)=>b.id === buildingId);
            if (!targetBuilding) {
                toast({
                    title: "Error",
                    description: "Building not found.",
                    variant: "destructive"
                });
                return;
            }
            const existingFloors = Array.isArray(targetBuilding.floors) ? targetBuilding.floors : [];
            if (existingFloors.some((f)=>f.name.toLowerCase() === trimmedName.toLowerCase())) {
                toast({
                    title: "Error",
                    description: "A floor with this name already exists in this building.",
                    variant: "destructive"
                });
                return;
            }
            const updatedBuildings = complexData.buildings.map((b)=>b.id === buildingId ? {
                    ...b,
                    floors: [
                        ...Array.isArray(b.floors) ? b.floors : [],
                        newFloor
                    ]
                } : b);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                buildings: updatedBuildings
            });
            toast({
                title: "Success",
                description: "New floor added to the building."
            });
        } catch (error) {
            console.error("Error adding floor:", error);
            toast({
                title: "Error",
                description: "Failed to add floor.",
                variant: "destructive"
            });
        }
    };
    const addRoom = async (complexId, buildingId, floorId, name, length, width, area)=>{
        const trimmedName = name.trim();
        const newRoom = {
            id: `room-${Date.now()}`,
            name: trimmedName
        };
        if (typeof length === 'number' && typeof width === 'number' && !isNaN(length) && !isNaN(width)) {
            const computedArea = length * width;
            newRoom.length = length;
            newRoom.width = width;
            newRoom.area = computedArea;
            newRoom.capacity = Math.max(1, Math.floor(computedArea / 4));
        } else if (typeof area === 'number' && !isNaN(area)) {
            newRoom.area = area;
            newRoom.capacity = Math.max(1, Math.floor(area / 4));
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updatedResidences = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    return {
                        ...c,
                        buildings: (c.buildings || []).map((b)=>{
                            if (b.id !== buildingId) return b;
                            const floors = Array.isArray(b.floors) ? b.floors : [];
                            const targetFloor = floors.find((f)=>f.id === floorId);
                            if (!targetFloor) throw new Error("Floor not found.");
                            const existingRooms = Array.isArray(targetFloor.rooms) ? targetFloor.rooms : [];
                            if (existingRooms.some((r)=>r.name.toLowerCase() === trimmedName.toLowerCase())) {
                                throw new Error("A room with this name already exists on this floor.");
                            }
                            return {
                                ...b,
                                floors: floors.map((f)=>f.id === floorId ? {
                                        ...f,
                                        rooms: [
                                            ...existingRooms,
                                            newRoom
                                        ]
                                    } : f)
                            };
                        })
                    };
                });
                setResidences(updatedResidences);
                saveToLocalStorage(updatedResidences);
                toast({
                    title: "Success",
                    description: "New room added to the floor (locally)."
                });
            } catch (error) {
                console.error("Error adding room locally:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to add room locally.",
                    variant: "destructive"
                });
            }
            return;
        }
        try {
            const complexDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences", complexId);
            const complexDoc = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexDocRef);
            if (!complexDoc.exists()) throw new Error("Complex not found");
            const complexData = complexDoc.data();
            const building = (complexData.buildings || []).find((b)=>b.id === buildingId);
            const floor = building ? Array.isArray(building.floors) ? building.floors.find((f)=>f.id === floorId) : undefined : undefined;
            if (!building) {
                toast({
                    title: "Error",
                    description: "Building not found.",
                    variant: "destructive"
                });
                return;
            }
            if (!floor) {
                toast({
                    title: "Error",
                    description: "Floor not found.",
                    variant: "destructive"
                });
                return;
            }
            const existingRooms = Array.isArray(floor.rooms) ? floor.rooms : [];
            if (existingRooms.some((r)=>r.name.toLowerCase() === trimmedName.toLowerCase())) {
                toast({
                    title: "Error",
                    description: "A room with this name already exists on this floor.",
                    variant: "destructive"
                });
                return;
            }
            const updatedBuildings = complexData.buildings.map((b)=>b.id === buildingId ? {
                    ...b,
                    floors: (Array.isArray(b.floors) ? b.floors : []).map((f)=>f.id === floorId ? {
                            ...f,
                            rooms: [
                                ...Array.isArray(f.rooms) ? f.rooms : [],
                                newRoom
                            ]
                        } : f)
                } : b);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                buildings: updatedBuildings
            });
            toast({
                title: "Success",
                description: "New room added to the floor."
            });
        } catch (error) {
            console.error("Error adding room:", error);
            toast({
                title: "Error",
                description: "Failed to add room.",
                variant: "destructive"
            });
        }
    };
    const addMultipleRooms = async (complexId, buildingId, floorId, roomNames)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return;
        }
        try {
            const complexDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences", complexId);
            const complexDoc = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexDocRef);
            if (!complexDoc.exists()) throw new Error("Complex not found");
            const complexData = complexDoc.data();
            const building = complexData.buildings.find((b)=>b.id === buildingId);
            const floor = building?.floors.find((f)=>f.id === floorId);
            if (!floor) {
                toast({
                    title: "Error",
                    description: "Target floor not found.",
                    variant: "destructive"
                });
                return;
            }
            const existingRoomNames = new Set(floor.rooms.map((r)=>r.name.toLowerCase()));
            const newRooms = roomNames.map((name)=>name.trim()).filter((name)=>name).filter((name)=>!existingRoomNames.has(name.toLowerCase())).map((name)=>{
                const room = {
                    id: `room-${Date.now()}-${Math.random()}`,
                    name
                };
                // support creating rooms with optional area or dimensions specified in the name using syntax
                // "Room 101|20" -> area, or "Room 101|5x4" -> length x width
                const parts = name.split('|').map((p)=>p.trim());
                if (parts.length === 2) {
                    const spec = parts[1];
                    // dimensions like 5x4 or 5×4
                    const dimMatch = spec.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)$/);
                    if (dimMatch) {
                        const l = Number(dimMatch[1]);
                        const w = Number(dimMatch[2]);
                        if (!isNaN(l) && !isNaN(w)) {
                            room.name = parts[0];
                            room.length = l;
                            room.width = w;
                            room.area = l * w;
                            room.capacity = Math.max(1, Math.floor(room.area / 4));
                        }
                    } else if (!isNaN(Number(spec))) {
                        room.name = parts[0];
                        room.area = Number(spec);
                        room.capacity = Math.max(1, Math.floor(room.area / 4));
                    }
                }
                return room;
            });
            const addedCount = newRooms.length;
            const skippedCount = roomNames.length - addedCount;
            if (addedCount === 0) {
                toast({
                    title: "No rooms added",
                    description: "All specified rooms already exist on this floor.",
                    variant: "default"
                });
                return;
            }
            const updatedBuildings = complexData.buildings.map((b)=>b.id === buildingId ? {
                    ...b,
                    floors: b.floors.map((f)=>f.id === floorId ? {
                            ...f,
                            rooms: [
                                ...f.rooms,
                                ...newRooms
                            ]
                        } : f)
                } : b);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                buildings: updatedBuildings
            });
            let toastDescription = `Added ${addedCount} new rooms.`;
            if (skippedCount > 0) {
                toastDescription += ` Skipped ${skippedCount} duplicate rooms.`;
            }
            toast({
                title: "Success",
                description: toastDescription
            });
        } catch (error) {
            console.error("Error adding multiple rooms:", error);
            toast({
                title: "Error",
                description: "Failed to add rooms.",
                variant: "destructive"
            });
        }
    };
    const addFacility = async (complexId, level, name, type, quantity, buildingId, floorId)=>{
        const newFacilities = [];
        for(let i = 1; i <= quantity; i++){
            const facilityName = quantity > 1 ? `${name} ${i}` : name;
            newFacilities.push({
                id: `facility-${Date.now()}-${Math.random()}`,
                name: facilityName,
                type: type.trim()
            });
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Local storage implementation
            try {
                const updated = residences.map((complex)=>{
                    if (complex.id !== complexId) return complex;
                    if (level === 'complex') {
                        const existingFacilities = complex.facilities || [];
                        return {
                            ...complex,
                            facilities: [
                                ...existingFacilities,
                                ...newFacilities
                            ]
                        };
                    }
                    return {
                        ...complex,
                        buildings: complex.buildings.map((building)=>{
                            if (building.id !== buildingId) return building;
                            if (level === 'building') {
                                const existingFacilities = building.facilities || [];
                                return {
                                    ...building,
                                    facilities: [
                                        ...existingFacilities,
                                        ...newFacilities
                                    ]
                                };
                            }
                            // level === 'floor'
                            return {
                                ...building,
                                floors: building.floors.map((floor)=>{
                                    if (floor.id !== floorId) return floor;
                                    const existingFacilities = floor.facilities || [];
                                    return {
                                        ...floor,
                                        facilities: [
                                            ...existingFacilities,
                                            ...newFacilities
                                        ]
                                    };
                                })
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: "Success",
                    description: `Added ${quantity} new facility/facilities (locally).`
                });
                return;
            } catch (error) {
                console.error("Error adding facility locally:", error);
                toast({
                    title: "Error",
                    description: "Failed to add facility locally.",
                    variant: "destructive"
                });
                return;
            }
        }
        try {
            const complexDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences", complexId);
            const complexDoc = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexDocRef);
            if (!complexDoc.exists()) throw new Error("Complex not found");
            const complexData = complexDoc.data();
            const newFacilitiesForFirebase = [];
            for(let i = 1; i <= quantity; i++){
                const facilityName = quantity > 1 ? `${name} ${i}` : name;
                newFacilitiesForFirebase.push({
                    id: `facility-${Date.now()}-${Math.random()}`,
                    name: facilityName,
                    type: type.trim()
                });
            }
            if (level === 'complex') {
                const existingFacilities = complexData.facilities || [];
                const updatedFacilities = [
                    ...existingFacilities,
                    ...newFacilitiesForFirebase
                ];
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                    facilities: updatedFacilities
                });
            } else if (level === 'building' && buildingId) {
                const updatedBuildings = complexData.buildings.map((b)=>{
                    if (b.id === buildingId) {
                        const existingFacilities = b.facilities || [];
                        return {
                            ...b,
                            facilities: [
                                ...existingFacilities,
                                ...newFacilitiesForFirebase
                            ]
                        };
                    }
                    return b;
                });
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                    buildings: updatedBuildings
                });
            } else if (level === 'floor' && buildingId && floorId) {
                const updatedBuildings = complexData.buildings.map((b)=>{
                    if (b.id === buildingId) {
                        return {
                            ...b,
                            floors: b.floors.map((f)=>{
                                if (f.id === floorId) {
                                    const existingFacilities = f.facilities || [];
                                    return {
                                        ...f,
                                        facilities: [
                                            ...existingFacilities,
                                            ...newFacilitiesForFirebase
                                        ]
                                    };
                                }
                                return f;
                            })
                        };
                    }
                    return b;
                });
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                    buildings: updatedBuildings
                });
            }
            toast({
                title: "Success",
                description: `Added ${quantity} new facility/facilities.`
            });
        } catch (error) {
            console.error("Error adding facility:", error);
            toast({
                title: "Error",
                description: "Failed to add facility.",
                variant: "destructive"
            });
        }
    };
    const deleteComplex = async (id)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updatedResidences = residences.filter((r)=>r.id !== id);
                setResidences(updatedResidences);
                saveToLocalStorage(updatedResidences);
                toast({
                    title: "Success",
                    description: "Complex deleted successfully (locally)."
                });
            } catch (error) {
                console.error("Error deleting from localStorage:", error);
                toast({
                    title: "Error",
                    description: "Failed to delete complex locally.",
                    variant: "destructive"
                });
            }
            return;
        }
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "residences", id));
        toast({
            title: "Success",
            description: "Complex deleted successfully."
        });
    };
    const deleteBuilding = async (complexId, buildingId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>c.id === complexId ? {
                        ...c,
                        buildings: c.buildings.filter((b)=>b.id !== buildingId)
                    } : c);
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Building deleted (locally).'
                });
            } catch (error) {
                console.error('Error deleting building locally:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to delete building locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const complexRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexRef);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            const updatedBuildings = (data.buildings || []).filter((b)=>b.id !== buildingId);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                buildings: updatedBuildings
            });
            toast({
                title: 'Success',
                description: 'Building deleted.'
            });
        } catch (e) {
            console.error('Error deleting building:', e);
            toast({
                title: 'Error',
                description: 'Failed to delete building.',
                variant: 'destructive'
            });
        }
    };
    const deleteFloor = async (complexId, buildingId, floorId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    return {
                        ...c,
                        buildings: c.buildings.map((b)=>b.id === buildingId ? {
                                ...b,
                                floors: b.floors.filter((f)=>f.id !== floorId)
                            } : b)
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Floor deleted (locally).'
                });
            } catch (error) {
                console.error('Error deleting floor locally:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to delete floor locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const complexRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexRef);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            const updatedBuildings = data.buildings.map((b)=>b.id === buildingId ? {
                    ...b,
                    floors: b.floors.filter((f)=>f.id !== floorId)
                } : b);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                buildings: updatedBuildings
            });
            toast({
                title: 'Success',
                description: 'Floor deleted.'
            });
        } catch (e) {
            console.error('Error deleting floor:', e);
            toast({
                title: 'Error',
                description: 'Failed to delete floor.',
                variant: 'destructive'
            });
        }
    };
    const deleteRoom = async (complexId, buildingId, floorId, roomId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    return {
                        ...c,
                        buildings: c.buildings.map((b)=>{
                            if (b.id !== buildingId) return b;
                            return {
                                ...b,
                                floors: b.floors.map((f)=>f.id === floorId ? {
                                        ...f,
                                        rooms: f.rooms.filter((r)=>r.id !== roomId)
                                    } : f)
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Room deleted (locally).'
                });
            } catch (error) {
                console.error('Error deleting room locally:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to delete room locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const complexRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexRef);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            const updatedBuildings = data.buildings.map((b)=>{
                if (b.id !== buildingId) return b;
                return {
                    ...b,
                    floors: b.floors.map((f)=>f.id === floorId ? {
                            ...f,
                            rooms: f.rooms.filter((r)=>r.id !== roomId)
                        } : f)
                };
            });
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                buildings: updatedBuildings
            });
            toast({
                title: 'Success',
                description: 'Room deleted.'
            });
        } catch (e) {
            console.error('Error deleting room:', e);
            toast({
                title: 'Error',
                description: 'Failed to delete room.',
                variant: 'destructive'
            });
        }
    };
    const deleteFacility = async (complexId, facilityId, level, buildingId, floorId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((c)=>{
                    if (c.id !== complexId) return c;
                    if (level === 'complex') {
                        return {
                            ...c,
                            facilities: (c.facilities || []).filter((f)=>f.id !== facilityId)
                        };
                    }
                    if (level === 'building' && buildingId) {
                        return {
                            ...c,
                            buildings: c.buildings.map((b)=>b.id === buildingId ? {
                                    ...b,
                                    facilities: (b.facilities || []).filter((f)=>f.id !== facilityId)
                                } : b)
                        };
                    }
                    if (level === 'floor' && buildingId && floorId) {
                        return {
                            ...c,
                            buildings: c.buildings.map((b)=>b.id === buildingId ? {
                                    ...b,
                                    floors: b.floors.map((f)=>f.id === floorId ? {
                                            ...f,
                                            facilities: (f.facilities || []).filter((fc)=>fc.id !== facilityId)
                                        } : f)
                                } : b)
                        };
                    }
                    return c;
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Facility deleted (locally).'
                });
            } catch (error) {
                console.error('Error deleting facility locally:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to delete facility locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const complexRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexRef);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            if (level === 'complex') {
                const updatedFacilities = (data.facilities || []).filter((f)=>f.id !== facilityId);
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                    facilities: updatedFacilities
                });
            } else if (level === 'building' && buildingId) {
                const updatedBuildings = data.buildings.map((b)=>b.id === buildingId ? {
                        ...b,
                        facilities: (b.facilities || []).filter((f)=>f.id !== facilityId)
                    } : b);
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                    buildings: updatedBuildings
                });
            } else if (level === 'floor' && buildingId && floorId) {
                const updatedBuildings = data.buildings.map((b)=>b.id === buildingId ? {
                        ...b,
                        floors: b.floors.map((f)=>f.id === floorId ? {
                                ...f,
                                facilities: (f.facilities || []).filter((fc)=>fc.id !== facilityId)
                            } : f)
                    } : b);
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                    buildings: updatedBuildings
                });
            }
            toast({
                title: 'Success',
                description: 'Facility deleted.'
            });
        } catch (e) {
            console.error('Error deleting facility:', e);
            toast({
                title: 'Error',
                description: 'Failed to delete facility.',
                variant: 'destructive'
            });
        }
    };
    const moveFacility = async (complexId, from, to, facilityId)=>{
        if (from.level === to.level && from.buildingId === to.buildingId && from.floorId === to.floorId) return;
        const getFacilityById = (c)=>{
            if (from.level === 'complex') return (c.facilities || []).find((f)=>f.id === facilityId);
            const b = c.buildings.find((b)=>b.id === from.buildingId);
            if (!b) return undefined;
            if (from.level === 'building') return (b.facilities || []).find((f)=>f.id === facilityId);
            const fl = b.floors.find((fl)=>fl.id === from.floorId);
            return (fl?.facilities || []).find((f)=>f.id === facilityId);
        };
        const targetHasDuplicate = (c, name)=>{
            if (!name) return false;
            const norm = name.trim().toLowerCase();
            if (to.level === 'complex') return (c.facilities || []).some((f)=>f.name.trim().toLowerCase() === norm);
            const b = c.buildings.find((b)=>b.id === to.buildingId);
            if (!b) return false;
            if (to.level === 'building') return (b.facilities || []).some((f)=>f.name.trim().toLowerCase() === norm);
            const fl = b.floors.find((fl)=>fl.id === to.floorId);
            return (fl?.facilities || []).some((f)=>f.name.trim().toLowerCase() === norm);
        };
        const applyMove = (data)=>{
            let moved;
            const removeFrom = (c)=>{
                if (from.level === 'complex') {
                    const rem = (c.facilities || []).filter((f)=>{
                        if (f.id === facilityId) {
                            moved = f;
                            return false;
                        }
                        return true;
                    });
                    return {
                        ...c,
                        facilities: rem
                    };
                }
                return {
                    ...c,
                    buildings: c.buildings.map((b)=>{
                        if (from.level === 'building' && b.id === from.buildingId) {
                            const rem = (b.facilities || []).filter((f)=>{
                                if (f.id === facilityId) {
                                    moved = f;
                                    return false;
                                }
                                return true;
                            });
                            return {
                                ...b,
                                facilities: rem
                            };
                        }
                        if (from.level === 'floor' && b.id === from.buildingId) {
                            return {
                                ...b,
                                floors: b.floors.map((fl)=>{
                                    if (fl.id === from.floorId) {
                                        const rem = (fl.facilities || []).filter((f)=>{
                                            if (f.id === facilityId) {
                                                moved = f;
                                                return false;
                                            }
                                            return true;
                                        });
                                        return {
                                            ...fl,
                                            facilities: rem
                                        };
                                    }
                                    return fl;
                                })
                            };
                        }
                        return b;
                    })
                };
            };
            const addTo = (c)=>{
                if (!moved) return c;
                if (to.level === 'complex') {
                    return {
                        ...c,
                        facilities: [
                            ...c.facilities || [],
                            moved
                        ]
                    };
                }
                return {
                    ...c,
                    buildings: c.buildings.map((b)=>{
                        if (to.level === 'building' && b.id === to.buildingId) {
                            return {
                                ...b,
                                facilities: [
                                    ...b.facilities || [],
                                    moved
                                ]
                            };
                        }
                        if (to.level === 'floor' && b.id === to.buildingId) {
                            return {
                                ...b,
                                floors: b.floors.map((fl)=>fl.id === to.floorId ? {
                                        ...fl,
                                        facilities: [
                                            ...fl.facilities || [],
                                            moved
                                        ]
                                    } : fl)
                            };
                        }
                        return b;
                    })
                };
            };
            // duplicate guard before applying
            const fac = moved ?? getFacilityById(data);
            if (targetHasDuplicate(data, fac?.name)) {
                // Return original data unchanged when duplicate
                return data;
            }
            return addTo(removeFrom(data));
        };
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                // First check duplicate on current local state
                const current = residences.find((r)=>r.id === complexId);
                const toMove = current ? getFacilityById(current) : undefined;
                if (current && targetHasDuplicate(current, toMove?.name)) {
                    toast({
                        title: 'مكرر',
                        description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.',
                        variant: 'destructive'
                    });
                    return;
                }
                const updated = residences.map((r)=>r.id === complexId ? applyMove(r) : r);
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'Success',
                    description: 'Facility moved (local).'
                });
            } catch (e) {
                console.error('Error moving facility locally:', e);
                toast({
                    title: 'Error',
                    description: 'Failed to move facility locally.',
                    variant: 'destructive'
                });
            }
            return;
        }
        try {
            const complexRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(complexRef);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            // Duplicate guard on DB snapshot
            const facToMove = getFacilityById(data);
            if (targetHasDuplicate(data, facToMove?.name)) {
                toast({
                    title: 'مكرر',
                    description: 'يوجد تجهيز بنفس الاسم في الوجهة. النقل مرفوض.',
                    variant: 'destructive'
                });
                return;
            }
            const updated = applyMove(data);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexRef, {
                buildings: updated.buildings,
                facilities: updated.facilities || []
            });
            toast({
                title: 'Success',
                description: 'Facility moved.'
            });
        } catch (e) {
            console.error('Error moving facility:', e);
            toast({
                title: 'Error',
                description: 'Failed to move facility.',
                variant: 'destructive'
            });
        }
    };
    // Disable/Enable residence with stock check
    const checkResidenceHasStock = async (residenceId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Cannot check without DB; assume no stock
            return false;
        }
        try {
            const invSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory'));
            for (const d of invSnap.docs){
                const data = d.data();
                const stockByResidence = data.stockByResidence || {};
                const val = Number(stockByResidence[residenceId] || 0);
                if (!isNaN(val) && val > 0) return true;
            }
            return false;
        } catch (e) {
            console.error('Error checking residence stock:', e);
            return true; // fail-safe: prevent disabling on error
        }
    };
    const setResidenceDisabled = async (id, disabled)=>{
        if (disabled) {
            const hasStock = await checkResidenceHasStock(id);
            if (hasStock) {
                toast({
                    title: 'Cannot disable',
                    description: 'Residence has stock. Please transfer or adjust to zero stock before disabling.',
                    variant: 'destructive'
                });
                return;
            }
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Local storage path
            const updated = residences.map((r)=>r.id === id ? {
                    ...r,
                    disabled
                } : r);
            setResidences(updated);
            saveToLocalStorage(updated);
            toast({
                title: 'Success',
                description: disabled ? 'Residence disabled (local).' : 'Residence enabled (local).'
            });
            return;
        }
        try {
            const complexDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', id);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(complexDocRef, {
                disabled
            });
            toast({
                title: 'Success',
                description: disabled ? 'Residence disabled.' : 'Residence enabled.'
            });
        } catch (error) {
            console.error('Error updating residence disabled flag:', error);
            toast({
                title: 'Error',
                description: 'Failed to update residence status.',
                variant: 'destructive'
            });
        }
    };
    // New: Facility Component Management Functions
    const addFacilityComponent = async (complexId, facilityId, level, component, buildingId, floorId)=>{
        const newComponent = {
            ...component,
            id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Local storage implementation
            try {
                const updated = residences.map((complex)=>{
                    if (complex.id !== complexId) return complex;
                    if (level === 'complex') {
                        return {
                            ...complex,
                            facilities: (complex.facilities || []).map((f)=>f.id === facilityId ? {
                                    ...f,
                                    components: [
                                        ...f.components || [],
                                        newComponent
                                    ]
                                } : f)
                        };
                    }
                    return {
                        ...complex,
                        buildings: complex.buildings.map((building)=>{
                            if (building.id !== buildingId) return building;
                            if (level === 'building') {
                                return {
                                    ...building,
                                    facilities: (building.facilities || []).map((f)=>f.id === facilityId ? {
                                            ...f,
                                            components: [
                                                ...f.components || [],
                                                newComponent
                                            ]
                                        } : f)
                                };
                            }
                            // level === 'floor'
                            return {
                                ...building,
                                floors: building.floors.map((floor)=>{
                                    if (floor.id !== floorId) return floor;
                                    const updatedFloor = {
                                        ...floor,
                                        facilities: (floor.facilities || []).map((f)=>{
                                            if (f.id === facilityId) {
                                                return {
                                                    ...f,
                                                    components: [
                                                        ...f.components || [],
                                                        newComponent
                                                    ]
                                                };
                                            }
                                            return f;
                                        })
                                    };
                                    return updatedFloor;
                                })
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'تم',
                    description: 'تم إضافة المكون بنجاح.'
                });
            } catch (e) {
                console.error('addFacilityComponent local error:', e);
                toast({
                    title: 'خطأ',
                    description: 'فشل إضافة المكون محلياً.',
                    variant: 'destructive'
                });
            }
            return;
        }
        // Firebase implementation
        try {
            const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'residences', complexId);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
            if (!snap.exists()) throw new Error('Complex not found');
            const data = snap.data();
            let updated = {
                ...data
            };
            const addComponentToFacility = (facility)=>({
                    ...facility,
                    components: [
                        ...facility.components || [],
                        newComponent
                    ]
                });
            if (level === 'complex') {
                updated = {
                    ...updated,
                    facilities: (updated.facilities || []).map((f)=>f.id === facilityId ? addComponentToFacility(f) : f)
                };
            } else if (level === 'building' && buildingId) {
                updated = {
                    ...updated,
                    buildings: (updated.buildings || []).map((b)=>{
                        if (b.id !== buildingId) return b;
                        return {
                            ...b,
                            facilities: (b.facilities || []).map((f)=>f.id === facilityId ? addComponentToFacility(f) : f)
                        };
                    })
                };
            } else if (level === 'floor' && buildingId && floorId) {
                updated = {
                    ...updated,
                    buildings: (updated.buildings || []).map((b)=>{
                        if (b.id !== buildingId) return b;
                        return {
                            ...b,
                            floors: (b.floors || []).map((fl)=>{
                                if (fl.id !== floorId) return fl;
                                return {
                                    ...fl,
                                    facilities: (fl.facilities || []).map((f)=>f.id === facilityId ? addComponentToFacility(f) : f)
                                };
                            })
                        };
                    })
                };
            }
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(ref, {
                facilities: updated.facilities || [],
                buildings: updated.buildings || []
            });
            // Update local state immediately for responsive UI
            setResidences((prev)=>prev.map((c)=>c.id === complexId ? updated : c));
            toast({
                title: 'تم',
                description: 'تم إضافة المكون بنجاح.'
            });
        } catch (e) {
            console.error('addFacilityComponent Firebase error:', e);
            toast({
                title: 'خطأ',
                description: 'فشل إضافة المكون.',
                variant: 'destructive'
            });
        }
    };
    const updateFacilityComponent = async (complexId, facilityId, level, componentId, updates, buildingId, floorId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((complex)=>{
                    if (complex.id !== complexId) return complex;
                    const updateComponentInFacility = (facility)=>({
                            ...facility,
                            components: (facility.components || []).map((c)=>c.id === componentId ? {
                                    ...c,
                                    ...updates
                                } : c)
                        });
                    if (level === 'complex') {
                        return {
                            ...complex,
                            facilities: (complex.facilities || []).map((f)=>f.id === facilityId ? updateComponentInFacility(f) : f)
                        };
                    }
                    return {
                        ...complex,
                        buildings: complex.buildings.map((building)=>{
                            if (building.id !== buildingId) return building;
                            if (level === 'building') {
                                return {
                                    ...building,
                                    facilities: (building.facilities || []).map((f)=>f.id === facilityId ? updateComponentInFacility(f) : f)
                                };
                            }
                            return {
                                ...building,
                                floors: building.floors.map((floor)=>{
                                    if (floor.id !== floorId) return floor;
                                    return {
                                        ...floor,
                                        facilities: (floor.facilities || []).map((f)=>f.id === facilityId ? updateComponentInFacility(f) : f)
                                    };
                                })
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'تم',
                    description: 'تم تحديث المكون بنجاح.'
                });
            } catch (e) {
                console.error('updateFacilityComponent local error:', e);
                toast({
                    title: 'خطأ',
                    description: 'فشل تحديث المكون محلياً.',
                    variant: 'destructive'
                });
            }
            return;
        }
        // Firebase implementation would go here
        toast({
            title: 'تم',
            description: 'تم تحديث المكون بنجاح.'
        });
    };
    const deleteFacilityComponent = async (complexId, facilityId, level, componentId, buildingId, floorId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            try {
                const updated = residences.map((complex)=>{
                    if (complex.id !== complexId) return complex;
                    const removeComponentFromFacility = (facility)=>({
                            ...facility,
                            components: (facility.components || []).filter((c)=>c.id !== componentId)
                        });
                    if (level === 'complex') {
                        return {
                            ...complex,
                            facilities: (complex.facilities || []).map((f)=>f.id === facilityId ? removeComponentFromFacility(f) : f)
                        };
                    }
                    return {
                        ...complex,
                        buildings: complex.buildings.map((building)=>{
                            if (building.id !== buildingId) return building;
                            if (level === 'building') {
                                return {
                                    ...building,
                                    facilities: (building.facilities || []).map((f)=>f.id === facilityId ? removeComponentFromFacility(f) : f)
                                };
                            }
                            return {
                                ...building,
                                floors: building.floors.map((floor)=>{
                                    if (floor.id !== floorId) return floor;
                                    return {
                                        ...floor,
                                        facilities: (floor.facilities || []).map((f)=>f.id === facilityId ? removeComponentFromFacility(f) : f)
                                    };
                                })
                            };
                        })
                    };
                });
                setResidences(updated);
                saveToLocalStorage(updated);
                toast({
                    title: 'تم',
                    description: 'تم حذف المكون بنجاح.'
                });
            } catch (e) {
                console.error('deleteFacilityComponent local error:', e);
                toast({
                    title: 'خطأ',
                    description: 'فشل حذف المكون محلياً.',
                    variant: 'destructive'
                });
            }
            return;
        }
        // Firebase implementation would go here
        toast({
            title: 'تم',
            description: 'تم حذف المكون بنجاح.'
        });
    };
    const buildings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>residences?.flatMap((c)=>c.buildings || []) || [], [
        residences
    ]);
    const floors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>buildings?.flatMap((b)=>b?.floors || []) || [], [
        buildings
    ]);
    const rooms = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>floors?.flatMap((f)=>f?.rooms || []) || [], [
        floors
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ResidencesContext.Provider, {
        value: {
            residences,
            buildings,
            floors,
            rooms,
            loading,
            loadResidences,
            addComplex,
            updateComplex,
            addBuilding,
            addFloor,
            addRoom,
            addMultipleRooms,
            addFacility,
            moveFacility,
            moveFacilityAnywhere,
            moveRoomAnywhere,
            moveRoom,
            deleteComplex,
            deleteBuilding,
            deleteFloor,
            deleteRoom,
            deleteFacility,
            setResidenceDisabled,
            checkResidenceHasStock,
            // Expose rename helpers used by UI
            updateRoomName,
            updateFacilityName,
            updateFloorName,
            updateBuildingName,
            // New: Facility Component Management
            addFacilityComponent,
            updateFacilityComponent,
            deleteFacilityComponent
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/residences-context.tsx",
        lineNumber: 2130,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useResidences = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ResidencesContext);
    if (context === undefined) {
        throw new Error('useResidences must be used within a ResidencesProvider');
    }
    return context;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/context/inventory-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "InventoryProvider",
    ()=>InventoryProvider,
    "useInventory",
    ()=>useInventory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/users-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$residences$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/residences-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$notifications$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/notifications-context.tsx [app-ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$residences$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$residences$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
'use client';
;
;
;
;
;
;
;
;
const InventoryContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";
const INVENTORY_LOCAL_STORAGE_KEY = 'estatecare_inventory_items';
const INVENTORY_CATEGORIES_KEY = 'estatecare_inventory_categories';
const loadInventoryFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(INVENTORY_LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((item)=>({
                ...item,
                stock: Number(item.stock || 0),
                stockByResidence: item.stockByResidence || {},
                variants: item.variants || [],
                lifespanDays: item.lifespanDays ? Number(item.lifespanDays) : 0
            }));
    } catch (error) {
        console.error('Failed to load inventory from localStorage', error);
        return [];
    }
};
const saveInventoryToLocalStorage = (items)=>{
    try {
        localStorage.setItem(INVENTORY_LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
        console.error('Failed to save inventory to localStorage', error);
    }
};
const loadCategoriesFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(INVENTORY_CATEGORIES_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to load inventory categories from localStorage', error);
        return [];
    }
};
const saveCategoriesToLocalStorage = (categories)=>{
    try {
        localStorage.setItem(INVENTORY_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
        console.error('Failed to save inventory categories to localStorage', error);
    }
};
const MIV_DETAILS_LOCAL_STORAGE_KEY = 'estatecare_miv_details';
const MRV_DETAILS_LOCAL_STORAGE_KEY = 'estatecare_mrv_details';
const normalizeLocalTimestamp = (input)=>{
    if (!input) return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
    if (input instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"]) return input;
    if (typeof input === 'string') return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].fromDate(new Date(input));
    if (typeof input === 'number') return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].fromMillis(input);
    if (typeof input === 'object' && input !== null && 'seconds' in input) {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].fromMillis(Number(input.seconds) * 1000);
    }
    return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
};
const loadMIVDetailsFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(MIV_DETAILS_LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((miv)=>({
                ...miv,
                date: normalizeLocalTimestamp(miv.date)
            }));
    } catch (error) {
        console.error('Failed to load MIVs from localStorage', error);
        return [];
    }
};
const saveMIVDetailsToLocalStorage = (mivs)=>{
    try {
        localStorage.setItem(MIV_DETAILS_LOCAL_STORAGE_KEY, JSON.stringify(mivs.map((miv)=>({
                ...miv,
                date: miv.date.toDate().toISOString()
            }))));
    } catch (error) {
        console.error('Failed to save MIVs to localStorage', error);
    }
};
const loadMRVDetailsFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(MRV_DETAILS_LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((mrv)=>({
                ...mrv,
                date: normalizeLocalTimestamp(mrv.date)
            }));
    } catch (error) {
        console.error('Failed to load MRVs from localStorage', error);
        return [];
    }
};
const saveMRVDetailsToLocalStorage = (mrvs)=>{
    try {
        localStorage.setItem(MRV_DETAILS_LOCAL_STORAGE_KEY, JSON.stringify(mrvs.map((mrv)=>({
                ...mrv,
                date: mrv.date.toDate().toISOString()
            }))));
    } catch (error) {
        console.error('Failed to save MRVs to localStorage', error);
    }
};
const generateLocalId = (prefix)=>{
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterKey = `estatecare_${prefix.toLowerCase()}_counter_${yy}-${mmNoPad}`;
    let nextSeq = 1;
    try {
        const raw = localStorage.getItem(counterKey);
        const current = raw ? parseInt(raw, 10) : 0;
        nextSeq = Number.isFinite(current) && current > 0 ? current + 1 : 1;
    } catch (error) {
        console.warn(`Failed to read local ${prefix} counter:`, error);
    }
    try {
        localStorage.setItem(counterKey, String(nextSeq));
    } catch (error) {
        console.warn(`Failed to persist local ${prefix} counter:`, error);
    }
    return `${prefix}-${yy}${mmNoPad}${String(nextSeq).padStart(2, '0')}`;
};
const generateLocalInventoryId = ()=>{
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `local-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
};
const InventoryProvider = ({ children })=>{
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [categories, setCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [transfers, setTransfers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [audits, setAudits] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const inventoryUnsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const categoriesUnsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const transfersUnsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const auditsUnsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isLoaded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const { residences } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$residences$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useResidences"])();
    const { addNotification } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$notifications$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useNotifications"])();
    const { users, currentUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUsers"])();
    const loadInventory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (isLoaded.current) return;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            console.warn("InventoryContext: Firebase db is null; loading local inventory fallback.");
            setItems(loadInventoryFromLocalStorage());
            setCategories(loadCategoriesFromLocalStorage());
            setLoading(false);
            isLoaded.current = true;
            return;
        }
        isLoaded.current = true;
        setLoading(true);
        inventoryUnsubscribeRef.current = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory"), (snapshot)=>{
            const inventoryData = snapshot.docs.map((doc)=>{
                const data = doc.data();
                const stockByResidence = data.stockByResidence || {};
                // Ensure totalStock is a valid number, defaulting to 0 if not.
                // Clamp any negative values when computing totals for safety/display
                const totalStock = Object.values(stockByResidence).reduce((sum, current)=>{
                    const num = Number(current);
                    const safe = isNaN(num) ? 0 : Math.max(0, num);
                    return sum + safe;
                }, 0);
                return {
                    id: doc.id,
                    ...data,
                    stock: totalStock,
                    stockByResidence: stockByResidence
                };
            });
            setItems(inventoryData);
            const uniqueCategories = Array.from(new Set(inventoryData.map((item)=>item.category)));
            if (categories.length === 0 && uniqueCategories.length > 0) {
                const categoriesDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory-categories", "all-categories");
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(categoriesDocRef).then((docSnap)=>{
                    if (!docSnap.exists()) {
                        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(categoriesDocRef, {
                            names: uniqueCategories
                        });
                    }
                });
            }
            setLoading(false);
        }, (error)=>{
            console.error("Error fetching inventory:", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch inventory data. Check your Firebase config and security rules.",
                variant: "destructive"
            });
            setLoading(false);
        });
        categoriesUnsubscribeRef.current = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory-categories"), (snapshot)=>{
            if (snapshot.docs.length > 0) {
                const categoriesData = snapshot.docs[0].data();
                setCategories(categoriesData.names || []);
            }
        }, (error)=>{
            console.error("Error fetching categories:", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch categories data.",
                variant: "destructive"
            });
        });
        transfersUnsubscribeRef.current = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockTransfers'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])('date', 'desc')), (snapshot)=>{
            const transfersData = snapshot.docs.map((doc)=>doc.data());
            setTransfers(transfersData);
        }, (error)=>{
            console.error("Error fetching transfers:", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch stock transfers.",
                variant: "destructive"
            });
        });
        auditsUnsubscribeRef.current = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryAudits'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])('createdAt', 'desc')), (snapshot)=>{
            const auditsData = snapshot.docs.map((doc)=>doc.data());
            setAudits(auditsData);
        }, (error)=>{
            console.error("Error fetching audits:", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch audits.",
                variant: "destructive"
            });
        });
    }, [
        toast,
        categories.length
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadInventory();
        return ()=>{
            if (inventoryUnsubscribeRef.current) inventoryUnsubscribeRef.current();
            if (categoriesUnsubscribeRef.current) categoriesUnsubscribeRef.current();
            if (transfersUnsubscribeRef.current) transfersUnsubscribeRef.current();
            if (auditsUnsubscribeRef.current) auditsUnsubscribeRef.current();
            isLoaded.current = false;
        };
    }, [
        loadInventory
    ]);
    const getStockForResidence = (item, residenceId)=>{
        if (!item.stockByResidence) return 0;
        const v = Number(item.stockByResidence[residenceId] || 0);
        return isNaN(v) ? 0 : Math.max(0, v);
    };
    const addCategory = async (newCategory)=>{
        const trimmed = newCategory.trim();
        if (categories.map((c)=>c.toLowerCase()).includes(trimmed.toLowerCase())) {
            toast({
                title: "Error",
                description: "This category already exists.",
                variant: "destructive"
            });
            return;
        }
        const updatedCategories = [
            ...categories,
            trimmed
        ];
        setCategories(updatedCategories);
        saveCategoriesToLocalStorage(updatedCategories);
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Success",
                description: "Category added locally."
            });
            return;
        }
        try {
            const categoriesDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory-categories", "all-categories");
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(categoriesDocRef, {
                names: updatedCategories
            }, {
                merge: true
            });
            toast({
                title: "Success",
                description: "Category added."
            });
        } catch (error) {
            console.error("Error adding category: ", error);
            toast({
                title: "Error",
                description: "Failed to add category.",
                variant: "destructive"
            });
        }
    };
    const updateCategory = async (oldName, newName)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return;
        }
        const trimmedNewName = newName.trim();
        if (categories.map((c)=>c.toLowerCase()).includes(trimmedNewName.toLowerCase())) {
            toast({
                title: "Error",
                description: "A category with this name already exists.",
                variant: "destructive"
            });
            return;
        }
        try {
            const batch = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["writeBatch"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]);
            // 1. Update categories document
            const updatedCategories = categories.map((c)=>c === oldName ? trimmedNewName : c);
            const categoriesDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory-categories", "all-categories");
            batch.set(categoriesDocRef, {
                names: updatedCategories
            });
            // 2. Update all items with the old category name
            const itemsToUpdateQuery = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory"), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])("category", "==", oldName));
            const itemsToUpdateSnapshot = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(itemsToUpdateQuery);
            itemsToUpdateSnapshot.forEach((itemDoc)=>{
                const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory", itemDoc.id);
                batch.update(itemRef, {
                    category: trimmedNewName
                });
            });
            await batch.commit();
            toast({
                title: "Success",
                description: "Category updated successfully."
            });
        } catch (error) {
            console.error("Error updating category: ", error);
            toast({
                title: "Error",
                description: "Failed to update category.",
                variant: "destructive"
            });
        }
    };
    const addItem = async (newItem)=>{
        const isDuplicate = items.some((item)=>item.nameEn.toLowerCase() === newItem.nameEn.toLowerCase() || item.nameAr === newItem.nameAr);
        if (isDuplicate) {
            toast({
                title: "Error",
                description: "An item with this name already exists.",
                variant: "destructive"
            });
            return;
        }
        const itemWithId = {
            ...newItem,
            id: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"] ? (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory")).id : generateLocalInventoryId(),
            stock: 0,
            stockByResidence: {},
            lifespanDays: newItem.lifespanDays || 0,
            variants: newItem.variants || []
        };
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const nextItems = [
                ...items,
                itemWithId
            ];
            setItems(nextItems);
            saveInventoryToLocalStorage(nextItems);
            if (!categories.map((c)=>c.toLowerCase()).includes(newItem.category.toLowerCase())) {
                const nextCategories = [
                    ...categories,
                    newItem.category.trim()
                ];
                setCategories(nextCategories);
                saveCategoriesToLocalStorage(nextCategories);
            }
            toast({
                title: "Success",
                description: "New item added locally."
            });
            return itemWithId;
        }
        try {
            const docRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory"));
            const itemWithIdOnDb = {
                ...itemWithId,
                id: docRef.id
            };
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(docRef, itemWithIdOnDb);
            const newCategory = newItem.category.toLowerCase();
            if (!categories.map((c)=>c.toLowerCase()).includes(newCategory)) {
                addCategory(newItem.category);
            }
            toast({
                title: "Success",
                description: "New item added to inventory."
            });
            return itemWithIdOnDb;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add item.",
                variant: "destructive"
            });
            console.error("Error adding item:", error);
        }
    };
    const updateItem = async (itemToUpdate)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const nextItems = items.map((item)=>item.id === itemToUpdate.id ? itemToUpdate : item);
            setItems(nextItems);
            saveInventoryToLocalStorage(nextItems);
            toast({
                title: "Success",
                description: "Item updated locally."
            });
            return;
        }
        try {
            const itemDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory", itemToUpdate.id);
            const { stock, ...itemData } = itemToUpdate; // Exclude total stock from being written to DB
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(itemDocRef, {
                ...itemData
            });
            toast({
                title: "Success",
                description: "Item updated."
            });
        } catch (error) {
            console.error("Error updating item:", error);
            toast({
                title: "Error",
                description: "Failed to update item.",
                variant: "destructive"
            });
        }
    };
    const deleteItem = async (id)=>{
        if (!currentUser || currentUser.role !== 'Admin') {
            toast({
                title: "Forbidden",
                description: "Only admins can delete items.",
                variant: "destructive"
            });
            return;
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const nextItems = items.filter((item)=>item.id !== id);
            setItems(nextItems);
            saveInventoryToLocalStorage(nextItems);
            toast({
                title: "Success",
                description: "Item deleted locally."
            });
            return;
        }
        // Enforce admin-only deletion in the client as a first line of defense
        if (!currentUser || currentUser.role !== 'Admin') {
            toast({
                title: "Forbidden",
                description: "Only admins can delete items.",
                variant: "destructive"
            });
            return;
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory", id));
            toast({
                title: "Success",
                description: "Item has been deleted."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete item.",
                variant: "destructive"
            });
            console.error("Error deleting item:", error);
        }
    };
    const generateNewMivId = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not initialized");
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const mmNoPad = (now.getMonth() + 1).toString();
        const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'counters', `miv-${yy}-${mm}`);
        let nextSeq = 0;
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
            const snap = await trx.get(counterRef);
            const current = (snap.exists() ? snap.data().seq : 0) || 0;
            nextSeq = current + 1;
            trx.set(counterRef, {
                seq: nextSeq,
                yy,
                mm,
                updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }, {
                merge: true
            });
        });
        return `MIV-${yy}${mmNoPad}${nextSeq}`; // e.g., MIV-25814
    };
    // MRV ID generator: MRV-YY-MM-###
    const generateNewMrvId = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not initialized");
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `MRV-${year}-${month}-`;
        const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvs'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('id', '>=', prefix), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('id', '<', prefix + '\uf8ff'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])('id', 'desc'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["limit"])(1));
        const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
        let lastNum = 0;
        if (!snap.empty) {
            const lastId = snap.docs[0].id;
            const numPart = parseInt(lastId.substring(prefix.length), 10);
            if (!isNaN(numPart)) lastNum = numPart;
        }
        const next = (lastNum + 1).toString().padStart(3, '0');
        return `${prefix}${next}`;
    };
    // Reserve reconciliation id via counters: CON-<YY><M><seq>
    const reserveNewReconciliationId = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not initialized");
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mmNoPad = (now.getMonth() + 1).toString();
        const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'counters', `recon-${yy}-${mmNoPad}`);
        let nextSeq = 0;
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
            const snap = await trx.get(counterRef);
            const current = (snap.exists() ? snap.data().seq : 0) || 0;
            nextSeq = current + 1;
            trx.set(counterRef, {
                seq: nextSeq,
                yy,
                mm: mmNoPad,
                updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }, {
                merge: true
            });
        });
        return `CON-${yy}${mmNoPad}${nextSeq}`;
    };
    // Reserve a monthly TRS code: TRS-<YY><M><seq>
    const reserveNewTrsId = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not initialized");
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const mmNoPad = (now.getMonth() + 1).toString();
        const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'counters', `trs-${yy}-${mm}`);
        let nextSeq = 0;
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
            const snap = await trx.get(counterRef);
            const current = (snap.exists() ? snap.data().seq : 0) || 0;
            nextSeq = current + 1;
            trx.set(counterRef, {
                seq: nextSeq,
                yy,
                mm,
                updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }, {
                merge: true
            });
        });
        return `TRS-${yy}${mmNoPad}${nextSeq}`;
    };
    const issueItemsFromStock = async (residenceId, voucherLocations)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const localItems = [
                ...items
            ];
            const itemMap = new Map(localItems.map((item)=>[
                    item.id,
                    item
                ]));
            const allIssuedItems = voucherLocations.flatMap((loc)=>loc.items.filter((i)=>i.issueQuantity > 0));
            const totalsByItem = new Map();
            for (const line of allIssuedItems){
                totalsByItem.set(line.id, (totalsByItem.get(line.id) || 0) + Number(line.issueQuantity || 0));
            }
            for (const [itemId, totalToIssue] of totalsByItem.entries()){
                const item = itemMap.get(itemId);
                if (!item) {
                    throw new Error(`Item with ID ${itemId} not found.`);
                }
                const currentStock = Math.max(0, Number(item.stockByResidence?.[residenceId] || 0));
                if (currentStock < totalToIssue) {
                    const nameEn = item.nameEn || item.name || itemId;
                    throw new Error(`Not enough stock for ${nameEn}. Available: ${currentStock}, Required: ${totalToIssue}`);
                }
            }
            const updatedItems = localItems.map((item)=>{
                const totalToIssue = totalsByItem.get(item.id) || 0;
                if (totalToIssue === 0) return item;
                const sbr = {
                    ...item.stockByResidence || {}
                };
                const currentQty = Math.max(0, Number(sbr[residenceId] || 0));
                const nextQty = Math.max(0, currentQty - totalToIssue);
                sbr[residenceId] = nextQty;
                const newTotal = Object.values(sbr).reduce((sum, v)=>{
                    const n = Number(v);
                    return sum + (isNaN(n) ? 0 : Math.max(0, n));
                }, 0);
                return {
                    ...item,
                    stockByResidence: sbr,
                    stock: newTotal
                };
            });
            setItems(updatedItems);
            saveInventoryToLocalStorage(updatedItems);
            const mivId = generateLocalId('MIV');
            const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            const locations = {};
            for (const location of voucherLocations){
                const locItems = location.items.filter((i)=>i.issueQuantity > 0).map((issuedItem)=>({
                        itemId: issuedItem.id,
                        itemNameEn: issuedItem.nameEn || '',
                        itemNameAr: issuedItem.nameAr || '',
                        quantity: issuedItem.issueQuantity
                    }));
                if (locItems.length > 0) {
                    locations[location.locationName || 'Unknown'] = locItems;
                }
            }
            const mivDetail = {
                id: mivId,
                date: now,
                residenceId,
                locations
            };
            const existing = loadMIVDetailsFromLocalStorage();
            saveMIVDetailsToLocalStorage([
                mivDetail,
                ...existing
            ]);
            toast({
                title: "Success",
                description: "Voucher submitted successfully."
            });
            return;
        }
        try {
            const mivId = await generateNewMivId();
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
                const allIssuedItems = voucherLocations.flatMap((loc)=>loc.items);
                const uniqueItemIds = [
                    ...new Set(allIssuedItems.map((item)=>item.id))
                ];
                // Step 1: Read all items first
                const itemSnapshots = new Map();
                for (const id of uniqueItemIds){
                    const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory", id);
                    const itemSnap = await transaction.get(itemRef);
                    if (!itemSnap.exists()) {
                        throw new Error(`Item with ID ${id} not found.`);
                    }
                    itemSnapshots.set(id, itemSnap);
                }
                // Step 2: Aggregate quantities per item and validate against current stock
                const totalsByItem = new Map();
                for (const line of allIssuedItems){
                    const prev = totalsByItem.get(line.id) || 0;
                    totalsByItem.set(line.id, prev + (Number(line.issueQuantity) || 0));
                }
                for (const [itemId, totalToIssue] of totalsByItem.entries()){
                    const snap = itemSnapshots.get(itemId);
                    const data = snap?.data() || {};
                    const currentStock = Math.max(0, Number(data.stockByResidence?.[residenceId] || 0));
                    if (currentStock < totalToIssue) {
                        // Get item name for better message
                        const nameEn = data.nameEn || data.name || itemId;
                        throw new Error(`Not enough stock for ${nameEn}. Available: ${currentStock}, Required: ${totalToIssue}`);
                    }
                }
                // Step 3: Perform stock decrements once per item (atomic and aggregated)
                for (const [itemId, totalToIssue] of totalsByItem.entries()){
                    const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory", itemId);
                    const stockUpdateKey = `stockByResidence.${residenceId}`;
                    // Decrement safely via read-modify-write to avoid underflow if another adjustment snuck in
                    const snap = itemSnapshots.get(itemId);
                    const cur = Math.max(0, Number(snap?.data()?.stockByResidence?.[residenceId] || 0));
                    const next = Math.max(0, cur - totalToIssue);
                    const newSbr = {
                        ...snap?.data()?.stockByResidence || {}
                    };
                    newSbr[residenceId] = next;
                    const newTotal = Object.values(newSbr).reduce((sum, v)=>{
                        const n = Number(v);
                        return sum + (isNaN(n) ? 0 : Math.max(0, n));
                    }, 0);
                    transaction.update(itemRef, {
                        stockByResidence: newSbr,
                        stock: newTotal
                    });
                }
                const transactionTime = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
                const totalItemsCount = totalsByItem.size; // Count distinct items, not quantities
                let firstLocationName = voucherLocations[0]?.locationName || 'N/A';
                const mivDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mivs', mivId);
                // Best-effort decode helper
                const pretty = (s)=>{
                    if (!s) return s;
                    try {
                        if (/%[0-9A-Fa-f]{2}/.test(String(s))) return decodeURIComponent(String(s));
                    } catch  {}
                    return s;
                };
                for (const location of voucherLocations){
                    for (const issuedItem of location.items){
                        if (issuedItem.issueQuantity <= 0) continue;
                        // Log transaction
                        const transactionRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"));
                        const snap = itemSnapshots.get(issuedItem.id);
                        const inv = snap?.data() || {};
                        transaction.set(transactionRef, {
                            itemId: issuedItem.id,
                            itemNameEn: inv.nameEn || inv.name || pretty(issuedItem.nameEn) || '',
                            itemNameAr: inv.nameAr || inv.name || pretty(issuedItem.nameAr) || '',
                            residenceId: residenceId,
                            date: transactionTime,
                            type: 'OUT',
                            quantity: issuedItem.issueQuantity,
                            referenceDocId: mivId,
                            locationId: location.locationId,
                            locationName: location.locationName,
                            overrideReason: issuedItem.overrideReason || null,
                            overrideById: issuedItem.overrideReason ? currentUser?.id || null : undefined,
                            overrideByName: issuedItem.overrideReason ? currentUser?.name || undefined : undefined
                        });
                    }
                }
                // Write MIV master record
                transaction.set(mivDocRef, {
                    id: mivId,
                    date: transactionTime,
                    residenceId,
                    itemCount: totalItemsCount,
                    locationName: firstLocationName
                });
            });
            toast({
                title: "Success",
                description: "Voucher submitted successfully."
            });
        } catch (error) {
            console.error("Transaction failed: ", error);
            throw error;
        }
    };
    // Create MRV (manual receipt without order)
    const createMRV = async (payload)=>{
        // Note: If meta.mrvId is not provided, we reserve an MRV id using monthly counters (reserveNewMrvId)
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            if (!currentUser || currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor') {
                toast({
                    title: 'Insufficient permissions',
                    description: 'Only Admins or Supervisors can post MRVs.',
                    variant: 'destructive'
                });
                throw new Error('Forbidden');
            }
            const validItems = (payload.items || []).filter((i)=>i.quantity && i.quantity > 0);
            if (!payload.residenceId || validItems.length === 0) {
                throw new Error('Residence and at least one item with quantity > 0 are required.');
            }
            const totalsByItem = new Map();
            for (const line of validItems){
                totalsByItem.set(line.id, (totalsByItem.get(line.id) || 0) + Number(line.quantity || 0));
            }
            const localItems = [
                ...items
            ];
            const itemMap = new Map(localItems.map((item)=>[
                    item.id,
                    item
                ]));
            for (const [itemId, totalQty] of totalsByItem.entries()){
                const item = itemMap.get(itemId);
                if (!item) {
                    throw new Error(`Item not found (ID: ${itemId})`);
                }
                const currentQty = Math.max(0, Number(item.stockByResidence?.[payload.residenceId] || 0));
                const nextQty = currentQty + totalQty;
                const sbr = {
                    ...item.stockByResidence || {},
                    [payload.residenceId]: nextQty
                };
                const newTotal = Object.values(sbr).reduce((sum, v)=>{
                    const n = Number(v);
                    return sum + (isNaN(n) ? 0 : Math.max(0, n));
                }, 0);
                itemMap.set(itemId, {
                    ...item,
                    stockByResidence: sbr,
                    stock: newTotal
                });
            }
            const updatedItems = localItems.map((item)=>itemMap.get(item.id) || item);
            setItems(updatedItems);
            saveInventoryToLocalStorage(updatedItems);
            const mrvId = payload.meta?.mrvId || generateLocalId('MRV');
            const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            const mrvDetail = {
                id: mrvId,
                date: now,
                residenceId: payload.residenceId,
                items: validItems.map((line)=>({
                        itemId: line.id,
                        itemNameEn: line.nameEn,
                        itemNameAr: line.nameAr,
                        quantity: line.quantity
                    })),
                supplierName: payload.meta?.supplierName || undefined,
                invoiceNo: payload.meta?.invoiceNo || undefined,
                attachmentUrl: payload.meta?.attachmentUrl || null,
                attachmentPath: payload.meta?.attachmentPath || null,
                codeShort: payload.meta?.mrvShort || mrvId,
                orderId: payload.meta?.orderId || null,
                receivedBy: currentUser?.id,
                receivedByName: currentUser?.name
            };
            const existingMRVs = loadMRVDetailsFromLocalStorage();
            saveMRVDetailsToLocalStorage([
                mrvDetail,
                ...existingMRVs
            ]);
            toast({
                title: 'Success',
                description: 'Materials received and added to stock.'
            });
            return mrvId;
        }
        // Client-side guard: only Admin or Supervisor can post MRVs
        if (!currentUser || currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor') {
            toast({
                title: 'Insufficient permissions',
                description: 'Only Admins or Supervisors can post MRVs.',
                variant: 'destructive'
            });
            throw new Error('Forbidden');
        }
        const validItems = (payload.items || []).filter((i)=>i.quantity && i.quantity > 0);
        if (!payload.residenceId || validItems.length === 0) {
            throw new Error('Residence and at least one item with quantity > 0 are required.');
        }
        // Use reserved MRV id if provided; otherwise reserve a new one
        let mrvId = payload.meta?.mrvId || '';
        let mrvShort = payload.meta?.mrvShort || '';
        if (!mrvId) {
            const r = await reserveNewMrvId();
            // Use short format as the official MRV ID
            mrvId = r.short;
            mrvShort = r.short;
        }
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
            // Read all item documents first
            const uniqueItemIds = [
                ...new Set(validItems.map((i)=>i.id))
            ];
            const itemRefs = uniqueItemIds.map((id)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', id));
            const itemSnaps = await Promise.all(itemRefs.map((r)=>transaction.get(r)));
            // Validate items existence and build lookup
            const existingById = new Map();
            for(let i = 0; i < itemSnaps.length; i++){
                const snap = itemSnaps[i];
                if (!snap.exists()) {
                    throw new Error(`Item not found (ID: ${uniqueItemIds[i]})`);
                }
                existingById.set(snap.id, snap.data());
            }
            // Aggregate quantities per item for a single atomic update per item
            const totalsByItem = new Map();
            for (const line of validItems){
                totalsByItem.set(line.id, (totalsByItem.get(line.id) || 0) + Number(line.quantity || 0));
            }
            const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            const totalItemCount = totalsByItem.size; // Count distinct items, not quantities
            // Update stock (stockByResidence and total stock) per item
            for (const [itemId, totalQty] of totalsByItem.entries()){
                const prev = existingById.get(itemId) || {};
                const prevSbr = {
                    ...prev.stockByResidence || {}
                };
                const prevAtRes = Math.max(0, Number(prevSbr[payload.residenceId] || 0));
                const nextAtRes = Math.max(0, prevAtRes + totalQty);
                const newSbr = {
                    ...prevSbr,
                    [payload.residenceId]: nextAtRes
                };
                const newTotal = Object.values(newSbr).reduce((sum, v)=>{
                    const n = Number(v);
                    return sum + (isNaN(n) ? 0 : Math.max(0, n));
                }, 0);
                const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', itemId);
                transaction.update(itemRef, {
                    stockByResidence: newSbr,
                    stock: newTotal
                });
            }
            // Log transactions for each line
            for (const line of validItems){
                const txRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'));
                transaction.set(txRef, {
                    itemId: line.id,
                    itemNameEn: line.nameEn,
                    itemNameAr: line.nameAr,
                    residenceId: payload.residenceId,
                    date: now,
                    type: 'IN',
                    quantity: line.quantity,
                    referenceDocId: mrvId,
                    locationName: 'Receiving'
                });
            }
            // Write MRV master record
            const mrvRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvs', mrvId);
            transaction.set(mrvRef, {
                id: mrvId,
                date: now,
                residenceId: payload.residenceId,
                itemCount: totalItemCount,
                supplierName: payload.meta?.supplierName || null,
                invoiceNo: payload.meta?.invoiceNo || null,
                notes: payload.meta?.notes || null,
                attachmentUrl: payload.meta?.attachmentUrl || null,
                attachmentPath: payload.meta?.attachmentPath || null,
                codeShort: mrvShort || null,
                orderId: payload.meta?.orderId || null,
                receivedBy: currentUser.id,
                receivedByName: currentUser.name
            });
        });
        toast({
            title: 'Success',
            description: 'Materials received and added to stock.'
        });
        return mrvId;
    };
    // Update MRV (Admin only)
    const updateMRV = async (mrvId, items, meta)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        if (!currentUser || currentUser.role !== 'Admin') {
            toast({
                title: 'Permission Denied',
                description: 'Only Admins can edit MRVs.',
                variant: 'destructive'
            });
            throw new Error('Forbidden');
        }
        // 1. Query old transactions (outside transaction)
        const txQ = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('referenceDocId', '==', mrvId));
        const oldTxSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(txQ);
        const oldTxs = oldTxSnap.docs.map((d)=>({
                id: d.id,
                ...d.data()
            }));
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
            // 2. Read MRV to lock it
            const mrvRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvs', mrvId);
            const mrvSnap = await transaction.get(mrvRef);
            if (!mrvSnap.exists()) throw new Error('MRV not found');
            // 3. Identify all items (old + new)
            const oldItemIds = oldTxs.map((t)=>t.itemId);
            const newItemIds = items.map((i)=>i.id);
            const allItemIds = [
                ...new Set([
                    ...oldItemIds,
                    ...newItemIds
                ])
            ];
            // 4. Read all items
            const itemRefs = allItemIds.map((id)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', id));
            const itemSnaps = await Promise.all(itemRefs.map((ref)=>transaction.get(ref)));
            const itemMap = new Map();
            itemSnaps.forEach((snap)=>{
                if (snap.exists()) itemMap.set(snap.id, snap);
            });
            // 5. Revert old stock (Subtract from stock)
            // MRV adds to stock, so reverting means subtracting.
            const stockChanges = new Map(); // itemId -> net change for residence
            // Initialize with 0
            allItemIds.forEach((id)=>stockChanges.set(id, 0));
            const residenceId = mrvSnap.data().residenceId;
            for (const tx of oldTxs){
                // Only revert IN/RECEIVE types
                if (tx.type === 'IN' || tx.type === 'RECEIVE') {
                    const currentChange = stockChanges.get(tx.itemId) || 0;
                    stockChanges.set(tx.itemId, currentChange - tx.quantity);
                }
            }
            // 6. Apply new stock (Add to stock)
            for (const item of items){
                const currentChange = stockChanges.get(item.id) || 0;
                stockChanges.set(item.id, currentChange + item.quantity);
            }
            // 7. Validate and Update Items
            for (const [itemId, netChange] of stockChanges.entries()){
                if (netChange === 0) continue;
                const snap = itemMap.get(itemId);
                if (!snap) throw new Error(`Item ${itemId} not found`);
                const data = snap.data();
                const currentResStock = Math.max(0, Number(data.stockByResidence?.[residenceId] || 0));
                const newResStock = currentResStock + netChange;
                if (newResStock < 0) {
                    throw new Error(`Stock underflow for item ${data.nameEn}. Cannot reduce below 0.`);
                }
                const newSbr = {
                    ...data.stockByResidence || {}
                };
                newSbr[residenceId] = newResStock;
                const newTotal = Object.values(newSbr).reduce((sum, v)=>{
                    const n = Number(v);
                    return sum + (isNaN(n) ? 0 : Math.max(0, n));
                }, 0);
                transaction.update(snap.ref, {
                    stockByResidence: newSbr,
                    stock: newTotal
                });
            }
            // 8. Update Transactions
            // Delete old
            for (const tx of oldTxs){
                transaction.delete((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions', tx.id));
            }
            // Create new
            const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            for (const item of items){
                const newTxRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'));
                transaction.set(newTxRef, {
                    itemId: item.id,
                    itemNameEn: item.nameEn,
                    itemNameAr: item.nameAr,
                    residenceId: residenceId,
                    date: mrvSnap.data().date,
                    type: 'IN',
                    quantity: item.quantity,
                    referenceDocId: mrvId,
                    locationName: 'Receiving (Edited)'
                });
            }
            // 9. Update MRV Doc
            transaction.update(mrvRef, {
                itemCount: items.length,
                supplierName: meta.supplierName || null,
                invoiceNo: meta.invoiceNo || null,
                notes: meta.notes || null,
                editedBy: currentUser.id,
                editedAt: now,
                editReason: meta.editReason
            });
        });
        toast({
            title: 'Success',
            description: 'MRV updated successfully.'
        });
    };
    // Update MIV (Admin only)
    const updateMIV = async (mivId, locations, meta)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        if (!currentUser || currentUser.role !== 'Admin') {
            toast({
                title: 'Permission Denied',
                description: 'Only Admins can edit MIVs.',
                variant: 'destructive'
            });
            throw new Error('Forbidden');
        }
        // 1. Query old transactions
        const txQ = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('referenceDocId', '==', mivId));
        const oldTxSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(txQ);
        const oldTxs = oldTxSnap.docs.map((d)=>({
                id: d.id,
                ...d.data()
            }));
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
            // 2. Read MIV to lock
            const mivRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mivs', mivId);
            const mivSnap = await transaction.get(mivRef);
            if (!mivSnap.exists()) throw new Error('MIV not found');
            const residenceId = mivSnap.data().residenceId;
            // 3. Identify items
            const oldItemIds = oldTxs.map((t)=>t.itemId);
            const newItemIds = locations.flatMap((l)=>l.items.map((i)=>i.id));
            const allItemIds = [
                ...new Set([
                    ...oldItemIds,
                    ...newItemIds
                ])
            ];
            // 4. Read items
            const itemRefs = allItemIds.map((id)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', id));
            const itemSnaps = await Promise.all(itemRefs.map((ref)=>transaction.get(ref)));
            const itemMap = new Map();
            itemSnaps.forEach((snap)=>{
                if (snap.exists()) itemMap.set(snap.id, snap);
            });
            // 5. Calculate Net Change
            // MIV subtracts from stock.
            // Revert old (Add back)
            // Apply new (Subtract)
            const stockChanges = new Map(); // itemId -> net change (positive = add back to stock, negative = remove from stock)
            allItemIds.forEach((id)=>stockChanges.set(id, 0));
            for (const tx of oldTxs){
                if (tx.type === 'OUT' || tx.type === 'ISSUE') {
                    const cur = stockChanges.get(tx.itemId) || 0;
                    stockChanges.set(tx.itemId, cur + tx.quantity); // Add back
                }
            }
            for (const loc of locations){
                for (const item of loc.items){
                    const cur = stockChanges.get(item.id) || 0;
                    stockChanges.set(item.id, cur - item.quantity); // Subtract new
                }
            }
            // 6. Validate and Update Items
            for (const [itemId, netChange] of stockChanges.entries()){
                if (netChange === 0) continue;
                const snap = itemMap.get(itemId);
                if (!snap) throw new Error(`Item ${itemId} not found`);
                const data = snap.data();
                const currentResStock = Math.max(0, Number(data.stockByResidence?.[residenceId] || 0));
                const newResStock = currentResStock + netChange;
                if (newResStock < 0) {
                    throw new Error(`Insufficient stock for item ${data.nameEn}. Available: ${currentResStock}, Net Change: ${netChange}`);
                }
                const newSbr = {
                    ...data.stockByResidence || {}
                };
                newSbr[residenceId] = newResStock;
                const newTotal = Object.values(newSbr).reduce((sum, v)=>{
                    const n = Number(v);
                    return sum + (isNaN(n) ? 0 : Math.max(0, n));
                }, 0);
                transaction.update(snap.ref, {
                    stockByResidence: newSbr,
                    stock: newTotal
                });
            }
            // 7. Update Transactions
            for (const tx of oldTxs){
                transaction.delete((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions', tx.id));
            }
            const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            const originalDate = mivSnap.data().date;
            for (const loc of locations){
                for (const item of loc.items){
                    const newTxRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'));
                    transaction.set(newTxRef, {
                        itemId: item.id,
                        itemNameEn: item.nameEn,
                        itemNameAr: item.nameAr,
                        residenceId: residenceId,
                        date: originalDate,
                        type: 'OUT',
                        quantity: item.quantity,
                        referenceDocId: mivId,
                        locationId: loc.locationId,
                        locationName: loc.locationName
                    });
                }
            }
            // 8. Update MIV Doc
            const distinctItems = new Set(locations.flatMap((l)=>l.items.map((i)=>i.id))).size;
            transaction.update(mivRef, {
                itemCount: distinctItems,
                locationName: locations[0]?.locationName || 'Multiple',
                editedBy: currentUser.id,
                editedAt: now,
                editReason: meta.editReason
            });
        });
        toast({
            title: 'Success',
            description: 'MIV updated successfully.'
        });
    };
    const getInventoryTransactions = async (itemId, residenceId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return [];
        }
        try {
            const q = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])("itemId", "==", itemId), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])("residenceId", "==", residenceId));
            const querySnapshot = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(q);
            const transactions = querySnapshot.docs.map((doc)=>({
                    id: doc.id,
                    ...doc.data()
                }));
            transactions.sort((a, b)=>(a.date?.toMillis?.() || 0) - (b.date?.toMillis?.() || 0));
            return transactions;
        } catch (error) {
            console.error("Error fetching inventory transactions:", error);
            toast({
                title: "Error",
                description: "Failed to fetch item history.",
                variant: "destructive"
            });
            return [];
        }
    };
    const getAllIssueTransactions = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return [];
        }
        const q = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])("type", "==", "OUT"));
        const querySnapshot = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(q);
        const transactions = querySnapshot.docs.map((doc)=>({
                id: doc.id,
                ...doc.data()
            }));
        return transactions.sort((a, b)=>(b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
    };
    // Fetch all transfer transactions (IN/OUT) by reference code (e.g., TRS-2582)
    const getTransferItems = async (referenceDocId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('referenceDocId', '==', referenceDocId), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('type', 'in', [
            'TRANSFER_IN',
            'TRANSFER_OUT'
        ]));
        const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
        const rows = snap.docs.map((d)=>({
                id: d.id,
                ...d.data()
            }));
        // Sort by item name for nicer display
        return rows.sort((a, b)=>(a.itemNameEn || '').localeCompare(b.itemNameEn || ''));
    };
    const getAllInventoryTransactions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            console.warn('Firebase disabled: getAllInventoryTransactions fallback to empty list');
            return [];
        }
        try {
            // Previously used collectionGroup which requires subcollections of the same name.
            // Our transactions are stored in a top-level collection "inventoryTransactions",
            const q = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"));
            const querySnapshot = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(q);
            return querySnapshot.docs.map((doc)=>({
                    id: doc.id,
                    ...doc.data()
                }));
        } catch (error) {
            console.error("Error fetching all inventory transactions:", error);
            toast({
                title: "Error",
                description: "Failed to fetch all transactions.",
                variant: "destructive"
            });
            return [];
        }
    }, [
        toast
    ]);
    // Helper: last issue date for an item at a specific location
    const getLastIssueDateForItemAtLocation = async (itemId, locationId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: 'Error',
                description: firebaseErrorMessage,
                variant: 'destructive'
            });
            return null;
        }
        try {
            const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('itemId', '==', itemId), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('locationId', '==', locationId), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('type', '==', 'OUT'));
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
            if (snap.empty) return null;
            const txs = snap.docs.map((d)=>d.data());
            txs.sort((a, b)=>(b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
            return txs[0]?.date || null;
        } catch (error) {
            console.error('Error fetching last issue date:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch last issue date.',
                variant: 'destructive'
            });
            return null;
        }
    };
    // Helper: compute lifespan status for an item at a specific location
    const checkItemLifespanAtLocation = async (itemId, locationId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: 'Error',
                description: firebaseErrorMessage,
                variant: 'destructive'
            });
            return {
                lifespanDays: null,
                lastIssueDate: null,
                daysSinceLastIssue: null,
                withinLifespan: false
            };
        }
        try {
            const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', itemId);
            const itemSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(itemRef);
            const item = itemSnap.exists() ? itemSnap.data() : null;
            const lifespanDays = item && typeof item.lifespanDays === 'number' && item.lifespanDays > 0 ? Number(item.lifespanDays) : null;
            const lastIssueDate = await getLastIssueDateForItemAtLocation(itemId, locationId);
            if (!lifespanDays || !lastIssueDate) {
                return {
                    lifespanDays,
                    lastIssueDate,
                    daysSinceLastIssue: null,
                    withinLifespan: false
                };
            }
            const now = Date.now();
            const daysSince = Math.floor((now - lastIssueDate.toMillis()) / (1000 * 60 * 60 * 24));
            const within = daysSince < lifespanDays;
            return {
                lifespanDays,
                lastIssueDate,
                daysSinceLastIssue: daysSince,
                withinLifespan: within
            };
        } catch (e) {
            console.error('checkItemLifespanAtLocation failed', e);
            return {
                lifespanDays: null,
                lastIssueDate: null,
                daysSinceLastIssue: null,
                withinLifespan: false
            };
        }
    };
    // List recent MIVs
    const getMIVs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const localMivs = loadMIVDetailsFromLocalStorage();
            return localMivs.sort((a, b)=>(b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0)).map((miv)=>({
                    id: miv.id,
                    date: miv.date,
                    residenceId: miv.residenceId,
                    itemCount: Object.values(miv.locations).flat().length,
                    locationName: Object.keys(miv.locations)[0] || 'Multiple'
                }));
        }
        try {
            const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mivs'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])('date', 'desc'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["limit"])(20));
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
            return snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
        } catch (error) {
            console.error('Error fetching MIVs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch MIVs.',
                variant: 'destructive'
            });
            return [];
        }
    }, [
        toast
    ]);
    // Get MIV details by ID
    const getMIVById = async (mivId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const localMivs = loadMIVDetailsFromLocalStorage();
            return localMivs.find((miv)=>miv.id === mivId) || null;
        }
        try {
            const txQ = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('referenceDocId', '==', mivId));
            const txSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(txQ);
            if (txSnap.empty) return null;
            const txs = txSnap.docs.map((d)=>d.data());
            const locations = {};
            for (const tx of txs){
                const locName = tx.locationName || 'Unknown';
                if (!locations[locName]) locations[locName] = [];
                locations[locName].push({
                    itemId: tx.itemId,
                    itemNameEn: tx.itemNameEn,
                    itemNameAr: tx.itemNameAr,
                    quantity: tx.quantity
                });
            }
            const detail = {
                id: mivId,
                date: txs[0].date,
                residenceId: txs[0].residenceId,
                locations
            };
            return detail;
        } catch (e) {
            console.error('Error fetching MIV details:', e);
            toast({
                title: 'Error',
                description: 'Failed to fetch MIV details.',
                variant: 'destructive'
            });
            return null;
        }
    };
    // List recent MRVs
    const getMRVs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const localMrvs = loadMRVDetailsFromLocalStorage();
            return localMrvs.sort((a, b)=>(b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
        }
        try {
            const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvs'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])('date', 'desc'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["limit"])(20));
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
            return snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
        } catch (error) {
            console.error('Error fetching MRVs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch MRVs.',
                variant: 'destructive'
            });
            return [];
        }
    }, [
        toast
    ]);
    // Get MRV details by ID
    const getMRVById = async (mrvId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const localMrvs = loadMRVDetailsFromLocalStorage();
            return localMrvs.find((mrv)=>mrv.id === mrvId) || null;
        }
        try {
            const txQ = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('referenceDocId', '==', mrvId));
            const txSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(txQ);
            if (txSnap.empty) return null;
            const items = txSnap.docs.map((d)=>d.data());
            // Fetch MRV master for meta
            const mrvRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvs', mrvId);
            const mrvSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(mrvRef);
            const meta = mrvSnap.exists() ? mrvSnap.data() : {};
            return {
                id: mrvId,
                date: items[0].date,
                residenceId: items[0].residenceId,
                items: items.map((tx)=>({
                        itemId: tx.itemId,
                        itemNameEn: tx.itemNameEn,
                        itemNameAr: tx.itemNameAr,
                        quantity: tx.quantity
                    })),
                supplierName: meta?.supplierName || undefined,
                invoiceNo: meta?.invoiceNo || undefined,
                attachmentUrl: meta?.attachmentUrl || null,
                attachmentPath: meta?.attachmentPath || null,
                codeShort: meta?.codeShort || null,
                attachmentRef: meta?.attachmentRef || null,
                orderId: meta?.orderId || null,
                receivedBy: meta?.receivedBy || undefined,
                receivedByName: meta?.receivedByName || undefined
            };
        } catch (e) {
            console.error('Error fetching MRV details:', e);
            toast({
                title: 'Error',
                description: 'Failed to fetch MRV details.',
                variant: 'destructive'
            });
            return null;
        }
    };
    const reserveNewMrvId = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not initialized");
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2); // e.g., 25
        const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // e.g., 08
        const mmNoPad = (now.getMonth() + 1).toString(); // e.g., 8
        const counterId = `mrv-${yy}-${mm}`; // counters/mrv-25-08
        const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'counters', counterId);
        let nextSeq = 0;
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
            const snap = await trx.get(counterRef);
            const current = (snap.exists() ? snap.data().seq : 0) || 0;
            nextSeq = current + 1;
            trx.set(counterRef, {
                seq: nextSeq,
                yy,
                mm,
                updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }, {
                merge: true
            });
        });
        const seqPadded = nextSeq.toString().padStart(3, '0');
        const fullId = `MRV-${yy}-${mm}-${seqPadded}`; // MRV-25-08-027
        const shortId = `MRV-${yy}${mmNoPad}${nextSeq}`; // MRV-25827
        return {
            id: fullId,
            short: shortId
        };
    };
    // MRV Requests (Admin approval flow)
    const getMRVRequests = async (status)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: 'Error',
                description: firebaseErrorMessage,
                variant: 'destructive'
            });
            return [];
        }
        try {
            let qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvRequests');
            if (status) {
                qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])(qRef, (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('status', '==', status));
            }
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
            const arr = snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
            // Sort by requestedAt desc if available
            arr.sort((a, b)=>(b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0));
            return arr;
        } catch (e) {
            console.error('Error fetching MRV requests:', e);
            toast({
                title: 'Error',
                description: 'Failed to fetch MRV requests.',
                variant: 'destructive'
            });
            return [];
        }
    };
    const approveMRVRequest = async (requestId, approverId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        const reqRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvRequests', requestId);
        // Step 1: Atomically move Pending -> Processing to prevent double approvals
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
            const snap = await trx.get(reqRef);
            if (!snap.exists()) throw new Error('Request not found');
            const data = snap.data();
            if (data.status === 'Approved' && data.mrvId) {
                // Already approved earlier: short-circuit
                throw Object.assign(new Error('ALREADY_APPROVED'), {
                    code: 'ALREADY_APPROVED',
                    mrvId: data.mrvId
                });
            }
            if (data.status !== 'Pending') {
                throw new Error('Request already processed');
            }
            // Mark as Processing to lock it
            trx.update(reqRef, {
                status: 'Processing',
                processingAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                processingById: approverId
            });
        });
        // Step 2: Read the fresh data and proceed to create MRV
        const freshSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(reqRef);
        const reqData = freshSnap.data();
        // Use pre-reserved short code if exists to keep unified numbering; otherwise reserve now
        const reservedShort = reqData.mrvShort && String(reqData.mrvShort).startsWith('MRV-') ? reqData.mrvShort : null;
        const reserved = reservedShort ? {
            id: reservedShort,
            short: reservedShort
        } : await reserveNewMrvId();
        // Create posted MRV and update request status
        const mrvId = await createMRV({
            residenceId: reqData.residenceId,
            items: reqData.items.map((i)=>({
                    id: i.id,
                    nameEn: i.nameEn,
                    nameAr: i.nameAr,
                    quantity: i.quantity
                })),
            meta: {
                supplierName: reqData.supplierName || undefined,
                invoiceNo: reqData.invoiceNo || undefined,
                notes: reqData.notes || undefined,
                attachmentUrl: reqData.attachmentUrl || null,
                attachmentPath: reqData.attachmentPath || null,
                mrvId: reserved.short,
                mrvShort: reserved.short
            }
        });
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(reqRef, {
            status: 'Approved',
            approvedById: approverId,
            approvedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
            mrvId,
            mrvShort: reserved.short
        });
        // Notify requester and all Admins
        try {
            const requesterId = reqData.requestedById || null;
            if (requesterId) {
                await addNotification?.({
                    userId: requesterId,
                    title: 'MRV Approved',
                    message: `Your MRV request has been approved and posted (${mrvId}).`,
                    type: 'generic',
                    href: `/inventory/receive/receipts/${mrvId}`,
                    referenceId: mrvId
                });
            }
            const admins = (users || []).filter((u)=>u.role === 'Admin');
            for (const admin of admins){
                await addNotification?.({
                    userId: admin.id,
                    title: 'MRV Posted',
                    message: `MRV ${mrvId} has been posted to stock.`,
                    type: 'generic',
                    href: `/inventory/receive/receipts/${mrvId}`,
                    referenceId: mrvId
                });
            }
        } catch  {}
        toast({
            title: 'Approved',
            description: `MRV request approved and posted (${mrvId}).`
        });
        return mrvId;
    };
    const rejectMRVRequest = async (requestId, rejecterId, reason)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        const reqRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'mrvRequests', requestId);
        const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(reqRef);
        if (!snap.exists()) throw new Error('Request not found');
        const data = snap.data();
        if (data.status !== 'Pending') throw new Error('Request already processed');
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(reqRef, {
            status: 'Rejected',
            rejectedById: rejecterId,
            rejectedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
            rejectReason: reason || null
        });
        // Notify requester
        try {
            const requesterId = data.requestedById || null;
            if (requesterId) {
                await addNotification?.({
                    userId: requesterId,
                    title: 'MRV Rejected',
                    message: `Your MRV request (${data.mrvShort || requestId}) was rejected${reason ? `: ${reason}` : ''}.`,
                    type: 'generic',
                    href: `/inventory/receive`,
                    referenceId: data.mrvShort || requestId
                });
            }
        } catch  {}
        toast({
            title: 'Rejected',
            description: 'MRV request has been rejected.'
        });
    };
    const createTransferRequest = async (payload, currentUser)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"] || !payload) {
            const msg = !__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"] ? firebaseErrorMessage : "Transfer payload is missing.";
            toast({
                title: "Error",
                description: msg,
                variant: "destructive"
            });
            throw new Error(msg);
        }
        const { fromResidenceId, toResidenceId, items: itemsToTransfer } = payload;
        const isInternalTransfer = currentUser.assignedResidences.includes(fromResidenceId) && currentUser.assignedResidences.includes(toResidenceId);
        if (isInternalTransfer) {
            // Direct transfer, no approval needed
            try {
                // Reserve a TRS code for this completed transfer
                const trsId = await reserveNewTrsId();
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
                    // Step 1: Read all items first
                    const itemRefs = itemsToTransfer.map((item)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', item.id));
                    const itemDocs = await Promise.all(itemRefs.map((ref)=>transaction.get(ref)));
                    // Validate all items and prepare updates
                    const updates = [];
                    for(let i = 0; i < itemsToTransfer.length; i++){
                        const item = itemsToTransfer[i];
                        const itemDoc = itemDocs[i];
                        if (!itemDoc.exists()) {
                            throw new Error(`Item ${item.nameEn} not found.`);
                        }
                        const data = itemDoc.data();
                        const currentFromStock = Math.max(0, Number(data.stockByResidence?.[fromResidenceId] || 0));
                        const currentToStock = Math.max(0, Number(data.stockByResidence?.[toResidenceId] || 0));
                        if (currentFromStock < item.quantity) {
                            throw new Error(`Not enough stock for ${item.nameEn}. Available: ${currentFromStock}, Required: ${item.quantity}`);
                        }
                        // Prepare read-modify-write updates with clamping
                        const newSbr = {
                            ...data.stockByResidence || {}
                        };
                        newSbr[fromResidenceId] = Math.max(0, currentFromStock - item.quantity);
                        newSbr[toResidenceId] = Math.max(0, currentToStock + item.quantity);
                        const newTotal = Object.values(newSbr).reduce((sum, v)=>{
                            const n = Number(v);
                            return sum + (isNaN(n) ? 0 : Math.max(0, n));
                        }, 0);
                        updates.push({
                            ref: itemRefs[i],
                            updates: {
                                stockByResidence: newSbr,
                                stock: newTotal
                            }
                        });
                    }
                    // Step 2: Perform all writes after all reads are complete
                    const transactionTime = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
                    // Update stock for all items
                    for (const update of updates){
                        transaction.update(update.ref, update.updates);
                    }
                    // Log transfer transactions for each item
                    for(let i = 0; i < itemsToTransfer.length; i++){
                        const item = itemsToTransfer[i];
                        // Create TRANSFER_OUT transaction for source residence
                        const transferOutRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"));
                        transaction.set(transferOutRef, {
                            itemId: item.id,
                            itemNameEn: item.nameEn,
                            itemNameAr: item.nameAr,
                            residenceId: fromResidenceId,
                            date: transactionTime,
                            type: 'TRANSFER_OUT',
                            quantity: item.quantity,
                            referenceDocId: trsId,
                            relatedResidenceId: toResidenceId,
                            locationName: `Internal transfer to residence (${toResidenceId})`
                        });
                        // Create TRANSFER_IN transaction for destination residence
                        const transferInRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"));
                        transaction.set(transferInRef, {
                            itemId: item.id,
                            itemNameEn: item.nameEn,
                            itemNameAr: item.nameAr,
                            residenceId: toResidenceId,
                            date: transactionTime,
                            type: 'TRANSFER_IN',
                            quantity: item.quantity,
                            referenceDocId: trsId,
                            relatedResidenceId: fromResidenceId,
                            locationName: `Internal transfer from residence (${fromResidenceId})`
                        });
                    }
                    // Create a completed transfer record
                    const transferDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockTransfers'));
                    const newTransfer = {
                        ...payload,
                        id: transferDocRef.id,
                        date: transactionTime,
                        status: 'Completed',
                        approvedById: currentUser.id,
                        approvedAt: transactionTime,
                        // store the TRS short code for reference/display
                        // @ts-ignore - optional property added below on the interface
                        codeShort: trsId
                    };
                    transaction.set(transferDocRef, newTransfer);
                });
                toast({
                    title: "Success",
                    description: "Internal transfer completed successfully."
                });
            } catch (error) {
                const err = error;
                console.error("Failed to execute direct transfer:", err);
                toast({
                    title: "Error",
                    description: `Transfer failed: ${err.message}`,
                    variant: "destructive"
                });
                throw err;
            }
        } else {
            // External transfer, requires approval
            try {
                const transferDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockTransfers'));
                const newTransfer = {
                    ...payload,
                    id: transferDocRef.id,
                    date: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                    status: 'Pending'
                };
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(transferDocRef, newTransfer);
                // Create notification for the destination residence manager
                const toResidence = residences.find((r)=>r.id === toResidenceId);
                if (toResidence && toResidence.managerId && addNotification) {
                    await addNotification({
                        userId: toResidence.managerId,
                        title: 'New Stock Transfer Request',
                        message: `You have a new transfer request from ${payload.fromResidenceName}.`,
                        type: 'transfer_request',
                        href: `/inventory/transfer`,
                        referenceId: newTransfer.id
                    });
                }
                toast({
                    title: "Success",
                    description: "Transfer request created and pending approval."
                });
            } catch (error) {
                console.error("Failed to create transfer request:", error);
                throw error;
            }
        }
    };
    const approveTransfer = async (transferId, approverId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        const transferRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockTransfers', transferId);
        try {
            // Reserve TRS code for this approved transfer
            const trsId = await reserveNewTrsId();
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
                // Step 1: Read all data first
                const transferDoc = await transaction.get(transferRef);
                if (!transferDoc.exists()) {
                    throw new Error("Transfer request not found or already processed.");
                }
                const transferData = transferDoc.data();
                if (!transferData) {
                    throw new Error("Transfer data is missing.");
                }
                if (transferData.status !== 'Pending') {
                    throw new Error("Transfer request already processed.");
                }
                const { fromResidenceId, toResidenceId, items: itemsToTransfer } = transferData;
                if (!fromResidenceId || !toResidenceId || !itemsToTransfer) {
                    throw new Error("Transfer data is incomplete.");
                }
                // Read all items first
                const itemRefs = itemsToTransfer.map((item)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', item.id));
                const itemDocs = await Promise.all(itemRefs.map((ref)=>transaction.get(ref)));
                // Validate all items and stock levels
                const updates = [];
                for(let i = 0; i < itemsToTransfer.length; i++){
                    const item = itemsToTransfer[i];
                    const itemDoc = itemDocs[i];
                    if (!itemDoc.exists()) {
                        throw new Error(`Item ${item.nameEn} not found.`);
                    }
                    const data = itemDoc.data();
                    const currentFromStock = Math.max(0, Number(data.stockByResidence?.[fromResidenceId] || 0));
                    const currentToStock = Math.max(0, Number(data.stockByResidence?.[toResidenceId] || 0));
                    if (currentFromStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.nameEn}. Available: ${currentFromStock}, Required: ${item.quantity}`);
                    }
                    // Prepare updates for later using read-modify-write with clamping
                    const newSbr = {
                        ...data.stockByResidence || {}
                    };
                    newSbr[fromResidenceId] = Math.max(0, currentFromStock - item.quantity);
                    newSbr[toResidenceId] = Math.max(0, currentToStock + item.quantity);
                    const newTotal = Object.values(newSbr).reduce((sum, v)=>{
                        const n = Number(v);
                        return sum + (isNaN(n) ? 0 : Math.max(0, n));
                    }, 0);
                    updates.push({
                        ref: itemRefs[i],
                        updates: {
                            stockByResidence: newSbr,
                            stock: newTotal
                        }
                    });
                }
                // Step 2: Perform all writes after all reads are complete
                const transactionTime = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
                // Update stock for all items
                for (const update of updates){
                    transaction.update(update.ref, update.updates);
                }
                // Log transfer transactions for each item
                for(let i = 0; i < itemsToTransfer.length; i++){
                    const item = itemsToTransfer[i];
                    // Create TRANSFER_OUT transaction for source residence
                    const transferOutRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"));
                    transaction.set(transferOutRef, {
                        itemId: item.id,
                        itemNameEn: item.nameEn,
                        itemNameAr: item.nameAr,
                        residenceId: fromResidenceId,
                        date: transactionTime,
                        type: 'TRANSFER_OUT',
                        quantity: item.quantity,
                        referenceDocId: trsId,
                        relatedResidenceId: toResidenceId,
                        locationName: `Transfer to residence`
                    });
                    // Create TRANSFER_IN transaction for destination residence
                    const transferInRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"));
                    transaction.set(transferInRef, {
                        itemId: item.id,
                        itemNameEn: item.nameEn,
                        itemNameAr: item.nameAr,
                        residenceId: toResidenceId,
                        date: transactionTime,
                        type: 'TRANSFER_IN',
                        quantity: item.quantity,
                        referenceDocId: trsId,
                        relatedResidenceId: fromResidenceId,
                        locationName: `Transfer from residence`
                    });
                }
                transaction.update(transferRef, {
                    status: 'Completed',
                    approvedById: approverId,
                    approvedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                    // store TRS short code for reference/display on the transfer
                    // @ts-ignore - optional property added below on the interface
                    codeShort: trsId
                });
            });
            toast({
                title: "Success",
                description: "Transfer approved and stock updated."
            });
        } catch (error) {
            console.error("Failed to approve transfer:", error);
            const err = error;
            toast({
                title: "Error",
                description: `Approval failed: ${err.message}`,
                variant: "destructive"
            });
        }
    };
    const rejectTransfer = async (transferId, rejecterId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        const transferRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockTransfers', transferId);
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(transferRef, {
            status: 'Rejected',
            rejectedById: rejecterId,
            rejectedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
        });
        toast({
            title: "Success",
            description: "Transfer request has been rejected."
        });
    };
    const depreciateItems = async (depreciationRequest)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        try {
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
                // Get the item to verify it exists and get its names
                const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventory", depreciationRequest.itemId);
                const itemSnap = await transaction.get(itemRef);
                if (!itemSnap.exists()) {
                    throw new Error("Item not found");
                }
                const itemData = itemSnap.data();
                // Check if there's enough stock
                const currentStock = Math.max(0, Number(itemData.stockByResidence?.[depreciationRequest.residenceId] || 0));
                if (currentStock < depreciationRequest.quantity) {
                    throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${depreciationRequest.quantity}`);
                }
                // Prepare counter read BEFORE any writes (Firestore rule)
                const now = new Date();
                const yy = now.getFullYear().toString().slice(-2);
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                const mmNoPad = (now.getMonth() + 1).toString();
                const depCounterId = `dep-${yy}-${mm}`;
                const depCounterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'counters', depCounterId);
                const depSnap = await transaction.get(depCounterRef);
                const depCurrent = (depSnap.exists() ? depSnap.data().seq : 0) || 0;
                const depNextSeq = depCurrent + 1;
                const depCodeShort = `DEP-${yy}${mmNoPad}${depNextSeq}`;
                // Now perform writes
                // Update stock for the residence
                const newStockByResidence = {
                    ...itemData.stockByResidence || {}
                };
                newStockByResidence[depreciationRequest.residenceId] = Math.max(0, currentStock - depreciationRequest.quantity);
                // Calculate new total stock
                const newTotalStock = Object.values(newStockByResidence).reduce((sum, stock)=>{
                    const num = Number(stock);
                    return sum + (isNaN(num) ? 0 : Math.max(0, num));
                }, 0);
                // Update item document
                transaction.update(itemRef, {
                    stock: newTotalStock,
                    stockByResidence: newStockByResidence
                });
                // Update counter (write after all reads)
                transaction.set(depCounterRef, {
                    seq: depNextSeq,
                    yy,
                    mm,
                    updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
                }, {
                    merge: true
                });
                // Create depreciation transaction
                const depreciationTransactionRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "inventoryTransactions"));
                const transactionData = {
                    itemId: depreciationRequest.itemId,
                    itemNameEn: itemData.nameEn,
                    itemNameAr: itemData.nameAr,
                    residenceId: depreciationRequest.residenceId,
                    date: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                    type: 'DEPRECIATION',
                    quantity: depreciationRequest.quantity,
                    referenceDocId: depCodeShort,
                    locationId: depreciationRequest.locationId,
                    locationName: depreciationRequest.locationName,
                    depreciationReason: depreciationRequest.reason
                };
                transaction.set(depreciationTransactionRef, transactionData);
            });
            toast({
                title: "Success",
                description: `Successfully depreciated ${depreciationRequest.quantity} items. Reason: ${depreciationRequest.reason}`
            });
        } catch (error) {
            console.error("Failed to depreciate items:", error);
            const err = error;
            toast({
                title: "Error",
                description: `Depreciation failed: ${err.message}`,
                variant: "destructive"
            });
            throw error;
        }
    };
    // Audit functions
    const createAudit = async (auditData)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        try {
            const auditRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryAudits'));
            const audit = {
                ...auditData,
                id: auditRef.id,
                createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                summary: {
                    totalItems: 0,
                    completedItems: 0,
                    discrepanciesCount: 0,
                    adjustmentsMade: 0
                }
            };
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(auditRef, audit);
            toast({
                title: "Success",
                description: "Audit created successfully."
            });
            return audit.id;
        } catch (error) {
            console.error("Error creating audit:", error);
            toast({
                title: "Error",
                description: "Failed to create audit.",
                variant: "destructive"
            });
            throw error;
        }
    };
    const getAudits = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return [];
        }
        try {
            const q = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryAudits'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])('createdAt', 'desc'));
            const querySnapshot = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(q);
            return querySnapshot.docs.map((doc)=>doc.data());
        } catch (error) {
            console.error('Error fetching audits:', error);
            toast({
                title: "Error",
                description: "Failed to fetch audits.",
                variant: "destructive"
            });
            return [];
        }
    };
    const getAuditById = async (auditId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return null;
        }
        try {
            const auditRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryAudits', auditId);
            const auditSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(auditRef);
            if (!auditSnap.exists()) {
                return null;
            }
            return auditSnap.data();
        } catch (error) {
            console.error('Error fetching audit:', error);
            toast({
                title: "Error",
                description: "Failed to fetch audit.",
                variant: "destructive"
            });
            return null;
        }
    };
    const updateAuditStatus = async (auditId, status)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        try {
            const auditRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryAudits', auditId);
            const updateData = {
                status
            };
            if (status === 'IN_PROGRESS') {
                updateData.startDate = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            } else if (status === 'COMPLETED') {
                updateData.endDate = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            }
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(auditRef, updateData);
            toast({
                title: "Success",
                description: "Audit status updated."
            });
        } catch (error) {
            console.error('Error updating audit status:', error);
            toast({
                title: "Error",
                description: "Failed to update audit status.",
                variant: "destructive"
            });
            throw error;
        }
    };
    const getAuditItems = async (auditId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return [];
        }
        try {
            const q = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'auditItems'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('auditId', '==', auditId));
            const querySnapshot = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(q);
            return querySnapshot.docs.map((doc)=>doc.data());
        } catch (error) {
            console.error('Error fetching audit items:', error);
            toast({
                title: "Error",
                description: "Could not fetch audit items.",
                variant: "destructive"
            });
            return [];
        }
    };
    const updateAuditItem = async (auditItem)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        try {
            const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'auditItems', auditItem.id);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(itemRef, {
                ...auditItem
            });
        } catch (error) {
            console.error('Error updating audit item:', error);
            toast({
                title: "Error",
                description: "Failed to update audit item.",
                variant: "destructive"
            });
            throw error;
        }
    };
    const submitAuditCount = async (auditId, itemId, physicalStock, notes, countedBy)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        try {
            const q = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'auditItems'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('auditId', '==', auditId), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('itemId', '==', itemId));
            const querySnapshot = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(q);
            if (querySnapshot.empty) {
                throw new Error('Audit item not found');
            }
            const auditItemDoc = querySnapshot.docs[0];
            const auditItem = auditItemDoc.data();
            const difference = physicalStock - auditItem.systemStock;
            const status = difference === 0 ? 'VERIFIED' : 'DISCREPANCY';
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(auditItemDoc.ref, {
                physicalStock,
                difference,
                status,
                notes,
                countedBy,
                countedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            });
            toast({
                title: "Success",
                description: "Count submitted successfully."
            });
        } catch (error) {
            console.error('Error submitting audit count:', error);
            toast({
                title: "Error",
                description: "Failed to submit count.",
                variant: "destructive"
            });
            throw error;
        }
    };
    const completeAudit = async (auditId, adjustments, generalNotes)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        try {
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
                const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
                // 1) Read all required docs first (no writes yet)
                const auditRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryAudits', auditId);
                const itemRefs = adjustments.map((a)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', a.itemId));
                const itemSnaps = await Promise.all(itemRefs.map((r)=>transaction.get(r)));
                const writes = [];
                // Update audit status at the end
                writes.push({
                    type: 'auditUpdate',
                    ref: auditRef,
                    updates: {
                        status: 'COMPLETED',
                        endDate: now,
                        'summary.adjustmentsMade': adjustments.length
                    }
                });
                for(let i = 0; i < adjustments.length; i++){
                    const adjustment = adjustments[i];
                    const itemRef = itemRefs[i];
                    const itemSnap = itemSnaps[i];
                    if (!itemSnap.exists()) continue;
                    const itemData = itemSnap.data();
                    const currentResidenceStock = Math.max(0, Number(itemData.stockByResidence?.[adjustment.locationId] || 0));
                    const newResidenceStock = Math.max(0, Number(adjustment.newStock));
                    // Compute new stockByResidence and total
                    const newStockByResidence = {
                        ...itemData.stockByResidence || {}
                    };
                    newStockByResidence[adjustment.locationId] = newResidenceStock;
                    const newTotalStock = Object.values(newStockByResidence).reduce((sum, stock)=>{
                        const num = Number(stock);
                        return sum + (isNaN(num) ? 0 : Math.max(0, num));
                    }, 0);
                    // Queue item update
                    writes.push({
                        type: 'itemUpdate',
                        ref: itemRef,
                        updates: {
                            stock: newTotalStock,
                            stockByResidence: newStockByResidence
                        }
                    });
                    // Queue transaction log
                    const txRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'));
                    const diffAbs = Math.abs(newResidenceStock - currentResidenceStock);
                    const txData = {
                        itemId: adjustment.itemId,
                        itemNameEn: itemData.nameEn,
                        itemNameAr: itemData.nameAr,
                        residenceId: adjustment.locationId,
                        date: now,
                        type: 'ADJUSTMENT',
                        quantity: diffAbs,
                        referenceDocId: auditId,
                        locationName: adjustment.locationName,
                        adjustmentDirection: newResidenceStock >= currentResidenceStock ? 'INCREASE' : 'DECREASE'
                    };
                    if (adjustment.reason && adjustment.reason.trim() !== '') {
                        txData.adjustmentReason = adjustment.reason.trim();
                    }
                    writes.push({
                        type: 'txSet',
                        ref: txRef,
                        data: txData
                    });
                }
                // 3) Execute all queued writes
                for (const w of writes){
                    if (w.type === 'itemUpdate') {
                        transaction.update(w.ref, w.updates);
                    } else if (w.type === 'txSet') {
                        transaction.set(w.ref, w.data);
                    } else if (w.type === 'adjSet') {
                        transaction.set(w.ref, w.data);
                    } else if (w.type === 'auditUpdate') {
                        transaction.update(w.ref, w.updates);
                    }
                }
            });
            toast({
                title: 'Success',
                description: `Audit completed successfully. ${adjustments.length} adjustments applied.`
            });
        } catch (error) {
            console.error('Error completing audit:', error);
            toast({
                title: 'Error',
                description: 'Failed to complete audit.',
                variant: 'destructive'
            });
            throw error;
        }
    };
    // Simplified stock reconciliation: update per-residence stock directly and log adjustments in inventoryTransactions
    const reconcileStock = async (residenceId, adjustments, performedById, overrideReferenceId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: 'Error',
                description: firebaseErrorMessage,
                variant: 'destructive'
            });
            return;
        }
        if (!residenceId) {
            toast({
                title: 'Error',
                description: 'Residence is required.',
                variant: 'destructive'
            });
            return;
        }
        const filtered = adjustments.map((a)=>({
                ...a,
                newStock: Math.max(0, Number(a.newStock) || 0)
            })).filter((a)=>!!a.itemId);
        if (filtered.length === 0) return;
        const referenceId = overrideReferenceId || await reserveNewReconciliationId();
        try {
            let totalIncrease = 0;
            let totalDecrease = 0;
            let itemCount = 0;
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
                const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
                // 1) Read all required documents first (no writes yet)
                const itemRefs = filtered.map((adj)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', adj.itemId));
                const itemSnaps = await Promise.all(itemRefs.map((r)=>transaction.get(r)));
                const plannedWrites = [];
                for(let i = 0; i < filtered.length; i++){
                    const adj = filtered[i];
                    const itemRef = itemRefs[i];
                    const itemSnap = itemSnaps[i];
                    if (!itemSnap.exists()) continue;
                    const itemData = itemSnap.data();
                    const currentResidenceStock = Math.max(0, Number(itemData.stockByResidence?.[residenceId] || 0));
                    const newResidenceStock = Math.max(0, Number(adj.newStock));
                    const diff = newResidenceStock - currentResidenceStock;
                    if (diff === 0) continue;
                    // Track summary
                    itemCount += 1;
                    if (diff > 0) totalIncrease += diff;
                    else totalDecrease += Math.abs(diff);
                    // Prepare item update
                    const newStockByResidence = {
                        ...itemData.stockByResidence || {}
                    };
                    newStockByResidence[residenceId] = newResidenceStock;
                    const newTotal = Object.values(newStockByResidence).reduce((sum, v)=>{
                        const n = Number(v);
                        return sum + (isNaN(n) ? 0 : Math.max(0, n));
                    }, 0);
                    const itemUpdate = {
                        stockByResidence: newStockByResidence,
                        stock: newTotal
                    };
                    // Prepare transaction log
                    const txRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'));
                    const txData = {
                        itemId: adj.itemId,
                        itemNameEn: itemData.nameEn,
                        itemNameAr: itemData.nameAr,
                        residenceId: residenceId,
                        date: now,
                        type: 'ADJUSTMENT',
                        quantity: Math.abs(diff),
                        referenceDocId: referenceId,
                        locationName: 'Stock reconciliation',
                        adjustmentDirection: diff > 0 ? 'INCREASE' : 'DECREASE'
                    };
                    if (adj.reason && adj.reason.trim() !== '') {
                        txData.adjustmentReason = adj.reason.trim();
                    }
                    plannedWrites.push({
                        itemRef,
                        itemUpdate,
                        txRef,
                        txData
                    });
                }
                // 3) Perform writes after all reads are complete
                for (const w of plannedWrites){
                    transaction.update(w.itemRef, w.itemUpdate);
                    transaction.set(w.txRef, w.txData);
                }
                // Write master reconciliation record last
                const reconRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockReconciliations', referenceId);
                const reconData = {
                    id: referenceId,
                    residenceId,
                    date: now,
                    itemCount,
                    totalIncrease,
                    totalDecrease
                };
                if (performedById && performedById.trim() !== '') {
                    reconData.performedById = performedById.trim();
                }
                transaction.set(reconRef, reconData);
            });
            toast({
                title: 'Success',
                description: 'Stock reconciliation applied and logged to item movements.'
            });
            return referenceId;
        } catch (e) {
            console.error('Failed to reconcile stock:', e);
            toast({
                title: 'Error',
                description: 'Failed to apply reconciliation.',
                variant: 'destructive'
            });
            throw e;
        }
    };
    // Reconciliation query helpers
    const getReconciliations = async (residenceId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return [];
        }
        try {
            const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockReconciliations'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('residenceId', '==', residenceId));
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
            const recs = snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
            // Sort client-side by date desc to avoid composite indexes
            recs.sort((a, b)=>(b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
            return recs;
        } catch (error) {
            console.error('Error fetching reconciliations:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch reconciliations.',
                variant: 'destructive'
            });
            return [];
        }
    };
    // Maintenance: scan and fix any negative stock values at the residence level
    const fixNegativeStocks = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        // Read all inventory docs
        const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory'));
        if (snap.empty) return {
            fixedCount: 0,
            affectedItems: []
        };
        let fixedCount = 0;
        const affected = [];
        // We'll run in batches of transactions for safety and to log corrections
        const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
        for (const d of snap.docs){
            const item = d.data();
            const sbr = {
                ...item.stockByResidence || {}
            };
            const original = {
                ...sbr
            };
            let changed = false;
            for (const key of Object.keys(sbr)){
                const val = Number(sbr[key] ?? 0);
                if (!isNaN(val) && val < 0) {
                    sbr[key] = 0; // clamp to zero
                    changed = true;
                }
            }
            if (!changed) continue;
            // Recompute total
            const newTotal = Object.values(sbr).reduce((sum, v)=>{
                const n = Number(v);
                return sum + (isNaN(n) ? 0 : Math.max(0, n));
            }, 0);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
                const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventory', d.id);
                const fresh = await trx.get(itemRef);
                if (!fresh.exists()) return;
                // Update stockByResidence and stock
                trx.update(itemRef, {
                    stockByResidence: sbr,
                    stock: newTotal
                });
                // For every negative that was clamped, log an ADJUSTMENT with reason
                for (const rid of Object.keys(original)){
                    const before = Number(original[rid] ?? 0);
                    const after = Number(sbr[rid] ?? 0);
                    if (before < 0 && after === 0) {
                        const diff = Math.abs(before); // amount removed to reach 0
                        const txRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'));
                        trx.set(txRef, {
                            itemId: d.id,
                            itemNameEn: item.nameEn || item.name || d.id,
                            itemNameAr: item.nameAr || '',
                            residenceId: rid,
                            date: now,
                            type: 'ADJUSTMENT',
                            quantity: diff,
                            referenceDocId: 'AUTO-FIX-NEGATIVE',
                            locationName: 'System auto-fix',
                            adjustmentReason: 'Clamped negative stock to zero',
                            adjustmentDirection: 'INCREASE'
                        });
                    }
                }
            });
            fixedCount++;
            affected.push(d.id);
        }
        if (fixedCount > 0) {
            toast({
                title: 'Inventory corrected',
                description: `Fixed ${fixedCount} item(s) with negative stock values.`
            });
        }
        return {
            fixedCount,
            affectedItems: affected
        };
    };
    const getAllReconciliations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            console.warn('Firebase disabled: getAllReconciliations fallback to empty list');
            return [];
        }
        try {
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockReconciliations'));
            const recs = snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
            recs.sort((a, b)=>(b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
            return recs;
        } catch (error) {
            console.error('Error fetching all reconciliations:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch all reconciliations.',
                variant: 'destructive'
            });
            return [];
        }
    }, [
        toast
    ]);
    const getReconciliationById = async (id)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return null;
        }
        try {
            const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'stockReconciliations', id);
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
            if (!snap.exists()) return null;
            return {
                id: snap.id,
                ...snap.data()
            };
        } catch (error) {
            console.error('Error fetching reconciliation by id:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch reconciliation.',
                variant: 'destructive'
            });
            return null;
        }
    };
    const getReconciliationItems = async (referenceDocId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return [];
        }
        try {
            const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'inventoryTransactions'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('referenceDocId', '==', referenceDocId));
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
            const items = snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
            // Sort by date desc for display
            items.sort((a, b)=>(b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
            return items;
        } catch (error) {
            console.error('Error fetching reconciliation items:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch reconciliation items.',
                variant: 'destructive'
            });
            return [];
        }
    };
    // Reconciliation approval workflow implementations
    const getReconciliationRequests = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (resId, status)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            console.warn('Firebase disabled: getReconciliationRequests fallback to empty list');
            return [];
        }
        try {
            let qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'reconciliationRequests');
            const clauses = [];
            if (resId) clauses.push((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('residenceId', '==', resId));
            if (status) clauses.push((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('status', '==', status));
            if (clauses.length > 0) {
                qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])(qRef, ...clauses);
            }
            const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
            const arr = snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
            arr.sort((a, b)=>(b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0));
            return arr;
        } catch (e) {
            console.error('Error fetching reconciliation requests:', e);
            toast({
                title: 'Error',
                description: 'Failed to fetch reconciliation requests.',
                variant: 'destructive'
            });
            return [];
        }
    }, [
        toast
    ]);
    const createReconciliationRequest = async (resId, adjustments, requestedById)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        if (!resId || !adjustments || adjustments.length === 0) throw new Error('Residence and at least one adjustment are required');
        // Reserve a reconciliation code for display
        const reservedId = await reserveNewReconciliationId();
        const reqRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'reconciliationRequests'));
        const payload = {
            id: reqRef.id,
            residenceId: resId,
            adjustments,
            status: 'Pending',
            requestedById,
            requestedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
            reservedId
        };
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(reqRef, payload);
        toast({
            title: 'Submitted',
            description: 'Reconciliation request submitted for admin approval.'
        });
        // Notify all admins
        try {
            const admins = (users || []).filter((u)=>u.role === 'Admin');
            for (const admin of admins){
                await addNotification?.({
                    userId: admin.id,
                    title: 'Reconciliation Request',
                    message: `New reconciliation request for residence ${resId}.`,
                    type: 'generic',
                    href: '/inventory/inventory-audit',
                    referenceId: reqRef.id
                });
            }
        } catch  {}
        return reqRef.id;
    };
    const approveReconciliationRequest = async (requestId, approverId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        const reqRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'reconciliationRequests', requestId);
        const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(reqRef);
        if (!snap.exists()) throw new Error('Request not found');
        const data = snap.data();
        if (data.status !== 'Pending') throw new Error('Request already processed');
        // Apply reconciliation using reserved id if present
        const refId = await reconcileStock(data.residenceId, data.adjustments, approverId, data.reservedId);
        const finalRef = typeof refId === 'string' ? refId : undefined;
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(reqRef, {
            status: 'Approved',
            approvedById: approverId,
            approvedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
            referenceId: finalRef || null
        });
        toast({
            title: 'Approved',
            description: 'Reconciliation request approved and applied.'
        });
        // Notify requester
        try {
            if (data.requestedById) {
                await addNotification?.({
                    userId: data.requestedById,
                    title: 'Reconciliation Approved',
                    message: `Your reconciliation was approved (${finalRef || data.reservedId || ''}).`,
                    type: 'generic',
                    href: '/inventory/inventory-audit',
                    referenceId: finalRef || requestId
                });
            }
        } catch  {}
        return finalRef || '';
    };
    const rejectReconciliationRequest = async (requestId, rejecterId, reason)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error(firebaseErrorMessage);
        const reqRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'reconciliationRequests', requestId);
        const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(reqRef);
        if (!snap.exists()) throw new Error('Request not found');
        const data = snap.data();
        if (data.status !== 'Pending') throw new Error('Request already processed');
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(reqRef, {
            status: 'Rejected',
            rejectedById: rejecterId,
            rejectedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
            rejectReason: reason || null
        });
        toast({
            title: 'Rejected',
            description: 'Reconciliation request has been rejected.'
        });
        // Notify requester
        try {
            if (data.requestedById) {
                await addNotification?.({
                    userId: data.requestedById,
                    title: 'Reconciliation Rejected',
                    message: `Your reconciliation was rejected${reason ? `: ${reason}` : ''}.`,
                    type: 'generic',
                    href: '/inventory/inventory-audit',
                    referenceId: requestId
                });
            }
        } catch  {}
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(InventoryContext.Provider, {
        value: {
            items,
            inventoryItems: items,
            categories,
            transfers,
            audits,
            loading,
            addItem,
            updateItem,
            deleteItem,
            loadInventory,
            addCategory,
            updateCategory,
            updateMRV,
            updateMIV,
            getStockForResidence,
            issueItemsFromStock,
            getInventoryTransactions,
            getAllInventoryTransactions,
            getAllInventoryTransactionsRaw: async ()=>{
                // provide raw typed-any transactions if callers expect different shape
                const rows = await getAllInventoryTransactions();
                return rows;
            },
            getMIVs,
            getMIVById,
            getLastIssueDateForItemAtLocation,
            getAllIssueTransactions,
            createTransferRequest,
            approveTransfer,
            rejectTransfer,
            depreciateItems,
            fixNegativeStocks,
            createAudit,
            getAudits,
            getAuditById,
            updateAuditStatus,
            getAuditItems,
            updateAuditItem,
            submitAuditCount,
            completeAudit,
            reconcileStock,
            getReconciliations,
            getAllReconciliations,
            getReconciliationById,
            getReconciliationItems,
            getTransferItems,
            getReconciliationRequests,
            createReconciliationRequest,
            approveReconciliationRequest,
            rejectReconciliationRequest,
            // expose MRV helpers
            createMRV,
            getMRVs,
            getMRVById,
            // MRV requests
            checkItemLifespanAtLocation,
            getMRVRequests,
            approveMRVRequest,
            rejectMRVRequest
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/inventory-context.tsx",
        lineNumber: 2855,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useInventory = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/context/orders-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "OrdersProvider",
    ()=>OrdersProvider,
    "useOrders",
    ()=>useOrders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/users-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$notifications$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/context/notifications-context.tsx [app-ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
'use client';
;
;
;
;
;
;
;
const OrdersContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";
const ORDERS_LOCAL_STORAGE_KEY = 'estatecare_orders';
const loadOrdersFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(ORDERS_LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((order)=>({
                ...order,
                date: order.date && typeof order.date === 'object' && 'seconds' in order.date ? __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].fromMillis(order.date.seconds * 1000) : order.date instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"] ? order.date : __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }));
    } catch (error) {
        console.error('Failed to load orders from localStorage', error);
        return [];
    }
};
const INVENTORY_LOCAL_STORAGE_KEY = 'estatecare_inventory_items';
const MRV_DETAILS_LOCAL_STORAGE_KEY = 'estatecare_mrv_details';
const loadInventoryFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(INVENTORY_LOCAL_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to load inventory from localStorage', error);
        return [];
    }
};
const saveInventoryToLocalStorage = (items)=>{
    try {
        localStorage.setItem(INVENTORY_LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
        console.error('Failed to save inventory to localStorage', error);
    }
};
const loadMRVDetailsFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(MRV_DETAILS_LOCAL_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to load MRVs from localStorage', error);
        return [];
    }
};
const saveMRVDetailsToLocalStorage = (mrvs)=>{
    try {
        localStorage.setItem(MRV_DETAILS_LOCAL_STORAGE_KEY, JSON.stringify(mrvs));
    } catch (error) {
        console.error('Failed to save MRVs to localStorage', error);
    }
};
const saveOrdersToLocalStorage = (orders)=>{
    try {
        localStorage.setItem(ORDERS_LOCAL_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error('Failed to save orders to localStorage', error);
    }
};
const formatOrderSequenceId = (yy, mmNoPad, seq)=>`MR-${yy}${mmNoPad}${String(seq).padStart(2, '0')}`;
const generateLocalOrderId = ()=>{
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterKey = `estatecare_order_counter_${yy}-${mmNoPad}`;
    let nextSeq = 1;
    try {
        const raw = localStorage.getItem(counterKey);
        const current = raw ? parseInt(raw, 10) : 0;
        nextSeq = Number.isFinite(current) && current > 0 ? current + 1 : 1;
    } catch (error) {
        console.warn('Failed to read local order counter:', error);
    }
    try {
        localStorage.setItem(counterKey, String(nextSeq));
    } catch (error) {
        console.warn('Failed to persist local order counter:', error);
    }
    return formatOrderSequenceId(yy, mmNoPad, nextSeq);
};
const OrdersProvider = ({ children })=>{
    const [orders, setOrders] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    // Initialize as false so UI doesn’t show saving/submitting states until an action starts
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const unsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { addNotification } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$notifications$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useNotifications"])();
    const { users, currentUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$context$2f$users$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUsers"])();
    const loadOrders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (unsubscribeRef.current) {
            unsubscribeRef.current(); // Unsubscribe from previous listener
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            console.warn("Firebase not configured, loading orders from localStorage");
            setOrders(loadOrdersFromLocalStorage());
            setLoading(false);
            return;
        }
        setLoading(true);
        const ordersCollection = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "orders");
        unsubscribeRef.current = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])(ordersCollection, (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])("date", "desc")), (snapshot)=>{
            const ordersData = snapshot.docs.map((doc)=>({
                    id: doc.id,
                    ...doc.data()
                }));
            setOrders(ordersData);
            setLoading(false);
        }, (error)=>{
            console.error("Error fetching orders:", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch orders data.",
                variant: "destructive"
            });
            setLoading(false);
        });
    }, [
        toast
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadOrders();
        return ()=>{
            if (unsubscribeRef.current) {
                try {
                    unsubscribeRef.current();
                } catch  {}
                unsubscribeRef.current = null;
            }
        };
    }, [
        loadOrders
    ]);
    const generateNewOrderId = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            throw new Error("Firebase not initialized");
        }
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2); // e.g., 25
        const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // e.g., 08
        const mmNoPad = (now.getMonth() + 1).toString(); // e.g., 8
        const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'counters', `mr-${yy}-${mmNoPad}`);
        let nextSeq = 0;
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
            const snap = await trx.get(counterRef);
            const current = (snap.exists() ? snap.data().seq : 0) || 0;
            nextSeq = current + 1;
            trx.set(counterRef, {
                seq: nextSeq,
                yy,
                mm: mmNoPad,
                updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }, {
                merge: true
            });
        });
        return formatOrderSequenceId(yy, mmNoPad, nextSeq);
    };
    const createOrder = async (orderData)=>{
        if (!orderData) {
            toast({
                title: "Error",
                description: "Cannot create order with empty data.",
                variant: "destructive"
            });
            return null;
        }
        setLoading(true);
        try {
            // Guard: ensure the requester on the document matches the signed-in session user ID.
            const authUid = currentUser?.id;
            if (!authUid) {
                toast({
                    title: "Auth required",
                    description: "You must be signed in to create a request.",
                    variant: "destructive"
                });
                return null;
            }
            const requesterEmail = currentUser?.email || undefined;
            const requesterName = currentUser?.name || users?.find((u)=>u.id === authUid)?.name || requesterEmail || '—';
            const safeOrderData = {
                ...orderData,
                requestedById: authUid
            };
            let newOrderId = generateLocalOrderId();
            let newOrder = {
                ...safeOrderData,
                requestedByName: requesterName,
                requestedByEmail: requesterEmail,
                date: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                status: 'Pending'
            };
            if (__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
                newOrderId = await generateNewOrderId();
                const newOrderRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "orders", newOrderId);
                await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(newOrderRef, {
                    ...newOrder,
                    id: newOrderId
                });
            } else {
                const localOrder = {
                    id: newOrderId,
                    ...newOrder
                };
                const nextOrders = [
                    ...orders,
                    localOrder
                ];
                setOrders(nextOrders);
                saveOrdersToLocalStorage(nextOrders);
            }
            // Notify all Admin users about the new order when possible.
            try {
                let adminUserIds = users?.filter((u)=>u.role === 'Admin').map((u)=>u.id) || [];
                if (__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"] && adminUserIds.length === 0) {
                    const adminsQ = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'users'), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])('role', '==', 'Admin'));
                    const adminsSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(adminsQ);
                    adminUserIds = adminsSnap.docs.map((d)=>d.id);
                }
                if (adminUserIds.length > 0) {
                    await Promise.all(adminUserIds.map((adminId)=>addNotification?.({
                            userId: adminId,
                            title: 'New Material Request',
                            message: `Request #${newOrderId} • ${orderData.residence}`,
                            type: 'new_order',
                            href: `/inventory/orders/${newOrderId}`,
                            referenceId: newOrderId
                        })));
                }
            } catch (notifyErr) {
                console.warn('Failed to send admin notifications for new order:', notifyErr);
            }
            return newOrderId;
        } catch (error) {
            console.error("Error creating order:", error);
            toast({
                title: "Error",
                description: "Failed to create order.",
                variant: "destructive"
            });
            return null;
        } finally{
            setLoading(false);
        }
    };
    const updateOrder = async (id, orderData)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const nextOrders = orders.map((order)=>order.id === id ? {
                    ...order,
                    ...orderData
                } : order);
            setOrders(nextOrders);
            saveOrdersToLocalStorage(nextOrders);
            toast({
                title: "Success",
                description: "Order updated locally."
            });
            return;
        }
        setLoading(true);
        try {
            const orderDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "orders", id);
            // Fetch existing order to enforce permissions
            const existingSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(orderDocRef);
            if (!existingSnap.exists()) {
                toast({
                    title: "Error",
                    description: "Order not found.",
                    variant: "destructive"
                });
                return;
            }
            const existing = existingSnap.data();
            const isAdmin = currentUser?.role === 'Admin';
            const allowed = existing.status === 'Pending' ? isAdmin || currentUser?.id === existing.requestedById : isAdmin;
            if (!allowed) {
                toast({
                    title: "Not allowed",
                    description: "You cannot edit this request at its current status.",
                    variant: "destructive"
                });
                return;
            }
            // Remove undefined fields to avoid Firestore update errors or unintended clears
            const sanitized = Object.fromEntries(Object.entries(orderData).filter(([, v])=>v !== undefined));
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(orderDocRef, sanitized);
            toast({
                title: "Success",
                description: "Order updated successfully."
            });
        } catch (error) {
            console.error("Error updating order:", error);
            toast({
                title: "Error",
                description: "Failed to update order.",
                variant: "destructive"
            });
        } finally{
            setLoading(false);
        }
    };
    const updateOrderStatus = async (id, status, approverId, attachmentData)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const nextOrders = orders.map((order)=>order.id === id ? {
                    ...order,
                    status,
                    approvedById: approverId || order.approvedById
                } : order);
            setOrders(nextOrders);
            saveOrdersToLocalStorage(nextOrders);
            toast({
                title: "Success",
                description: "Order status updated locally."
            });
            return;
        }
        try {
            const orderDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "orders", id);
            const updatePayload = {
                status
            };
            let requestedById = null;
            if (status === 'Approved' && approverId) {
                const orderDoc = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(orderDocRef);
                if (orderDoc.exists()) {
                    requestedById = orderDoc.data().requestedById;
                }
                updatePayload.approvedById = approverId;
                const approver = users?.find((u)=>u.id === approverId) || (currentUser?.id === approverId ? currentUser : null);
                updatePayload.approvedByName = approver?.name || undefined;
                // Add attachment data if provided
                if (attachmentData) {
                    updatePayload.approvalAttachmentUrl = attachmentData.url;
                    updatePayload.approvalAttachmentPath = attachmentData.path;
                    updatePayload.approvalAttachmentName = attachmentData.filename;
                    updatePayload.approvalAttachmentUploadedAt = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
                    updatePayload.approvalAttachmentUploadedById = approverId;
                }
            }
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(orderDocRef, updatePayload);
            // Send notification if the order was approved
            if (status === 'Approved' && requestedById && addNotification) {
                await addNotification({
                    userId: requestedById,
                    title: 'Material Request Approved',
                    message: `Your request #${id} has been approved.`,
                    type: 'order_approved',
                    href: `/inventory/orders/${id}`,
                    referenceId: id
                });
            }
            toast({
                title: "Success",
                description: `Order status changed to ${status}.`
            });
        } catch (error) {
            console.error("Error updating order status:", error);
            toast({
                title: "Error",
                description: "Failed to update order status.",
                variant: "destructive"
            });
        }
    };
    const receiveOrderItems = async (orderId, newlyReceivedItems, forceComplete)=>{
        // Client-side guard to avoid permission errors; allow Admin or Supervisor
        if (!currentUser || currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor') {
            toast({
                title: 'Insufficient permissions',
                description: 'Only Admins or Supervisors can receive materials and update stock.',
                variant: 'destructive'
            });
            throw new Error('Forbidden');
        }
        const findLocalOrder = ()=>{
            return orders.find((o)=>o.id === orderId) || loadOrdersFromLocalStorage().find((o)=>o.id === orderId) || null;
        };
        const updateLocalOrder = async (updatedOrder)=>{
            const nextOrders = orders.map((order)=>order.id === updatedOrder.id ? updatedOrder : order);
            setOrders(nextOrders);
            saveOrdersToLocalStorage(nextOrders);
        };
        const generateLocalMrvId = ()=>{
            const now = new Date();
            const yy = now.getFullYear().toString().slice(-2);
            const mmNoPad = (now.getMonth() + 1).toString();
            const counterKey = `estatecare_mrv_counter_${yy}-${mmNoPad}`;
            let nextSeq = 1;
            try {
                const raw = localStorage.getItem(counterKey);
                const current = raw ? parseInt(raw, 10) : 0;
                if (Number.isFinite(current) && current > 0) nextSeq = current + 1;
            } catch (error) {
                console.warn('Failed to read local MRV counter', error);
            }
            try {
                localStorage.setItem(counterKey, String(nextSeq));
            } catch (error) {
                console.warn('Failed to write local MRV counter', error);
            }
            return `MRV-${yy}${mmNoPad}${String(nextSeq).padStart(2, '0')}`;
        };
        setLoading(true);
        try {
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
                const localOrder = findLocalOrder();
                if (!localOrder) {
                    throw new Error('Order not found');
                }
                const validItems = (newlyReceivedItems || []).filter((item)=>item && typeof item.id === 'string' && item.id.trim().length > 0).map((item)=>({
                        ...item,
                        quantityReceived: Number(item.quantityReceived)
                    })).filter((item)=>Number.isFinite(item.quantityReceived) && item.quantityReceived > 0);
                if (validItems.length === 0 && !forceComplete) {
                    throw new Error('No valid items to receive.');
                }
                const residenceId = localOrder.residenceId;
                if (!residenceId) {
                    throw new Error('Residence ID not found on order.');
                }
                const localInventory = loadInventoryFromLocalStorage();
                const inventoryMap = new Map(localInventory.map((item)=>[
                        item.id,
                        item
                    ]));
                for (const receivedItem of validItems){
                    const inventoryItem = inventoryMap.get(receivedItem.id);
                    if (!inventoryItem) {
                        throw new Error(`Item not found in inventory: ${receivedItem.id}`);
                    }
                    const existingStock = Math.max(0, Number(inventoryItem.stockByResidence?.[residenceId] || 0));
                    const nextStock = existingStock + receivedItem.quantityReceived;
                    const updatedStockByResidence = {
                        ...inventoryItem.stockByResidence,
                        [residenceId]: nextStock
                    };
                    inventoryMap.set(receivedItem.id, {
                        ...inventoryItem,
                        stockByResidence: updatedStockByResidence,
                        stock: Object.values(updatedStockByResidence).reduce((sum, v)=>{
                            const n = Number(v);
                            return sum + (isNaN(n) ? 0 : Math.max(0, n));
                        }, 0)
                    });
                }
                saveInventoryToLocalStorage(Array.from(inventoryMap.values()));
                const existingReceived = localOrder.itemsReceived ? [
                    ...localOrder.itemsReceived
                ] : [];
                for (const receivedItem of validItems){
                    const idx = existingReceived.findIndex((ri)=>ri.id === receivedItem.id);
                    if (idx > -1) {
                        existingReceived[idx].quantityReceived += receivedItem.quantityReceived;
                    } else {
                        existingReceived.push({
                            id: receivedItem.id,
                            quantityReceived: receivedItem.quantityReceived
                        });
                    }
                }
                const allItemsDelivered = forceComplete || localOrder.items.every((requestedItem)=>{
                    const totalReceived = existingReceived.find((ri)=>ri.id === requestedItem.id)?.quantityReceived || 0;
                    return totalReceived >= requestedItem.quantity;
                });
                const updatedOrder = {
                    ...localOrder,
                    itemsReceived: existingReceived,
                    status: allItemsDelivered ? 'Delivered' : 'Partially Delivered'
                };
                await updateLocalOrder(updatedOrder);
                let localMrvId = null;
                if (validItems.length > 0) {
                    localMrvId = generateLocalMrvId();
                    const existingMrvs = loadMRVDetailsFromLocalStorage();
                    saveMRVDetailsToLocalStorage([
                        {
                            id: localMrvId,
                            date: new Date().toISOString(),
                            residenceId,
                            items: validItems.map((item)=>({
                                    itemId: item.id,
                                    itemNameEn: item.nameEn || '',
                                    itemNameAr: item.nameAr || '',
                                    quantity: item.quantityReceived
                                })),
                            supplierName: null,
                            invoiceNo: null,
                            attachmentUrl: null,
                            attachmentPath: null,
                            codeShort: localMrvId,
                            orderId,
                            receivedBy: currentUser.id,
                            receivedByName: currentUser.name
                        },
                        ...existingMrvs
                    ]);
                }
                toast({
                    title: 'Success',
                    description: 'Local stock updated and request status changed.'
                });
                return {
                    mrvId: localMrvId
                };
            }
            // Firebase path remains unchanged
            setLoading(true);
            const firestore = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"];
            const orderRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(firestore, "orders", orderId);
            // Candidate generator: try raw, before '::', before '-' (to support multiple variant schemes)
            const candidateBaseIds = (rawId)=>{
                const out = [];
                const push = (v)=>{
                    if (v && !out.includes(v)) out.push(v);
                };
                const s = String(rawId);
                push(s);
                if (s.includes('::')) push(s.split('::')[0]);
                if (s.includes('-')) push(s.split('-')[0]);
                return out;
            };
            // Best-effort decode of possibly URL-encoded labels
            const pretty = (s)=>{
                if (!s) return s;
                try {
                    if (/%[0-9A-Fa-f]{2}/.test(s)) return decodeURIComponent(s);
                } catch  {}
                return s;
            };
            let outMrvId = null;
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(firestore, async (transaction)=>{
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) {
                    throw new Error("Order not found");
                }
                const orderData = orderSnap.data();
                const residenceId = orderData.residenceId;
                if (!residenceId) {
                    throw new Error("Residence ID not found on order.");
                }
                const nowDate = new Date();
                const yy = nowDate.getFullYear().toString().slice(-2);
                const mm = (nowDate.getMonth() + 1).toString().padStart(2, '0');
                const mmNoPad = (nowDate.getMonth() + 1).toString();
                const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(firestore, 'counters', `mrv-${yy}-${mm}`);
                let reservedMrvShort = null;
                let nextSeqFromCounter = 0;
                const itemsToProcess = (newlyReceivedItems || []).filter((item)=>item && typeof item.id === 'string' && item.id.trim().length > 0).map((item)=>({
                        ...item,
                        quantityReceived: Number(item.quantityReceived)
                    })).filter((item)=>Number.isFinite(item.quantityReceived) && item.quantityReceived > 0);
                if (itemsToProcess.length === 0 && !forceComplete) {
                    throw new Error('No valid items to receive.');
                }
                if (itemsToProcess.length > 0) {
                    const counterSnap = await transaction.get(counterRef);
                    const currentSeq = (counterSnap.exists() ? counterSnap.data().seq : 0) || 0;
                    nextSeqFromCounter = currentSeq + 1;
                    reservedMrvShort = `MRV-${yy}${mmNoPad}${nextSeqFromCounter}`;
                    outMrvId = reservedMrvShort;
                }
                const itemRefsToFetch = new Map();
                for (const item of itemsToProcess){
                    for (const cid of candidateBaseIds(String(item.id))){
                        if (!itemRefsToFetch.has(cid)) itemRefsToFetch.set(cid, (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(firestore, 'inventory', cid));
                    }
                }
                const uniqueItemRefs = Array.from(itemRefsToFetch.values());
                const itemSnaps = await Promise.all(uniqueItemRefs.map((ref)=>transaction.get(ref)));
                const itemDataMap = new Map();
                for (const itemSnap of itemSnaps){
                    if (itemSnap.exists()) {
                        itemDataMap.set(itemSnap.id, itemSnap.data());
                    }
                }
                const resolveBaseId = (id)=>{
                    const candidates = candidateBaseIds(id);
                    for (const c of candidates)if (itemDataMap.has(c)) return c;
                    return null;
                };
                for (const receivedItem of itemsToProcess){
                    const baseItemId = resolveBaseId(String(receivedItem.id));
                    if (!baseItemId) {
                        const label = pretty(receivedItem.nameEn) || String(receivedItem.id);
                        throw new Error(`Item not found in inventory: ${label}`);
                    }
                }
                const validItems = itemsToProcess;
                const transactionTime = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
                const totalsByBaseItem = new Map();
                for (const r of validItems){
                    const baseId = (()=>{
                        const rb = resolveBaseId(String(r.id));
                        return rb || String(r.id);
                    })();
                    totalsByBaseItem.set(baseId, (totalsByBaseItem.get(baseId) || 0) + Number(r.quantityReceived || 0));
                }
                if (itemsToProcess.length > 0 && reservedMrvShort) {
                    transaction.set(counterRef, {
                        seq: nextSeqFromCounter,
                        yy,
                        mm,
                        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
                    }, {
                        merge: true
                    });
                }
                for (const [baseItemId, totalQty] of totalsByBaseItem.entries()){
                    const prevData = itemDataMap.get(baseItemId) || {};
                    const prevSbr = {
                        ...prevData.stockByResidence || {}
                    };
                    const prevAtResidence = Math.max(0, Number(prevSbr[residenceId] || 0));
                    const nextAtResidence = prevAtResidence + totalQty;
                    const newSbr = {
                        ...prevSbr,
                        [residenceId]: nextAtResidence
                    };
                    const newTotal = Object.values(newSbr).reduce((sum, v)=>{
                        const n = Number(v);
                        return sum + (isNaN(n) ? 0 : Math.max(0, n));
                    }, 0);
                    const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(firestore, 'inventory', baseItemId);
                    transaction.update(itemRef, {
                        stockByResidence: newSbr,
                        stock: newTotal
                    });
                }
                for (const receivedItem of validItems){
                    const baseItemId = (()=>{
                        const rb = resolveBaseId(String(receivedItem.id));
                        return rb || String(receivedItem.id);
                    })();
                    const inv = itemDataMap.get(baseItemId) || {};
                    const transactionRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(firestore, 'inventoryTransactions'));
                    transaction.set(transactionRef, {
                        itemId: baseItemId,
                        itemNameEn: inv.nameEn || pretty(receivedItem.nameEn) || inv.name || '',
                        itemNameAr: inv.nameAr || pretty(receivedItem.nameAr) || inv.name || '',
                        residenceId: residenceId,
                        date: transactionTime,
                        type: 'IN',
                        quantity: receivedItem.quantityReceived,
                        referenceDocId: reservedMrvShort || orderId
                    });
                }
                if (reservedMrvShort) {
                    let totalItemsCount = 0;
                    for (const [, qty] of totalsByBaseItem.entries())totalItemsCount += Number(qty) || 0;
                    const mrvRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(firestore, 'mrvs', reservedMrvShort);
                    transaction.set(mrvRef, {
                        id: reservedMrvShort,
                        date: transactionTime,
                        residenceId,
                        itemCount: totalItemsCount,
                        supplierName: null,
                        invoiceNo: null,
                        notes: `From MR ${orderId}`,
                        attachmentUrl: null,
                        attachmentPath: null,
                        attachmentRef: null,
                        codeShort: reservedMrvShort,
                        orderId: orderId,
                        receivedBy: currentUser?.id || null,
                        receivedByName: currentUser?.name || null
                    });
                }
                const existingReceived = orderData.itemsReceived ? [
                    ...orderData.itemsReceived
                ] : [];
                const currentReceivedById = new Map();
                for (const r of existingReceived)currentReceivedById.set(r.id, Number(r.quantityReceived) || 0);
                const linesByBaseId = new Map();
                for (const line of orderData.items){
                    const rb = resolveBaseId(String(line.id));
                    const key = rb || String(line.id);
                    const arr = linesByBaseId.get(key) || [];
                    arr.push({
                        id: line.id,
                        requestedQty: Number(line.quantity) || 0
                    });
                    linesByBaseId.set(key, arr);
                }
                for (const [baseItemId, totalQty] of totalsByBaseItem.entries()){
                    let remaining = Number(totalQty) || 0;
                    const lines = (linesByBaseId.get(baseItemId) || []).slice();
                    if (lines.length === 0) continue;
                    for (const line of lines){
                        if (remaining <= 0) break;
                        const already = currentReceivedById.get(line.id) || 0;
                        const remainingForLine = Math.max(0, line.requestedQty - already);
                        const allocate = remainingForLine > 0 ? Math.min(remaining, remainingForLine) : 0;
                        if (allocate > 0) {
                            const newVal = already + allocate;
                            currentReceivedById.set(line.id, newVal);
                            const idx = existingReceived.findIndex((it)=>it.id === line.id);
                            if (idx > -1) {
                                existingReceived[idx].quantityReceived = newVal;
                            } else {
                                existingReceived.push({
                                    id: line.id,
                                    quantityReceived: newVal
                                });
                            }
                            remaining -= allocate;
                        }
                    }
                    if (remaining > 0 && lines.length > 0) {
                        const first = lines[0];
                        const already = currentReceivedById.get(first.id) || 0;
                        const newVal = already + remaining;
                        currentReceivedById.set(first.id, newVal);
                        const idx = existingReceived.findIndex((it)=>it.id === first.id);
                        if (idx > -1) {
                            existingReceived[idx].quantityReceived = newVal;
                        } else {
                            existingReceived.push({
                                id: first.id,
                                quantityReceived: newVal
                            });
                        }
                        remaining = 0;
                    }
                }
                let allItemsDelivered = forceComplete ? true : true;
                if (!forceComplete) {
                    for (const requestedItem of orderData.items){
                        const totalReceived = existingReceived.find((ri)=>ri.id === requestedItem.id)?.quantityReceived || 0;
                        if (totalReceived < requestedItem.quantity) {
                            allItemsDelivered = false;
                            break;
                        }
                    }
                }
                const newStatus = allItemsDelivered ? 'Delivered' : 'Partially Delivered';
                transaction.update(orderRef, {
                    itemsReceived: existingReceived,
                    status: newStatus
                });
            });
            toast({
                title: 'Success',
                description: 'Stock updated and request status changed.'
            });
            return {
                mrvId: outMrvId
            };
        } catch (error) {
            console.error('Error receiving order items:', error);
            const err = error;
            toast({
                title: 'Transaction Error',
                description: `Failed to process receipt: ${err.message}`,
                variant: 'destructive'
            });
            throw err;
        } finally{
            setLoading(false);
        }
    };
    const getOrderById = async (id)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const localOrder = orders.find((o)=>o.id === id) || loadOrdersFromLocalStorage().find((o)=>o.id === id) || null;
            return localOrder;
        }
        const orderDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "orders", id);
        const docSnap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocFromServer"])(orderDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data
            };
        } else {
            return null;
        }
    };
    const deleteOrder = async (id)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            toast({
                title: "Error",
                description: firebaseErrorMessage,
                variant: "destructive"
            });
            return;
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "orders", id));
            toast({
                title: "Success",
                description: "Order deleted successfully."
            });
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                title: "Error",
                description: "Failed to delete order.",
                variant: "destructive"
            });
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OrdersContext.Provider, {
        value: {
            orders,
            loading,
            loadOrders,
            createOrder,
            updateOrder,
            updateOrderStatus,
            getOrderById,
            deleteOrder,
            receiveOrderItems
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/orders-context.tsx",
        lineNumber: 855,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
};
const useOrders = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(OrdersContext);
    if (context === undefined) {
        throw new Error('useOrders must be used within an OrdersProvider');
    }
    return context;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/context/maintenance-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "MaintenanceProvider",
    ()=>MaintenanceProvider,
    "useMaintenance",
    ()=>useMaintenance
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
'use client';
;
;
;
;
;
const MaintenanceContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const firebaseErrorMessage = "Error: Firebase is not configured. Please add your credentials to the .env file and ensure they are correct.";
const LS_KEY = 'estatecare_maintenance_requests';
// Helpers for localStorage fallback
const loadFromLocalStorage = ()=>{
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        // Ensure Timestamp shape
        return parsed.map((r)=>({
                ...r,
                date: r.date?.seconds ? new __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"](r.date.seconds, r.date.nanoseconds || 0) : __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }));
    } catch (e) {
        console.error('Failed to parse local maintenance data', e);
        return [];
    }
};
const saveToLocalStorage = (requests)=>{
    try {
        const serializable = requests.map((r)=>({
                ...r,
                // Firestore Timestamp can't be stringified directly; store as seconds/nanos
                date: {
                    seconds: r.date.seconds,
                    nanoseconds: r.date.nanoseconds
                }
            }));
        localStorage.setItem(LS_KEY, JSON.stringify(serializable));
    } catch (e) {
        console.error('Failed to save maintenance data locally', e);
    }
};
const MaintenanceProvider = ({ children })=>{
    const [requests, setRequests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const unsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isLoaded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const loadRequests = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (isLoaded.current) return;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Local fallback
            const localData = loadFromLocalStorage();
            setRequests(localData);
            setLoading(false);
            isLoaded.current = true;
            return;
        }
        isLoaded.current = true;
        setLoading(true);
        const requestsCollection = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "maintenanceRequests");
        unsubscribeRef.current = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])(requestsCollection, (snapshot)=>{
            const requestsData = snapshot.docs.map((doc)=>({
                    id: doc.id,
                    ...doc.data()
                }));
            requestsData.sort((a, b)=>b.date.toMillis() - a.date.toMillis());
            setRequests(requestsData);
            setLoading(false);
        }, (error)=>{
            console.error("Error fetching maintenance requests:", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch maintenance requests data.",
                variant: "destructive"
            });
            setLoading(false);
        });
    }, [
        toast
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Automatically load requests when the provider mounts
        loadRequests();
        return ()=>{
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                isLoaded.current = false;
            }
        };
    }, [
        loadRequests
    ]);
    const generateNewRequestId = async ()=>{
        // Use monthly counter similar to other modules: MNT-YYM#
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const mmNoPad = (now.getMonth() + 1).toString();
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            return `MNT-${yy}${mmNoPad}${Date.now().toString().slice(-3)}`;
        }
        // Use counters/mnt-YY-MM
        const counterId = `mnt-${yy}-${mm}`;
        const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], 'counters', counterId);
        let nextSeq = 0;
        // We are not in a broader transaction context here; rely on Firestore transaction for atomicity of the counter
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], async (trx)=>{
            const snap = await trx.get(counterRef);
            const current = (snap.exists() ? snap.data().seq : 0) || 0;
            nextSeq = current + 1;
            trx.set(counterRef, {
                seq: nextSeq,
                yy,
                mm,
                updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }, {
                merge: true
            });
        });
        return `MNT-${yy}${mmNoPad}${nextSeq}`;
    };
    const createRequest = async (payload)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Local fallback create
            const newId = await generateNewRequestId();
            const newReq = {
                ...payload,
                id: newId,
                date: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                status: 'Pending'
            };
            const updated = [
                newReq,
                ...requests
            ];
            setRequests(updated);
            saveToLocalStorage(updated);
            return newId;
        }
        setLoading(true);
        try {
            const newId = await generateNewRequestId();
            const newRequestRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "maintenanceRequests", newId);
            const authUid = currentUser?.id;
            if (!authUid) {
                toast({
                    title: "Auth required",
                    description: "You must be signed in to create a request.",
                    variant: "destructive"
                });
                return null;
            }
            const newRequest = {
                ...payload,
                requestedById: authUid,
                date: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now(),
                status: 'Pending'
            };
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["setDoc"])(newRequestRef, newRequest);
            return newId;
        } catch (error) {
            console.error("Error creating maintenance request:", error);
            toast({
                title: "Error",
                description: "Failed to create maintenance request.",
                variant: "destructive"
            });
            return null;
        } finally{
            setLoading(false);
        }
    };
    const updateRequestStatus = async (id, status)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            // Local fallback update
            const updated = requests.map((r)=>r.id === id ? {
                    ...r,
                    status
                } : r);
            setRequests(updated);
            saveToLocalStorage(updated);
            toast({
                title: "Success",
                description: `Request status updated to ${status}.`
            });
            return;
        }
        try {
            const requestDocRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "maintenanceRequests", id);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["updateDoc"])(requestDocRef, {
                status
            });
            toast({
                title: "Success",
                description: `Request status updated to ${status}.`
            });
        } catch (error) {
            console.error("Error updating request status:", error);
            toast({
                title: "Error",
                description: "Failed to update request status.",
                variant: "destructive"
            });
        }
    };
    const getRequestById = async (id)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const found = requests.find((r)=>r.id === id) || null;
            return found;
        }
        // Could be implemented if needed with getDoc
        return null;
    };
    const deleteRequest = async (id)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            const updated = requests.filter((r)=>r.id !== id);
            setRequests(updated);
            saveToLocalStorage(updated);
            toast({
                title: "Success",
                description: "Maintenance request deleted (local)."
            });
            return;
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "maintenanceRequests", id));
            toast({
                title: "Success",
                description: "Maintenance request deleted."
            });
        } catch (error) {
            console.error("Error deleting request:", error);
            toast({
                title: "Error",
                description: "Failed to delete request.",
                variant: "destructive"
            });
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MaintenanceContext.Provider, {
        value: {
            requests,
            loading,
            loadRequests,
            createRequest,
            updateRequestStatus,
            getRequestById,
            deleteRequest
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/maintenance-context.tsx",
        lineNumber: 237,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useMaintenance = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(MaintenanceContext);
    if (context === undefined) {
        throw new Error('useMaintenance must be used within a MaintenanceProvider');
    }
    return context;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/context/service-orders-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "ServiceOrdersProvider",
    ()=>ServiceOrdersProvider,
    "useServiceOrders",
    ()=>useServiceOrders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
"use client";
;
;
;
;
;
const ServiceOrdersContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const ServiceOrdersProvider = ({ children })=>{
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const [serviceOrders, setServiceOrders] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const subRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    const isLoaded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (isLoaded.current) return;
        isLoaded.current = true;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) {
            setLoading(false);
            console.warn("Firebase not configured, loading mock service orders");
            return;
        }
        setLoading(true);
        const fdb = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"];
        const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(fdb, "serviceOrders"), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["orderBy"])("dateCreated", "desc"));
        subRef.current = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["onSnapshot"])(qRef, (snap)=>{
            const arr = snap.docs.map((d)=>({
                    id: d.id,
                    ...d.data()
                }));
            setServiceOrders(arr);
            setLoading(false);
        }, (err)=>{
            console.error("Error fetching service orders:", err);
            toast({
                title: "Error",
                description: "Could not fetch service orders.",
                variant: "destructive"
            });
            setLoading(false);
        });
    }, [
        toast
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        load();
        return ()=>{
            subRef.current?.();
            isLoaded.current = false;
        };
    }, [
        load
    ]);
    const reserveNewSvcId = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not initialized");
        const fdb = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"];
        // Use counters/svc-YY-MM similar to other counters
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, "0");
        const mmNoPad = (now.getMonth() + 1).toString();
        const counterId = `svc-${yy}-${mm}`;
        const counterRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(fdb, "counters", counterId);
        let nextSeq = 0;
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(fdb, async (trx)=>{
            const snap = await trx.get(counterRef);
            const current = (snap.exists() ? snap.data().seq : 0) || 0;
            nextSeq = current + 1;
            trx.set(counterRef, {
                seq: nextSeq,
                yy,
                mm,
                updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now()
            }, {
                merge: true
            });
        });
        return `SVC-${yy}${mmNoPad}${nextSeq}`; // e.g., SVC-2583
    };
    const createAndDispatchServiceOrder = async (payload)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not configured");
        const fdb = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"];
        const validItems = (payload.items || []).filter((i)=>i.quantity && i.quantity > 0);
        if (!payload.residenceId || validItems.length === 0) {
            throw new Error("يرجى اختيار السكن وإضافة صنف واحد على الأقل بكمية أكبر من 0.");
        }
        const codeShort = await reserveNewSvcId();
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(fdb, async (trx)=>{
            const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            // 1) Read all inventory items first and validate stock
            const uniqueItemIds = [
                ...new Set(validItems.map((i)=>i.id))
            ];
            const itemRefs = uniqueItemIds.map((id)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(fdb, "inventory", id));
            const itemSnaps = await Promise.all(itemRefs.map((r)=>trx.get(r)));
            for(let i = 0; i < uniqueItemIds.length; i++){
                if (!itemSnaps[i].exists()) throw new Error(`الصنف غير موجود: ${uniqueItemIds[i]}`);
            }
            // Aggregate quantities per item to validate once
            const totals = new Map();
            for (const line of validItems){
                const prev = totals.get(line.id) || 0;
                totals.set(line.id, prev + Number(line.quantity || 0));
            }
            // Validate available stock per item
            for (const [itemId, totalToSend] of totals.entries()){
                const idx = uniqueItemIds.indexOf(itemId);
                const snap = itemSnaps[idx];
                const data = snap.data();
                const currentStock = Math.max(0, Number(data?.stockByResidence?.[payload.residenceId] || 0));
                if (currentStock < totalToSend) {
                    const name = data?.nameEn || data?.nameAr || data?.name || itemId;
                    throw new Error(`الكمية غير متوفرة للصنف ${name}. المتاح: ${currentStock} | المطلوب: ${totalToSend}`);
                }
            }
            // 2) Compute updates and prepare writes
            // Update inventory stocks (OUT)
            for (const [itemId, totalToSend] of totals.entries()){
                const idx = uniqueItemIds.indexOf(itemId);
                const itemRef = itemRefs[idx];
                const snap = itemSnaps[idx];
                const data = snap.data();
                const current = Math.max(0, Number(data?.stockByResidence?.[payload.residenceId] || 0));
                const sbr = {
                    ...data?.stockByResidence || {}
                };
                sbr[payload.residenceId] = Math.max(0, current - totalToSend);
                const newTotal = Object.values(sbr).reduce((sum, v)=>sum + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
                trx.update(itemRef, {
                    stockByResidence: sbr,
                    stock: newTotal
                });
            }
            // Log OUT transactions per line
            for (const line of validItems){
                const txRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(fdb, "inventoryTransactions"));
                trx.set(txRef, {
                    itemId: line.id,
                    itemNameEn: line.nameEn,
                    itemNameAr: line.nameAr,
                    residenceId: payload.residenceId,
                    date: now,
                    type: "OUT",
                    quantity: line.quantity,
                    referenceDocId: codeShort,
                    locationName: `Sent to maintenance/workshop: ${payload.destination?.name || "N/A"}`
                });
            }
            // Create service order master document
            const orderRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(fdb, "serviceOrders"));
            const order = {
                id: orderRef.id,
                codeShort,
                dateCreated: now,
                residenceId: payload.residenceId,
                residenceName: payload.residenceName,
                destination: payload.destination,
                status: "DISPATCHED",
                dispatchedAt: now,
                createdById: payload.createdById,
                dispatchedById: payload.dispatchedById,
                transportInfo: payload.transportInfo,
                notes: payload.notes,
                items: validItems.map((i)=>({
                        itemId: i.id,
                        itemNameEn: i.nameEn,
                        itemNameAr: i.nameAr,
                        qtySent: i.quantity,
                        qtyReturned: 0,
                        qtyScrapped: 0
                    }))
            };
            trx.set(orderRef, order);
        });
        toast({
            title: "Dispatched",
            description: "Service order created and dispatched."
        });
        return codeShort;
    };
    const receiveServiceOrder = async (orderId, updates, receivedById)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) throw new Error("Firebase not configured");
        const fdb = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"];
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["runTransaction"])(fdb, async (trx)=>{
            const orderRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(fdb, "serviceOrders", orderId);
            const orderSnap = await trx.get(orderRef);
            if (!orderSnap.exists()) throw new Error("Service order not found");
            const order = orderSnap.data();
            const now = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["Timestamp"].now();
            // Build a map of updates by itemId
            const updMap = new Map();
            for (const u of updates){
                const addR = Math.max(0, Number(u.addReturned || 0));
                const addS = Math.max(0, Number(u.addScrapped || 0));
                if (addR === 0 && addS === 0) continue;
                const existing = updMap.get(u.itemId) || {
                    addReturned: 0,
                    addScrapped: 0
                };
                updMap.set(u.itemId, {
                    addReturned: existing.addReturned + addR,
                    addScrapped: existing.addScrapped + addS
                });
            }
            if (updMap.size === 0) return; // nothing to do
            // Validate lines and compute deltas
            const newItems = order.items.map((ln)=>({
                    ...ln
                }));
            for (const [itemId, data] of updMap.entries()){
                const line = newItems.find((l)=>l.itemId === itemId);
                if (!line) throw new Error(`Item not found in order: ${itemId}`);
                const newReturned = line.qtyReturned + data.addReturned;
                const newScrapped = line.qtyScrapped + data.addScrapped;
                if (newReturned + newScrapped > line.qtySent) {
                    throw new Error(`Invalid quantities for ${line.itemNameEn}: returned+scrapped exceeds sent (sent=${line.qtySent})`);
                }
            }
            // Perform inventory updates and transaction logs based on deltas
            for (const [itemId, data] of updMap.entries()){
                const line = newItems.find((l)=>l.itemId === itemId);
                // Return delta
                if (data.addReturned > 0) {
                    const itemRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(fdb, "inventory", itemId);
                    const invSnap = await trx.get(itemRef);
                    if (!invSnap.exists()) throw new Error("Inventory item missing");
                    const inv = invSnap.data();
                    const sbr = {
                        ...inv?.stockByResidence || {}
                    };
                    const cur = Math.max(0, Number(sbr[order.residenceId] || 0));
                    sbr[order.residenceId] = cur + data.addReturned;
                    const newTotal = Object.values(sbr).reduce((sum, v)=>sum + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
                    trx.update(itemRef, {
                        stockByResidence: sbr,
                        stock: newTotal
                    });
                    const txRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(fdb, "inventoryTransactions"));
                    trx.set(txRef, {
                        itemId,
                        itemNameEn: line.itemNameEn,
                        itemNameAr: line.itemNameAr,
                        residenceId: order.residenceId,
                        date: now,
                        type: "IN",
                        quantity: data.addReturned,
                        referenceDocId: order.codeShort,
                        locationName: `Returned from maintenance/workshop: ${order.destination?.name || "N/A"}`
                    });
                    line.qtyReturned += data.addReturned;
                }
                // Scrap delta
                if (data.addScrapped > 0) {
                    // For scrapped: just log depreciation, stock was already reduced on dispatch
                    const txRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(fdb, "inventoryTransactions"));
                    trx.set(txRef, {
                        itemId,
                        itemNameEn: line.itemNameEn,
                        itemNameAr: line.itemNameAr,
                        residenceId: order.residenceId,
                        date: now,
                        type: "DEPRECIATION",
                        quantity: data.addScrapped,
                        referenceDocId: order.codeShort,
                        locationName: `Scrapped at workshop: ${order.destination?.name || "N/A"}`,
                        depreciationReason: "Scrapped at workshop"
                    });
                    line.qtyScrapped += data.addScrapped;
                }
            }
            // Determine new status
            let allClosed = true;
            for (const ln of newItems){
                if (ln.qtyReturned + ln.qtyScrapped < ln.qtySent) {
                    allClosed = false;
                    break;
                }
            }
            const newStatus = allClosed ? "COMPLETED" : "PARTIAL_RETURN";
            trx.update(orderRef, {
                items: newItems,
                status: newStatus,
                receivedById,
                receivedAt: now
            });
        });
        toast({
            title: "Received",
            description: "Service order receipt posted."
        });
    };
    const getServiceOrderById = async (orderId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) return null;
        const fdb = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"];
        const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["doc"])(fdb, "serviceOrders", orderId);
        const snap = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDoc"])(ref);
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
            id: snap.id,
            ...data
        };
    };
    const getServiceOrderByCode = async (codeShort)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"]) return null;
        const fdb = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"];
        const qRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["query"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["collection"])(fdb, "serviceOrders"), (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["where"])("codeShort", "==", codeShort));
        const res = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$29$__["getDocs"])(qRef);
        if (res.empty) return null;
        const d = res.docs[0];
        return {
            id: d.id,
            ...d.data()
        };
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ServiceOrdersContext.Provider, {
        value: {
            serviceOrders,
            loading,
            createAndDispatchServiceOrder,
            receiveServiceOrder,
            getServiceOrderById,
            getServiceOrderByCode
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/accommodation/src/context/service-orders-context.tsx",
        lineNumber: 395,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useServiceOrders = ()=>{
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ServiceOrdersContext);
    if (!ctx) throw new Error("useServiceOrders must be used within a ServiceOrdersProvider");
    return ctx;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/accommodation/src/components/auth-gate.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthGate",
    ()=>AuthGate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function AuthGate({ children }) {
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let mounted = true;
        async function verifySession() {
            try {
                await fetch('/api/auth/me', {
                    credentials: 'include',
                    cache: 'no-store'
                });
            } catch (error) {
            // Session check failed; allow the app to render and let client auth guards handle redirect.
            } finally{
                if (mounted) setReady(true);
            }
        }
        verifySession();
        return ()=>{
            mounted = false;
        };
    }, []);
    if (!ready) return null; // keep UI clean until auth is ready
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b83190b7._.js.map