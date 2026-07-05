(()=>{var a={};a.id=3112,a.ids=[3112],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4303:(a,b,c)=>{Promise.resolve().then(c.bind(c,79535))},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14988:a=>{"use strict";a.exports=import("firebase/messaging")},18106:a=>{"use strict";a.exports=import("firebase/app-check")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},26713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},27727:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(87463).A)("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]])},28354:a=>{"use strict";a.exports=require("util")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},41025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},44337:a=>{"use strict";a.exports=import("firebase/firestore")},48652:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>D.a,__next_app__:()=>J,handler:()=>L,pages:()=>I,routeModule:()=>K,tree:()=>H});var d=c(73653),e=c(97714),f=c(85250),g=c(37587),h=c(22369),i=c(1889),j=c(96232),k=c(22841),l=c(46537),m=c(46027),n=c(78559),o=c(75928),p=c(19374),q=c(65971),r=c(261),s=c(79898),t=c(32967),u=c(26713),v=c(40139),w=c(14248),x=c(59580),y=c(57749),z=c(53123),A=c(89745),B=c(86439),C=c(58671),D=c.n(C),E=c(18283),F=c(39818),G={};for(let a in E)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(G[a]=()=>E[a]);c.d(b,G);let H={children:["",{children:["inventory",{children:["orders",{children:["consolidated-report",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,79535)),"D:\\EstateCare\\studio\\apps\\materials\\src\\app\\inventory\\orders\\consolidated-report\\page.tsx"]}]},{}]},{}]},{metadata:{icon:[async a=>(await Promise.resolve().then(c.bind(c,72070))).default(a)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(c.bind(c,47570)),"D:\\EstateCare\\studio\\apps\\materials\\src\\app\\layout.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,58671,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.t.bind(c,17983,23)),"next/dist/client/components/builtin/not-found.js"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,15034,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,54693,23)),"next/dist/client/components/builtin/unauthorized.js"],metadata:{icon:[async a=>(await Promise.resolve().then(c.bind(c,72070))).default(a)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,I=["D:\\EstateCare\\studio\\apps\\materials\\src\\app\\inventory\\orders\\consolidated-report\\page.tsx"],J={require:c,loadChunk:()=>Promise.resolve()},K=new d.AppPageRouteModule({definition:{kind:e.RouteKind.APP_PAGE,page:"/inventory/orders/consolidated-report/page",pathname:"/inventory/orders/consolidated-report",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:H},distDir:".next",relativeProjectDir:""});async function L(a,b,d){var C;let G="/inventory/orders/consolidated-report/page";"/index"===G&&(G="/");let M=(0,h.getRequestMeta)(a,"postponed"),N=(0,h.getRequestMeta)(a,"minimalMode"),O=await K.prepare(a,b,{srcPage:G,multiZoneDraftMode:!1});if(!O)return b.statusCode=400,b.end("Bad Request"),null==d.waitUntil||d.waitUntil.call(d,Promise.resolve()),null;let{buildId:P,query:Q,params:R,parsedUrl:S,pageIsDynamic:T,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,serverActionsManifest:X,clientReferenceManifest:Y,subresourceIntegrityManifest:Z,prerenderManifest:$,isDraftMode:_,resolvedPathname:aa,revalidateOnlyGenerated:ab,routerServerContext:ac,nextConfig:ad,interceptionRoutePatterns:ae}=O,af=S.pathname||"/",ag=(0,r.normalizeAppPath)(G),{isOnDemandRevalidate:ah}=O,ai=K.match(af,$),aj=!!$.routes[aa],ak=!!(ai||aj||$.routes[ag]),al=a.headers["user-agent"]||"",am=(0,u.getBotType)(al),an=(0,p.isHtmlBotRequest)(a),ao=(0,h.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[t.NEXT_ROUTER_PREFETCH_HEADER],ap=(0,h.getRequestMeta)(a,"isRSCRequest")??!!a.headers[t.RSC_HEADER],aq=(0,s.getIsPossibleServerAction)(a),ar=(0,m.checkIsAppPPREnabled)(ad.experimental.ppr)&&(null==(C=$.routes[ag]??$.dynamicRoutes[ag])?void 0:C.renderingMode)==="PARTIALLY_STATIC",as=!1,at=!1,au=ar?M:void 0,av=ar&&ap&&!ao,aw=(0,h.getRequestMeta)(a,"segmentPrefetchRSCRequest"),ax=!al||(0,p.shouldServeStreamingMetadata)(al,ad.htmlLimitedBots);an&&ar&&(ak=!1,ax=!1);let ay=!0===K.isDev||!ak||"string"==typeof M||av,az=an&&ar,aA=null;_||!ak||ay||aq||au||av||(aA=aa);let aB=aA;!aB&&K.isDev&&(aB=aa),K.isDev||_||!ak||!ap||av||(0,k.d)(a.headers);let aC={...E,tree:H,pages:I,GlobalError:D(),handler:L,routeModule:K,__next_app__:J};X&&Y&&(0,o.setReferenceManifestsSingleton)({page:G,clientReferenceManifest:Y,serverActionsManifest:X,serverModuleMap:(0,q.createServerModuleMap)({serverActionsManifest:X})});let aD=a.method||"GET",aE=(0,g.getTracer)(),aF=aE.getActiveScopeSpan();try{let f=K.getVaryHeader(aa,ae);b.setHeader("Vary",f);let k=async(c,d)=>{let e=new l.NodeNextRequest(a),f=new l.NodeNextResponse(b);return K.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aE.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==i.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aD} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aD} ${a.url}`)})},m=async({span:e,postponed:f,fallbackRouteParams:g})=>{let i={query:Q,params:R,page:ag,sharedContext:{buildId:P},serverComponentsHmrCache:(0,h.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:g,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aC,Component:(0,j.T)(aC),params:R,routeModule:K,page:G,postponed:f,shouldWaitOnAllReady:az,serveStreamingMetadata:ax,supportsDynamicResponse:"string"==typeof f||ay,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,subresourceIntegrityManifest:Z,serverActionsManifest:X,clientReferenceManifest:Y,setIsrStatus:null==ac?void 0:ac.setIsrStatus,dir:c(33873).join(process.cwd(),K.relativeProjectDir),isDraftMode:_,isRevalidate:ak&&!f&&!av,botType:am,isOnDemandRevalidate:ah,isPossibleServerAction:aq,assetPrefix:ad.assetPrefix,nextConfigOutput:ad.output,crossOrigin:ad.crossOrigin,trailingSlash:ad.trailingSlash,previewProps:$.preview,deploymentId:ad.deploymentId,enableTainting:ad.experimental.taint,htmlLimitedBots:ad.htmlLimitedBots,devtoolSegmentExplorer:ad.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:ad.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:ad.experimental.cacheLife,basePath:ad.basePath,serverActions:ad.experimental.serverActions,...as?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:as}:{},experimental:{isRoutePPREnabled:ar,expireTime:ad.expireTime,staleTimes:ad.experimental.staleTimes,cacheComponents:!!ad.experimental.cacheComponents,clientSegmentCache:!!ad.experimental.clientSegmentCache,clientParamParsing:!!ad.experimental.clientParamParsing,dynamicOnHover:!!ad.experimental.dynamicOnHover,inlineCss:!!ad.experimental.inlineCss,authInterrupts:!!ad.experimental.authInterrupts,clientTraceMetadata:ad.experimental.clientTraceMetadata||[]},waitUntil:d.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>K.onRequestError(a,b,d,ac),err:(0,h.getRequestMeta)(a,"invokeError"),dev:K.isDev}},l=await k(e,i),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[y.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,ak&&(null==n?void 0:n.revalidate)===0&&!K.isDev&&!ar){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${aa}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:v.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},o=async({hasResolved:c,previousCacheEntry:f,isRevalidating:g,span:i})=>{let j,k=!1===K.isDev,l=c||b.writableEnded;if(ah&&ab&&!f&&!N)return(null==ac?void 0:ac.render404)?await ac.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(ai&&(j=(0,w.parseFallbackField)(ai.fallback)),j===w.FallbackMode.PRERENDER&&(0,u.isBot)(al)&&(!ar||an)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),(null==f?void 0:f.isStale)===-1&&(ah=!0),ah&&(j!==w.FallbackMode.NOT_FOUND||f)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),!N&&j!==w.FallbackMode.BLOCKING_STATIC_RENDER&&aB&&!l&&!_&&T&&(k||!aj)){let b;if((k||ai)&&j===w.FallbackMode.NOT_FOUND)throw new B.NoFallbackError;if(ar&&!ap){let c="string"==typeof(null==ai?void 0:ai.fallback)?ai.fallback:k?ag:null;if(b=await K.handleResponse({cacheKey:c,req:a,nextConfig:ad,routeKind:e.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:$,isRoutePPREnabled:ar,responseGenerator:async()=>m({span:i,postponed:void 0,fallbackRouteParams:k||at?(0,n.u)(ag):null}),waitUntil:d.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let o=ah||g||!au?void 0:au;if(as&&void 0!==o)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:v.CachedRouteKind.PAGES,html:x.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let p=T&&ar&&((0,h.getRequestMeta)(a,"renderFallbackShell")||at)?(0,n.u)(af):null;return m({span:i,postponed:o,fallbackRouteParams:p})},p=async c=>{var f,g,i,j,k;let l,n=await K.handleResponse({cacheKey:aA,responseGenerator:a=>o({span:c,...a}),routeKind:e.RouteKind.APP_PAGE,isOnDemandRevalidate:ah,isRoutePPREnabled:ar,req:a,nextConfig:ad,prerenderManifest:$,waitUntil:d.waitUntil});if(_&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),K.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!n){if(aA)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(f=n.value)?void 0:f.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(i=n.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof n.value.postponed;ak&&!av&&(!p||ao)&&(N||b.setHeader("x-nextjs-cache",ah?"REVALIDATED":n.isMiss?"MISS":n.isStale?"STALE":"HIT"),b.setHeader(t.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=n;if(au)l={revalidate:0,expire:void 0};else if(N&&ap&&!ao&&ar)l={revalidate:0,expire:void 0};else if(!K.isDev)if(_)l={revalidate:0,expire:void 0};else if(ak){if(n.cacheControl)if("number"==typeof n.cacheControl.revalidate){if(n.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${n.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});l={revalidate:n.cacheControl.revalidate,expire:(null==(j=n.cacheControl)?void 0:j.expire)??ad.expireTime}}else l={revalidate:y.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(l={revalidate:0,expire:void 0});if(n.cacheControl=l,"string"==typeof aw&&(null==q?void 0:q.kind)===v.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[y.NEXT_CACHE_TAGS_HEADER];N&&ak&&c&&"string"==typeof c&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(aw);return void 0!==d?(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(d,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl}):(b.statusCode=204,(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.EMPTY,cacheControl:n.cacheControl}))}let r=(0,h.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...n,value:{...n.value,kind:"PAGE"}},{url:(0,h.getRequestMeta)(a,"initURL")}))return null;if(p&&au)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(N&&ak||delete a[y.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[y.NEXT_CACHE_TAGS_HEADER];if(N&&ak&&s&&"string"==typeof s&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,s),!q.status||ap&&ar||(b.statusCode=q.status),!N&&q.status&&F.RedirectStatusCode[q.status]&&ap&&(b.statusCode=200),p&&b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"1"),ap&&!_){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:q.html,cacheControl:av?{revalidate:0,expire:void 0}:n.cacheControl})}return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(q.rscData,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl})}let u=q.html;if(!p||N||ap)return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:n.cacheControl});if(as)return u.push(new ReadableStream({start(a){a.enqueue(z.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}});let w=new TransformStream;return u.push(w.readable),m({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(w.writable)}).catch(a=>{w.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}})};if(!aF)return await aE.withPropagatedContext(a.headers,()=>aE.trace(i.BaseServerSpan.handleRequest,{spanName:`${aD} ${a.url}`,kind:g.SpanKind.SERVER,attributes:{"http.method":aD,"http.target":a.url}},p));await p(aF)}catch(b){throw b instanceof B.NoFallbackError||await K.onRequestError(a,b,{routerKind:"App Router",routePath:G,routeType:"render",revalidateReason:(0,f.c)({isRevalidate:ak,isOnDemandRevalidate:ah})},ac),b}}},51733:(a,b,c)=>{"use strict";c.a(a,async(a,d)=>{try{c.r(b),c.d(b,{default:()=>t});var e=c(78157),f=c(31768),g=c.n(f),h=c(71159),i=c(45283),j=c(93902),k=c(27727),l=c(89457),m=c(81318),n=c(80022),o=c(88148),p=c(9647),q=c(91255),r=c(27174),s=a([i]);i=(s.then?(await s)():s)[0];let u={CLEANING:"التنظيف",PLUMBING:"السباكة",ELECTRICAL:"الكهرباء","SLEEP KIT":"أدوات النوم","A/C":"التكييف",OFFICE:"المكتب","CAR MAINTENANCE":"صيانة السيارات",MAINTENANCE:"الصيانة العامة",KITCHEN:"المطبخ",BATHROOM:"الحمام",LAUNDRY:"الغسيل",SAFETY:"السلامة",TOOLS:"الأدوات",FURNITURE:"الأثاث",MEDICAL:"المستلزمات الطبية",FOOD:"المواد الغذائية",GARDEN:"الحديقة",PAINT:"الدهان",CONSTRUCTION:"البناء والإنشاء",HARDWARE:"الأجهزة",STATIONERY:"القرطاسية",TEXTILES:"المنسوجات",LIGHTING:"الإضاءة",SECURITY:"الأمن",COMMUNICATION:"الاتصالات",TRANSPORTATION:"النقل",STORAGE:"التخزين",DECORATION:"الديكور",UNCATEGORIZED:"غير مصنف",OTHERS:"أخرى",MISC:"متنوعة",GENERAL:"عام"};function t(){let a=(0,h.useRouter)(),b=(0,h.useSearchParams)(),{orders:c,loading:d,loadOrders:s,updateOrderStatus:t}=(0,i.h)(),{currentUser:v}=(0,r.k)(),[w,x]=(0,f.useState)(!1),[y,z]=(0,f.useState)(!1),A=b?.get("view")==="list"?"list":"grid",[B,C]=(0,f.useState)(A),D=a=>Array.isArray(a)?a:a&&"object"==typeof a?Object.values(a):[],{groupedItems:E,residenceNames:F,totalItems:G,totalCategories:H,pendingOrders:I}=(0,f.useMemo)(()=>{if(d||!v||"Admin"!==v.role)return{groupedItems:{},residenceNames:[],totalItems:0,totalCategories:0,pendingOrders:[]};let a=c.filter(a=>"Pending"===a.status),b=new Map,e=new Set;a.forEach(a=>{a?.residence&&e.add(a.residence),D(a.items)?.forEach(a=>{if(!a)return;let c=(a.nameAr||"").includes(" - ")?a.nameAr.split(" - ")[0]:a.nameAr||"",d=(a.nameEn||"").includes(" - ")?a.nameEn.split(" - ")[0]:a.nameEn||"",e=(a.category||"Uncategorized").trim(),f=`${c}-${d}-${e}`.toLowerCase(),g=b.get(f);g?g.totalQuantity+=a.quantity||0:b.set(f,{id:f,nameAr:c||"صنف بدون اسم",nameEn:d||"Unnamed Item",category:e,unit:a.unit||"",totalQuantity:a.quantity||0,selectedVariant:void 0,note:void 0})})});let f=Array.from(b.values()).sort((a,b)=>{let c=(a.nameAr||a.nameEn||"").toString(),d=(b.nameAr||b.nameEn||"").toString();return c.localeCompare(d,"ar")}),g=f.reduce((a,b)=>{let c=(b.category||"Uncategorized").trim();return a[c]||(a[c]=[]),a[c].push(b),a},{});return{groupedItems:Object.entries(g).sort(([,a],[,b])=>b.length-a.length).reduce((a,[b,c])=>(a[b]=c,a),{}),residenceNames:Array.from(e),totalItems:f.length,totalCategories:Object.keys(g).length,pendingOrders:a}},[c,d,v]),J=(0,f.useMemo)(()=>{let a=Object.entries(E||{}).map(([a,b])=>({category:a,items:b,itemCount:b.length}));if(0===a.length)return{layoutConfig:[],gridColumns:3,gridRows:1,totalItems:0,averageItems:0};a.sort((a,b)=>b.itemCount-a.itemCount);let b=Math.ceil(a.length/3),c=a.reduce((a,b)=>a+b.itemCount,0),d=c/a.length||0;return{layoutConfig:a.map(a=>{let b="normal",c=1;return a.itemCount>2.5*d?(b="extra-large",c=3):a.itemCount>1.8*d?(b="large",c=2):a.itemCount>1.3*d?(b="medium-large",c=1.5):a.itemCount<.7*d&&(b="small",c=.8),{...a,cardType:b,heightMultiplier:c,widthMultiplier:1,gridColumn:"span 1",gridRow:c>=3?"span 3":c>=2||c>=1.5?"span 2":"span 1"}}),gridColumns:3,gridRows:b,totalItems:c,averageItems:Math.round(d)}},[E]),K=a=>{if(!a)return"غير مصنف";let b=a.toUpperCase().trim();if(u[b])return u[b];for(let[a,c]of Object.entries(u))if(b.includes(a)||a.includes(b))return c;return a},L=async()=>{if(!v||!I.length)return;let b=`هل أنت متأكد من الموافقة على جميع الطلبات المعلقة؟

سيتم الموافقة على ${I.length} طلب.

Are you sure you want to approve all pending orders?

${I.length} orders will be approved.`;if(window.confirm(b)){z(!0);try{for(let a of I)await t(a.id,"Approved",v.id);a.push("/inventory/orders")}catch(a){console.error("Error in bulk approval:",a)}finally{z(!1)}}},M=a=>{if(!a||a.startsWith("MR-"))return a;let b=a.match(/^(\d{2})-(\d{2})-(\d{3})$/);return b?`MR-${b[1]}${b[2]}-${b[3]}`:a},N=a=>{let b=(a||"").trim();if(!b)return{base:"",detail:""};let c=[];if(b.includes(" - "))c=b.split(" - ");else if(b.includes(" | "))c=b.split(" | ");else{if(!b.includes(" / "))return{base:b,detail:""};c=b.split(" / ")}return c.length<=1?{base:b,detail:""}:{base:c[0].trim(),detail:c.slice(1).join(" - ").trim()}};return d?(0,e.jsxs)("div",{className:"space-y-6",children:[(0,e.jsx)(p.E,{className:"h-10 w-48"}),(0,e.jsxs)("div",{className:"border rounded-lg p-6",children:[(0,e.jsxs)("div",{className:"space-y-4",children:[(0,e.jsx)(p.E,{className:"h-8 w-64 mb-2"}),(0,e.jsx)(p.E,{className:"h-4 w-80"})]}),(0,e.jsxs)("div",{className:"mt-6 space-y-4",children:[(0,e.jsx)(p.E,{className:"h-10 w-full"}),(0,e.jsx)(p.E,{className:"h-10 w-full"}),(0,e.jsx)(p.E,{className:"h-10 w-full"})]})]})]}):v?.role!=="Admin"?(0,e.jsxs)("div",{className:"text-center py-10",children:[(0,e.jsx)("p",{className:"text-xl text-muted-foreground",children:"Access Denied."}),(0,e.jsxs)(j.$,{onClick:()=>a.back(),className:"mt-4",children:[(0,e.jsx)(k.A,{className:"mr-2 h-4 w-4"})," Go Back"]})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{dangerouslySetInnerHTML:{__html:`
                @page {
                    size: A4;
                    margin: 5mm;
                }
                
                @media print {
                    .no-print { 
                        display: none !important; 
                    }
                    
                    body { 
                        font-size: 10px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    .space-y-6 {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .bg-white {
                        margin: 0 !important;
                        padding: 8px !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }

                    /* Simplified grid layout for printing */
                    .elegant-grid {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 6px !important;
                        margin: 0 !important;
                    }

                    /* Ensure cards fit properly in 3-column layout */
                    .report-card {
                        display: block !important;
                        width: 100% !important;
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border-radius: 4px !important;
                        margin-bottom: 8px !important;
                    }

                    /* Keep header with the card */
                    .report-card-header {
                        break-after: avoid !important;
                        position: static !important;
                        box-shadow: none !important;
                        padding: 4px 6px !important;
                        font-size: 9px !important;
                        min-height: 32px !important;
                    }

                    /* Ensure full item list prints */
                    .report-card-body {
                        max-height: none !important;
                        overflow: visible !important;
                        padding: 4px !important;
                    }

                    /* Avoid breaking inside a single row */
                    .row-item {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        padding: 3px 4px !important;
                        margin-bottom: 2px !important;
                        font-size: 8px !important;
                    }
                    
                    /* Typography adjustments for print */
                    div[style*="fontSize: '20px'"] {
                        font-size: 12px !important;
                    }
                    
                    div[style*="fontSize: '16px'"] {
                        font-size: 10px !important;
                    }
                    
                    div[style*="fontSize: '14px'"] {
                        font-size: 9px !important;
                    }
                    
                    div[style*="fontSize: '13px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '12px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '11px'"] {
                        font-size: 7px !important;
                    }
                    
                    /* Spacing adjustments */
                    div[style*="marginBottom: '20px'"] {
                        margin-bottom: 8px !important;
                    }
                    
                    div[style*="padding: '15px 20px'"] {
                        padding: 6px 10px !important;
                    }
                    
                    div[style*="padding: '8px 12px'"] {
                        padding: 4px 6px !important;
                    }
                    
                    div[style*="gap: '12px'"] {
                        gap: 4px !important;
                    }
                    
                    div[style*="gap: '30px'"] {
                        gap: 10px !important;
                    }
                    
                    /* Remove height restrictions */
                    div[style*="maxHeight"] {
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    
                    /* Header adjustments */
                    div[style*="marginBottom: '1px'"] {
                        margin-bottom: 0px !important;
                    }
                    
                    div[style*="padding: '4px 8px'"] {
                        padding: 2px 4px !important;
                    }
                    
                    /* Footer and signatures */
                    div[style*="marginTop: '25px'"] {
                        margin-top: 15px !important;
                        padding-top: 8px !important;
                        border-top: 1px solid #000 !important;
                    }
                    
                    div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 15px !important;
                    }
                    
                    div[style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 80px !important;
                    }
                    
                    div[style*="fontSize: '11px'"][style*="fontWeight: 'bold'"] {
                        font-size: 8px !important;
                        font-weight: bold !important;
                    }
                    
                    div[style*="fontSize: '9px'"][style*="color: '#6c757d'"] {
                        font-size: 7px !important;
                    }
                    
                    /* Signature text */
                    div[style*="طلب من"], 
                    div[style*="موافق من"], 
                    div[style*="تم الاستلام"],
                    div[style*="Requested By"],
                    div[style*="Approved By"],
                    div[style*="Received By"] {
                        font-size: 8px !important;
                        font-weight: bold !important;
                        color: #000 !important;
                    }
                    
                    div[style*="width: '100px'"][style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 60px !important;
                        margin: 5px auto !important;
                    }
                    }

                    /* List View (Table) Print Styles */
                    .print-compact-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    
                    .print-compact-table thead th {
                        font-weight: 800 !important;
                        font-size: 10px !important;
                        padding: 4px 6px !important;
                        background: ##dadada !important;
                        border-bottom: 1px solid #9ca3af !important;
                        color: #000 !important;
                        white-space: nowrap !important;
                    }
                    
                    .print-compact-table tbody td {
                        font-size: 12px !important;
                        padding: 2px 6px !important; /* tighter rows */
                        line-height: 1.2 !important;  /* reduce vertical height */
                        border-top: 1px solid #d1d5db !important;
                        vertical-align: middle !important;
                        color: #000 !important;
                    }
                    
                    .print-compact-table tbody td:first-child {
                        font-weight: 700 !important;
                        color: #000 !important;
                    }
                    
                    .print-compact-table .category-row td {
                        padding-top: 2px !important;
                        padding-bottom: 2px !important; /* tighter category row */
                        background: #f3f4f6 !important;
                        color: #000 !important;
                        font-weight: 800 !important;
                        font-size: 11px !important;
                        border-top: 1px solid #9ca3af !important;
                        border-bottom: 1px solid #9ca3af !important;
                    }

                    /* Individual Orders Print Styles */
                    .individual-order-page {
                        break-before: page !important;
                        page-break-before: always !important;
                    }
                    
                    .order-header {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                    }
                    
                    .residence-header {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                        margin-bottom: 15px !important;
                    }

                    /* Notes bidi handling for individual orders */
                    .notes-cell { 
                        direction: rtl !important; 
                        text-align: left !important; 
                        unicode-bidi: isolate !important; 
                    }
                    
                    .notes-cell .bidi-notes { 
                        direction: rtl !important; 
                        unicode-bidi: plaintext !important; 
                    }
                    
                    .print-notes {
                        max-width: 220px !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                        color: #111 !important;
                        direction: rtl !important;
                        text-align: left !important;
                        unicode-bidi: isolate !important;
                    }

                    /* iPhone-style toggle switch animations */
                    .toggle-switch {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                    
                    .toggle-switch:hover {
                        transform: scale(1.05) !important;
                    }
                    
                    .toggle-switch:active {
                        transform: scale(0.95) !important;
                    }
                }
                
                /* Web view responsive adjustments */
                @media screen and (max-width: 1200px) {
                    .elegant-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }
                
                @media screen and (max-width: 1024px) {
                    .elegant-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 12px !important;
                    }
                }
                
                @media screen and (max-width: 768px) {
                    .elegant-grid {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }
                    
                    .bg-white {
                        padding: 12px !important;
                        font-size: 12px !important;
                    }
                }
                `}}),(0,e.jsxs)("div",{className:"space-y-6",children:[(0,e.jsxs)("div",{className:"flex items-center justify-between no-print mb-6",children:[(0,e.jsxs)(j.$,{variant:"outline",onClick:()=>a.back(),children:[(0,e.jsx)(k.A,{className:"mr-2 h-4 w-4"}),"Back to Requests"]}),(0,e.jsxs)("div",{className:"flex items-center gap-2",children:[I.length>0&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(j.$,{variant:"outline",onClick:()=>x(!w),title:"إضافة/إزالة الطلبات الفردية مع التقرير المجمع",children:[(0,e.jsx)(l.A,{className:"mr-2 h-4 w-4"}),w?"إخفاء الطلبات الفردية":"إظهار الطلبات الفردية"]}),(0,e.jsx)(j.$,{variant:"default",onClick:L,disabled:y,title:"الموافقة على جميع الطلبات المعلقة دفعة واحدة",children:y?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(m.A,{className:"mr-2 h-4 w-4 animate-spin"})," جاري الموافقة..."]}):(0,e.jsxs)(e.Fragment,{children:["موافقة جماعية (",I.length,")"]})})]}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[(0,e.jsx)("span",{style:{fontSize:"12px",fontWeight:"500",color:"grid"===B?"#007bff":"#6c757d"},children:"شبكي"}),(0,e.jsx)("div",{onClick:()=>{let a="grid"===B?"list":"grid";C(a);let b=new URL(window.location.href);"list"===a?b.searchParams.set("view","list"):b.searchParams.delete("view"),window.history.pushState({},"",b.toString())},className:"toggle-switch",style:{width:"48px",height:"24px",backgroundColor:"list"===B?"#007bff":"#e9ecef",borderRadius:"12px",position:"relative",cursor:"pointer",transition:"all 0.3s ease",border:"2px solid transparent",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.2)"},title:"التبديل بين العرض الشبكي والعرض العادي",children:(0,e.jsx)("div",{style:{width:"18px",height:"18px",backgroundColor:"#ffffff",borderRadius:"50%",position:"absolute",top:"1px",left:"list"===B?"27px":"1px",transition:"all 0.3s ease",boxShadow:"0 2px 4px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center"},children:"grid"===B?(0,e.jsx)(l.A,{style:{width:"10px",height:"10px",color:"#007bff"}}):(0,e.jsx)(n.A,{style:{width:"10px",height:"10px",color:"#007bff"}})})}),(0,e.jsx)("span",{style:{fontSize:"12px",fontWeight:"500",color:"list"===B?"#007bff":"#6c757d"},children:"عادي"})]}),(0,e.jsxs)(j.$,{onClick:()=>{window.print()},title:`طباعة التقرير ${"grid"===B?"الشبكي":"العادي"}`,children:[(0,e.jsx)(o.A,{className:"mr-2 h-4 w-4"}),"طباعة"]})]})]}),(0,e.jsxs)("div",{className:"bg-white p-6 rounded-lg border shadow-sm",style:{fontFamily:"Arial, sans-serif",fontSize:"14px",lineHeight:"1.4"},children:[(0,e.jsx)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",padding:"12px 16px",border:"2px solid #000",borderRadius:"8px",background:"#f8f9fa"},children:(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",width:"100%"},children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"15px"},children:[(0,e.jsx)("div",{style:{flex:1},children:(0,e.jsx)("div",{style:{fontSize:"18px",fontWeight:"bold",color:"#000",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"},children:"Consolidated Pending Requests"})}),(0,e.jsx)("div",{style:{textAlign:"right"},children:(0,e.jsx)("div",{style:{fontSize:"16px",fontWeight:"bold",color:"#007bff",backgroundColor:"#fff3cd",padding:"6px 12px",borderRadius:"4px",border:"1px solid #ffeeba",whiteSpace:"nowrap"},children:(0,q.GP)(new Date,"MMM do, yyyy")})})]}),F.length>0&&(0,e.jsx)("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center",alignItems:"center",width:"100%"},children:F.map(a=>{let b=I.filter(b=>b.residence===a);return(0,e.jsxs)("div",{style:{background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:"4px",padding:"4px 6px",textAlign:"center",minWidth:"70px",maxWidth:"120px",display:"flex",flexDirection:"column",justifyContent:"center"},children:[(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:"bold",color:"#1976d2",lineHeight:"1.2",marginBottom:"2px"},children:a}),(0,e.jsx)("div",{style:{fontSize:"8px",color:"#000",lineHeight:"1.1"},children:b.map(a=>M(a.id)).join(", ")})]},a)})})]})}),(0,e.jsx)("div",{style:{padding:"0"},children:J.layoutConfig.length>0?"grid"===B?(0,e.jsx)("div",{style:{display:"grid",gridTemplateColumns:`repeat(${J.gridColumns}, 1fr)`,gap:"16px",marginBottom:"20px",gridAutoRows:"minmax(200px, auto)"},className:"elegant-grid",children:J.layoutConfig.map(a=>(0,e.jsxs)("div",{className:"report-card",style:{border:"1px solid #dee2e6",borderRadius:"12px",overflow:"hidden",backgroundColor:"white",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",gridColumn:a.gridColumn,gridRow:a.gridRow,transition:"all 0.2s ease"},children:[(0,e.jsxs)("div",{className:"report-card-header",style:{background:"#f8f9fa",borderBottom:"2px solid #dee2e6",color:"#495057",padding:"10px 15px",fontSize:"11px",fontWeight:"600",textAlign:"center",letterSpacing:"0.2px",display:"flex",justifyContent:"space-between",alignItems:"center",minHeight:"40px"},children:[(0,e.jsxs)("div",{style:{flex:1,display:"flex",alignItems:"center",gap:"8px"},children:[(0,e.jsx)("div",{style:{fontSize:"13px",fontWeight:"600",color:"#4a5568",direction:"ltr"},children:a.category}),(0,e.jsx)("div",{style:{fontSize:"12px",fontWeight:"600",color:"#4a5568",direction:"rtl"},children:K(a.category)})]}),(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:"600",backgroundColor:"rgba(255,255,255,0.25)",padding:"4px 8px",borderRadius:"12px",minWidth:"35px",textAlign:"center",border:"1px solid rgba(255,255,255,0.2)"},children:a.itemCount})]}),(0,e.jsx)("div",{className:"report-card-body",style:{padding:"6px",maxHeight:"extra-large"===a.cardType?"500px":"large"===a.cardType?"400px":"medium-large"===a.cardType?"300px":"250px",overflowY:"auto"},children:a.items.map((b,c)=>(0,e.jsxs)("div",{className:"row-item",style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",marginBottom:c===a.items.length-1?"0":"3px",backgroundColor:c%2==0?"#f8f9fa":"white",borderRadius:"4px",border:"1px solid #f1f3f4"},children:[(0,e.jsx)("div",{style:{flex:1,marginRight:"10px",display:"flex",alignItems:"center",justifyContent:"space-between"},children:(0,e.jsxs)("div",{style:{flex:1,marginRight:"8px"},children:[(0,e.jsx)("div",{style:{fontSize:"12px",fontWeight:"600",color:"#2c3e50",lineHeight:"1.3",marginBottom:"2px"},children:N(b.nameAr).base||b.nameAr}),(0,e.jsx)("div",{style:{fontSize:"12px",color:"#7f8c8d",lineHeight:"1.2"},children:N(b.nameEn).base||b.nameEn})]})}),(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",minWidth:"45px"},children:[(0,e.jsx)("div",{style:{fontSize:"12px",fontWeight:"bold",color:"#2980b9"},children:b.totalQuantity}),(0,e.jsx)("div",{style:{fontSize:"12px",color:"#95a5a6",textAlign:"center"},children:b.unit})]})]},b.id))})]},a.category))}):(0,e.jsx)("div",{style:{marginBottom:"25px",boxShadow:"0 4px 6px rgba(0, 0, 0, 0.07)",borderRadius:"12px",overflow:"hidden",border:"1px solid #e2e8f0"},children:(0,e.jsxs)("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:"14px",backgroundColor:"#ffffff"},className:"print-compact-table",children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{style:{background:"#f8f9fa",color:"#212529",borderBottom:"2px solid #dee2e6"},children:[(0,e.jsx)("th",{style:{fontWeight:"600",fontSize:"14px",padding:"16px 20px",textAlign:"left",width:"55%",letterSpacing:"0.5px",textTransform:"uppercase"},children:"Item"}),(0,e.jsx)("th",{style:{fontWeight:"600",fontSize:"14px",padding:"16px 20px",textAlign:"center",width:"20%",letterSpacing:"0.5px",textTransform:"uppercase"},children:"Unit"}),(0,e.jsx)("th",{style:{fontWeight:"600",fontSize:"14px",padding:"16px 20px",textAlign:"center",width:"25%",letterSpacing:"0.5px",textTransform:"uppercase"},children:"Total Qty"})]})}),(0,e.jsx)("tbody",{children:J.layoutConfig.map(a=>(0,e.jsxs)(g().Fragment,{children:[(0,e.jsx)("tr",{className:"category-row",style:{background:"#f8f9fa",borderLeft:"4px solid #667eea"},children:(0,e.jsx)("td",{colSpan:3,style:{padding:"8px 14px",color:"#495057",fontWeight:"700",textTransform:"capitalize",fontSize:"13px",borderBottom:"2px solid #dee2e6",position:"relative"},children:(0,e.jsx)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:(0,e.jsxs)("span",{style:{fontSize:"14px",fontWeight:"700"},children:[K(a.category)," • ",a.category]})})})}),a.items.map(a=>(0,e.jsxs)("tr",{style:{transition:"all 0.2s ease"},children:[(0,e.jsx)("td",{style:{padding:"8px 16px",borderBottom:"1px solid #f1f5f9",fontWeight:"500",fontSize:"12px",color:"#2d3748",lineHeight:"1.35"},children:(0,e.jsx)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:(0,e.jsx)("div",{children:(()=>{let b=N(a.nameAr),c=N(a.nameEn);return`${c.base||a.nameEn} | ${b.base||a.nameAr}`})()})})}),(0,e.jsx)("td",{style:{padding:"8px 16px",borderBottom:"1px solid #f1f5f9",textAlign:"center",fontSize:"12px",color:"#4a5568",fontWeight:"500"},children:(0,e.jsx)("span",{style:{backgroundColor:"#e2e8f0",padding:"3px 6px",borderRadius:"6px",fontSize:"11px",fontWeight:"600",color:"#2d3748"},children:a.unit})}),(0,e.jsx)("td",{style:{padding:"8px 16px",borderBottom:"1px solid #f1f5f9",textAlign:"center",fontWeight:"bold",fontSize:"12px"},children:(0,e.jsx)("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",backgroundColor:"#f8f9fa",color:"#212529",padding:"4px 8px",border:"1px solid #dee2e6",borderRadius:"4px",fontWeight:"700",minWidth:"44px"},children:a.totalQuantity})})]},a.id))]},a.category))})]})}):(0,e.jsx)("div",{style:{textAlign:"center",padding:"60px 20px",color:"#6c757d",fontSize:"16px",fontWeight:"500"},children:"No pending material requests found."})}),(0,e.jsx)("div",{style:{marginTop:"25px",borderTop:"2px solid #000",paddingTop:"15px"},children:(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"30px"},children:[(0,e.jsxs)("div",{style:{textAlign:"center",border:"1px solid #dee2e6",borderRadius:"6px",padding:"10px 8px",backgroundColor:"#f8f9fa"},children:[(0,e.jsx)("div",{style:{fontSize:"11px",fontWeight:"bold",marginBottom:"20px",color:"#495057"},children:"Requested By"}),(0,e.jsx)("div",{style:{borderTop:"2px solid #000",width:"100px",margin:"0 auto 10px auto"}}),(0,e.jsx)("div",{style:{fontSize:"9px",color:"#6c757d"}})]}),(0,e.jsxs)("div",{style:{textAlign:"center",border:"1px solid #dee2e6",borderRadius:"6px",padding:"10px 8px",backgroundColor:"#f8f9fa"},children:[(0,e.jsx)("div",{style:{fontSize:"11px",fontWeight:"bold",marginBottom:"20px",color:"#495057"},children:"Approved By"}),(0,e.jsx)("div",{style:{borderTop:"2px solid #000",width:"100px",margin:"0 auto 10px auto"}}),(0,e.jsx)("div",{style:{fontSize:"9px",color:"#6c757d"}})]}),(0,e.jsxs)("div",{style:{textAlign:"center",border:"1px solid #dee2e6",borderRadius:"6px",padding:"10px 8px",backgroundColor:"#f8f9fa"},children:[(0,e.jsx)("div",{style:{fontSize:"11px",fontWeight:"bold",marginBottom:"20px",color:"#495057"},children:"Received By"}),(0,e.jsx)("div",{style:{borderTop:"2px solid #000",width:"100px",margin:"0 auto 10px auto"}}),(0,e.jsx)("div",{style:{fontSize:"9px",color:"#6c757d"}})]})]})})]}),w&&I.length>0&&(0,e.jsx)("div",{style:{pageBreakBefore:"always"},children:F.map((a,b)=>{let c=I.filter(b=>b.residence===a);return 0===c.length?null:(0,e.jsxs)("div",{style:{pageBreakBefore:b>0?"always":"auto",marginBottom:"40px"},children:[(0,e.jsxs)("div",{style:{fontSize:"18px",fontWeight:"bold",textAlign:"center",marginBottom:"20px",padding:"15px",backgroundColor:"#f8f9fa",border:"2px solid #dee2e6",borderRadius:"8px"},children:["Material Requests for ",a,(0,e.jsx)("br",{}),(0,e.jsxs)("span",{style:{fontSize:"14px",color:"#666"},children:["طلبات المواد لسكن ",a]})]}),c.map((a,b)=>{let c=D(a.items).reduce((a,b)=>{let c=b.category||"Uncategorized";return a[c]||(a[c]=[]),a[c].push(b),a},{});return(0,e.jsxs)("div",{style:{marginBottom:"30px",pageBreakInside:"avoid",border:"1px solid #dee2e6",borderRadius:"8px",backgroundColor:"white"},children:[(0,e.jsx)("div",{style:{borderBottom:"2px solid #000",padding:"15px 20px"},children:(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"22px",fontWeight:"800",marginBottom:"2px",color:"#000"},children:"Materials Request"}),(0,e.jsxs)("div",{style:{fontSize:"16px",fontWeight:"700",color:"#1f2937"},children:["ID: #",M(a.id)]})]}),(0,e.jsxs)("div",{style:{textAlign:"right"},children:[(0,e.jsx)("div",{style:{fontSize:"22px",fontWeight:"800",marginBottom:"4px"},children:a.residence}),(0,e.jsx)("div",{style:{fontSize:"14px",color:"#1f2937"},children:(0,q.GP)(a.date.toDate(),"PPP")})]})]})}),(0,e.jsxs)("div",{style:{padding:"20px"},children:[(0,e.jsxs)("table",{style:{width:"100%",borderCollapse:"collapse"},className:"print-compact-table",children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{style:{fontWeight:"700",fontSize:"10px",padding:"4px 6px",background:"#f2f3f5",borderBottom:"1px solid #e2e8f0",color:"#111",textAlign:"left"},children:"Item Name"}),(0,e.jsx)("th",{style:{fontWeight:"700",fontSize:"10px",padding:"4px 6px",background:"#f2f3f5",borderBottom:"1px solid #e2e8f0",color:"#111",textAlign:"left",width:"220px"},children:"Notes"}),(0,e.jsx)("th",{style:{fontWeight:"700",fontSize:"10px",padding:"4px 6px",background:"#f2f3f5",borderBottom:"1px solid #e2e8f0",color:"#111",textAlign:"center"},children:"Unit"}),(0,e.jsx)("th",{style:{fontWeight:"700",fontSize:"10px",padding:"4px 6px",background:"#f2f3f5",borderBottom:"1px solid #e2e8f0",color:"#111",textAlign:"right"},children:"Qty"}),(0,e.jsx)("th",{style:{fontWeight:"700",fontSize:"10px",padding:"4px 6px",background:"#f2f3f5",borderBottom:"1px solid #e2e8f0",color:"#111",textAlign:"center"},children:"Stock"})]})}),(0,e.jsx)("tbody",{children:Object.entries(c).map(([a,b])=>(0,e.jsxs)(g().Fragment,{children:[(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:5,style:{fontWeight:"700",color:"#0f766e",backgroundColor:"#fafafa",padding:"4px 6px",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0",textTransform:"capitalize"},children:a})}),b.map(a=>{let b=N(a.nameAr),c=N(a.nameEn),d=b.detail||c.detail||"",f=(()=>{let b=(a.notes||"").trim();return d&&b?`${b}  ${d}`:d||b||"-"})();return(0,e.jsxs)("tr",{children:[(0,e.jsxs)("td",{style:{fontSize:"10px",padding:"3px 6px",borderTop:"1px solid #f1f5f9",fontWeight:"500"},children:[c.base||a.nameEn," | ",b.base||a.nameAr]}),(0,e.jsx)("td",{style:{fontSize:"10px",padding:"3px 6px",borderTop:"1px solid #f1f5f9",direction:"rtl",textAlign:"left",maxWidth:"220px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},className:"notes-cell print-notes",children:(0,e.jsx)("span",{className:"bidi-notes",children:f})}),(0,e.jsx)("td",{style:{fontSize:"10px",padding:"3px 6px",borderTop:"1px solid #f1f5f9",textAlign:"center"},children:a.unit}),(0,e.jsx)("td",{style:{fontSize:"10px",padding:"3px 6px",borderTop:"1px solid #f1f5f9",textAlign:"right",fontWeight:"bold"},children:a.quantity}),(0,e.jsx)("td",{style:{fontSize:"10px",padding:"3px 6px",borderTop:"1px solid #f1f5f9",textAlign:"center"},children:"-"})]},a.id)})]},a))})]}),(0,e.jsxs)("div",{style:{marginTop:"6px",paddingTop:"4px",borderTop:"1px solid #e5e7eb",textAlign:"right",fontWeight:"bold",fontSize:"11px",paddingRight:"4px"},children:["Total Items: ",a.items.length]})]}),(0,e.jsx)("div",{style:{marginTop:"8px",paddingTop:"4px",borderTop:"1px solid #e5e7eb",padding:"10px 20px"},children:(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"8px"},children:[(0,e.jsxs)("div",{style:{textAlign:"center"},children:[(0,e.jsx)("div",{style:{fontSize:"10px",color:"#6c757d",marginBottom:"20px"},children:"Requested By:"}),(0,e.jsx)("div",{style:{borderTop:"2px solid #000",width:"120px",margin:"0 auto 10px auto"}})]}),(0,e.jsxs)("div",{style:{textAlign:"center"},children:[(0,e.jsx)("div",{style:{fontSize:"10px",color:"#6c757d",marginBottom:"20px"},children:"Approved By:"}),(0,e.jsx)("div",{style:{borderTop:"2px solid #000",width:"120px",margin:"0 auto 10px auto"}})]})]})})]},a.id)})]},a)})})]})]})}d()}catch(a){d(a)}})},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66551:a=>{"use strict";a.exports=import("firebase/app")},79535:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>d});let d=(0,c(25459).registerClientReference)(function(){throw Error("Attempted to call the default export of \"D:\\\\EstateCare\\\\studio\\\\apps\\\\materials\\\\src\\\\app\\\\inventory\\\\orders\\\\consolidated-report\\\\page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"D:\\EstateCare\\studio\\apps\\materials\\src\\app\\inventory\\orders\\consolidated-report\\page.tsx","default")},80022:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(87463).A)("List",[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]])},81318:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(87463).A)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},82537:a=>{"use strict";a.exports=import("firebase/storage")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},87431:(a,b,c)=>{Promise.resolve().then(c.bind(c,51733))},88148:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(87463).A)("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]])},89457:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(87463).A)("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]])}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[8819,1386,1255,9925],()=>b(b.s=48652));module.exports=c})();