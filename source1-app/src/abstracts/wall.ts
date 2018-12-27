import { Controller } from "./controller";
import { SessionProvider } from "./session_provider";
import { CookieManager } from "../model/cookie_manager";
import { HttpResult } from "../types";
import { HttpRequest } from "../types/http_request";
import { HttpResponse } from "../types/http_response";
import { HttpFile } from "../model/http_file";
import { FileManager } from "../model/file_manager";

export abstract class Wall implements Controller {
    request: HttpRequest;
    response: HttpResponse;
    query: { [key: string]: string };
    session: SessionProvider;
    cookie: CookieManager;
   
    data: { [key: string]: any };

    abstract onIncoming(): Promise<HttpResult>;
    async onOutgoing() {
        return null;
    }
}