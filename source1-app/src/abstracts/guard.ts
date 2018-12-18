
import { SessionProvider } from "./session_provider";
import { CookieManager } from "../model/cookie_manager";
import { Controller } from "./controller";
import { HttpResult } from "../types";
import { HttpRequest } from "../types/http_request";
import { HttpResponse } from "../types/http_response";

export abstract class Guard implements Controller {
    request: HttpRequest;
    response: HttpResponse;
    query: { [key: string]: any };
    body: { [key: string]: any };
    session: SessionProvider;
    cookies: CookieManager;
    params: { [key: string]: any };
    data: { [key: string]: any };
    abstract check(): Promise<HttpResult>;
}