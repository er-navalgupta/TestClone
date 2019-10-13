import * as http from "http";
import * as url from 'url';
import { Controller } from "../abstracts";
import { __ContentType, __AppName, __Cookie, __SetCookie } from "../constant";
import { Global } from "../global";
import { parseCookie, parseAndMatchRoute, promise } from "../helpers";
import { CookieManager, FileManager } from "../models";
import { GenericSessionProvider, GenericGuard } from "../generics";
import { RouteMatch, HttpRequest, HttpResponse } from "../types";
import { HTTP_METHOD } from "../enums";
import { PostHandler } from "./post_handler";
import { InjectorHandler } from "./injector_handler";


export class RequestHandler extends PostHandler {

    private session_: GenericSessionProvider;
    private query_: any;
    private data_ = {};
    private routeMatchInfo_: RouteMatch;


    constructor(request: http.IncomingMessage, response: http.ServerResponse) {
        super();
        this.request = request;
        this.response = response;
        this.registerEvents_();
    }

    private registerEvents_() {
        this.request.on('error', this.onBadRequest.bind(this));
        this.response.on('error', this.onErrorOccured.bind(this));
    }

    private executeWallIncoming_(): Promise<boolean> {
        return promise((res) => {
            let index = 0;
            const wallLength = Global.walls.length;
            const executeWallIncomingByIndex = async () => {
                if (wallLength > index) {
                    const wall = Global.walls[index++];
                    const constructorArgsValues = InjectorHandler.getConstructorValues(wall.name);
                    const wallObj = new wall(...constructorArgsValues);
                    wallObj.cookie = this.cookieManager;
                    wallObj.session = this.session_;
                    wallObj.request = this.request as HttpRequest;
                    wallObj.response = this.response as HttpResponse;
                    wallObj.data = this.data_;
                    wallObj.query = this.query_;
                    this.wallInstances.push(wallObj);
                    const methodArgsValues = InjectorHandler.getMethodValues(wall.name, 'onIncoming');
                    try {
                        const result = await wallObj.onIncoming(...methodArgsValues);
                        if (result == null) {
                            executeWallIncomingByIndex();
                        }
                        else {
                            res(false);
                            this.onTerminationFromWall(result);
                        }
                    } catch (ex) {
                        this.onErrorOccured(ex);
                        res(false);
                    }
                }
                else {
                    res(true);
                }
            };
            executeWallIncomingByIndex();
        });
    }

    private runController_() {
        const constructorValues = InjectorHandler.getConstructorValues(this.routeMatchInfo_.controller.name);
        const controllerObj: Controller = new this.routeMatchInfo_.controller(...constructorValues);
        controllerObj.request = this.request as HttpRequest;
        controllerObj.response = this.response;
        controllerObj.query = this.query_;
        controllerObj.body = this.body;
        controllerObj.session = this.session_;
        controllerObj.cookie = this.cookieManager;
        controllerObj.param = this.routeMatchInfo_.params;
        controllerObj.data = this.data_;
        controllerObj.file = this.file;
        const methodArgsValues = InjectorHandler.getMethodValues(this.routeMatchInfo_.controller.name, this.routeMatchInfo_.workerInfo.workerName);
        controllerObj[this.routeMatchInfo_.workerInfo.workerName](...methodArgsValues).then(
            this.onResultFromController.bind(this)
        ).catch(this.onErrorOccured.bind(this));
    }

    private executeShieldsProtection_(): Promise<boolean> {
        return promise((res) => {
            let index = 0;
            const shieldLength = this.routeMatchInfo_.shields.length;
            const executeShieldByIndex = async () => {
                if (shieldLength > index) {
                    const shield = this.routeMatchInfo_.shields[index++];
                    const constructorArgsValues = InjectorHandler.getConstructorValues(shield.name);
                    const shieldObj = new shield(...constructorArgsValues);
                    shieldObj.cookie = this.cookieManager;
                    shieldObj.query = this.query_;
                    shieldObj.session = this.session_;
                    shieldObj.request = this.request as HttpRequest;
                    shieldObj.response = this.response as HttpResponse;
                    shieldObj.data = this.data_;
                    shieldObj.workerName = this.routeMatchInfo_.workerInfo.workerName;
                    const methodArgsValues = InjectorHandler.getMethodValues(shield.name, 'protect');

                    try {
                        const result = await shieldObj.protect(...methodArgsValues);
                        if (result == null) {
                            executeShieldByIndex();
                        }
                        else {
                            res(false);
                            this.onResultFromController(result);
                        }
                    } catch (ex) {
                        this.onErrorOccured(ex);
                        res(false);
                    }
                }
                else {
                    res(true);
                }
            };
            executeShieldByIndex();
        });
    }

    private executeGuardsCheck_(guards: Array<typeof GenericGuard>): Promise<boolean> {
        return promise((res) => {
            let index = 0;
            const shieldLength = guards.length;
            const executeGuardByIndex = async () => {
                if (shieldLength > index) {
                    const guard = guards[index++];
                    const constructorArgsValues = InjectorHandler.getConstructorValues(guard.name);
                    const guardObj = new guard(...constructorArgsValues);
                    guardObj.body = this.body;
                    guardObj.cookie = this.cookieManager;
                    guardObj.query = this.query_;
                    guardObj.session = this.session_;
                    guardObj.request = this.request as HttpRequest;
                    guardObj.response = this.response as HttpResponse;
                    guardObj.data = this.data_;
                    guardObj.file = this.file;
                    guardObj.param = this.routeMatchInfo_.params;
                    const methodArgsValues = InjectorHandler.getMethodValues(guard.name, 'check');
                    try {
                        const result = await guardObj.check(...methodArgsValues);
                        if (result == null) {
                            executeGuardByIndex();
                        }
                        else {
                            res(false);
                            this.onResultFromController(result);
                        }
                    } catch (ex) {
                        this.onErrorOccured(ex);
                        res(false);
                    }
                }
                else {
                    res(true);
                }
            };
            executeGuardByIndex();
        });
    }

    private parseCookieFromRequest_() {
        if (Global.shouldParseCookie === true) {
            const rawCookie = (this.request.headers[__Cookie] || this.request.headers["cookie"]) as string;
            let parsedCookies;
            try {
                parsedCookies = parseCookie(rawCookie);
            } catch (ex) {
                this.onErrorOccured(ex);
                return false;
            }
            this.session_ = new Global.sessionProvider();
            this.session_.cookie = this.cookieManager = new CookieManager(parsedCookies);
            this.session_.sessionId = parsedCookies[Global.appSessionIdentifier];
        }
        else {
            this.cookieManager = new CookieManager({});
        }
        return true;
    }

    private setPreHeader_() {
        this.response.setHeader('X-Powered-By', Global.appName);
        this.response.setHeader('Vary', 'Accept-Encoding');
        this.response.sendDate = true;
    }

    private async onRouteMatched_() {
        const actionInfo = this.routeMatchInfo_.workerInfo;
        if (actionInfo == null) {
            if (this.request.method === HTTP_METHOD.Options) {
                this.onRequestOptions(this.routeMatchInfo_.allowedHttpMethod);
            }
            else {
                this.onMethodNotAllowed(this.routeMatchInfo_.allowedHttpMethod);
            }
        }
        else {
            let shouldExecuteNextComponent = await this.executeShieldsProtection_();
            if (shouldExecuteNextComponent === true) {
                shouldExecuteNextComponent = await this.handlePostData();
                if (shouldExecuteNextComponent === true) {
                    shouldExecuteNextComponent = await this.executeGuardsCheck_(actionInfo.guards);
                    if (shouldExecuteNextComponent === true) {
                        this.runController_();
                    }
                }
            }
        }
    }

    private async execute_() {
        const urlDetail = url.parse(this.request.url, true);
        this.query_ = urlDetail.query;
        let shouldExecuteNextProcess = this.parseCookieFromRequest_();
        if (shouldExecuteNextProcess === true) {
            shouldExecuteNextProcess = await this.executeWallIncoming_();
            if (shouldExecuteNextProcess === true) {
                const pathUrl = urlDetail.pathname;
                const requestMethod = this.request.method as HTTP_METHOD;
                try {
                    this.routeMatchInfo_ = parseAndMatchRoute(pathUrl.toLowerCase(), requestMethod);
                }
                catch (ex) {
                    this.onErrorOccured(ex);
                    return;
                }
                if (this.routeMatchInfo_ == null) { // no route matched
                    // it may be a file or folder then
                    this.handleFileRequest(pathUrl);
                }
                else {
                    this.onRouteMatched_();
                }
            }
        }
    }

    async handlePostData() {
        if (this.request.method === HTTP_METHOD.Get) {
            this.body = {};
            this.file = new FileManager({});
        }
        else if (Global.shouldParsePost === true) {
            try {
                this.body = await this.parsePostData();
            } catch (ex) {
                this.onBadRequest(ex);
                return false;
            }
        }
        return true;
    }

    async handle() {
        this.setPreHeader_();
        this.execute_();
    }
}