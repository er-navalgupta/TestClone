import { HttpRequest, HttpResponse, HttpResult } from "../types";
import { CookieManager } from "../models";
import { SessionProvider, Controller } from ".";
import { WallTestData, initWall } from "../test_helpers/init_wall";


export abstract class Wall implements Controller {
    request: HttpRequest;
    response: HttpResponse;
    query: { [key: string]: string };
    session: SessionProvider;
    cookie: CookieManager;

    data: { [key: string]: any };

    abstract onIncoming(...args): Promise<HttpResult>;
    async onOutgoing(...args) {
        return null;
    }

    constructor(...args) {

    }

    initialize(data?: WallTestData) {
        return initWall(this, data);
    }
}