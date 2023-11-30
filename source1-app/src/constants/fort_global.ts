import { ErrorHandler, Logger } from "../models";
import { ViewEngine, ComponentOption } from "../abstracts";
import { TErrorHandler, TGuard, TSessionStore, TShield, TTaskScheduler, TWall, TXmlParser } from "../types";
import { MustacheViewEngine, DtoValidator } from "../extra";
import { APP_NAME, CURRENT_PATH } from "./index";
import { ETAG_TYPE } from "../enums";
import { ICron, IDtoValidator, IEtagOption, IFolderMap } from "../interfaces";
import { CookieEvaluatorWall, MemorySessionStore, BlankXmlParser, PostDataEvaluatorGuard } from "../providers";
import { RouteHandler } from "../handlers";
import { CronJobManager } from "../utils";
import { DefaultCronJobScheduler } from "../providers/cron_job_scheduler";

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === "production";

export class FortGlobal {
    port = 4000;
    viewPath;
    shouldParseCookie = true;
    shouldParseBody = true;
    sessionStore: TSessionStore;
    sessionTimeOut = 60;
    viewEngine: ViewEngine;
    walls: TWall[] = [];
    errorHandler: TErrorHandler;
    cronJobScheduler: TTaskScheduler = DefaultCronJobScheduler;
    cronJobManager = new CronJobManager();
    keepAliveTimeout = 30000;
    private shields: TShield[] = [];
    private guards: TGuard[] = [];

    addGuards(guards: TGuard[]) {
        this.guards = guards;
    }

    addShields(shields: TShield[]) {
        this.shields = shields;
    }

    appName: string;

    eTag: IEtagOption;

    folders: IFolderMap[] = [];
    appSessionIdentifier: string;
    xmlParser: TXmlParser;

    logger: Logger;

    validator: IDtoValidator;
    crons: ICron[];

    get isDevelopment() {
        return isDevelopment;
    }

    get isProduction() {
        return isProduction;
    }

    componentOption = new ComponentOption();

    setDefault() {

        this.viewPath = this.viewPath || CURRENT_PATH;
        this.logger = this.logger || new Logger();

        this.sessionStore = this.sessionStore || MemorySessionStore;
        this.xmlParser = this.xmlParser || BlankXmlParser;
        this.viewEngine = this.viewEngine || new MustacheViewEngine();
        this.appName = this.appName || APP_NAME;

        if (this.eTag == null) {
            this.eTag = {
                type: ETAG_TYPE.Weak
            } as IEtagOption;
        }
        this.errorHandler = this.errorHandler || ErrorHandler;
        this.validator = this.validator || new DtoValidator();
        this.appSessionIdentifier = `${this.appName}_session_id`;

        if (this.shouldParseCookie === true) {
            this.walls.unshift(
                CookieEvaluatorWall as any
            );
        }

        if (this.shouldParseBody === true) {
            this.guards.unshift(
                PostDataEvaluatorGuard as any
            );
        }

        // add global shields
        RouteHandler.routerCollection.forEach((route) => {
            route.shields = this.shields.concat(route.shields);
            route.workers.forEach((worker) => {
                worker.guards = this.guards.concat(worker.guards);
            })
        });

    }

}

export const FORT_GLOBAL = new FortGlobal();