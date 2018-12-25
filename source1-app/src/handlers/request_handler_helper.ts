import { HTTP_STATUS_CODE } from "../enums/http_status_code";
import * as http from "http";
import { __ContentType } from "../constant";
import { MIME_TYPE } from "../enums/mime_type";
import { HTTP_METHOD } from "../enums/http_method";
import { Global } from "../global";
import * as Negotiator from "negotiator";
import { CookieManager } from "../model/cookie_manager";
import { Wall } from "../abstracts/wall";
import { IException } from "../interfaces/exception";
import { Util } from "../util";
export class RequestHandlerHelper {
    protected cookieManager: CookieManager;
    protected response: http.ServerResponse;
    protected request: http.IncomingMessage;

    protected wallInstances: Wall[] = [];

    protected isNullOrEmpty(value) {
        return Util.isNullOrEmpty(value);
    }

    protected async runWallOutgoing() {
        return Promise.all(this.wallInstances.reverse().map(async wallObj => {
            if (wallObj.onOutgoing != null) {
                return await wallObj.onOutgoing();
            }
        }));
    }

    protected getContentTypeFromNegotiation(type: MIME_TYPE) {
        const negotiator = new Negotiator(this.request);
        let availableTypes: MIME_TYPE[] = this.getAvailableTypes_(type);
        if (availableTypes == null) {
            availableTypes = [type];
        }
        return negotiator.mediaType(availableTypes) as MIME_TYPE;
    }

    protected getContentTypeFromNegotiationHavingMultipleTypes(types: MIME_TYPE[]) {
        const negotiator = new Negotiator(this.request);
        return negotiator.mediaType(types) as MIME_TYPE;
    }

    private getAvailableTypes_(type: MIME_TYPE) {
        switch (type) {
            case MIME_TYPE.Json:
            case MIME_TYPE.Xml:
                return [MIME_TYPE.Json, MIME_TYPE.Xml];
            case MIME_TYPE.Html:
            case MIME_TYPE.Css:
            case MIME_TYPE.Csv:
            case MIME_TYPE.Js:
            case MIME_TYPE.Rtf:
            case MIME_TYPE.Text:
                return [MIME_TYPE.Text, MIME_TYPE.Html, MIME_TYPE.Js,
                MIME_TYPE.Css, MIME_TYPE.Rtf, MIME_TYPE.Csv];
        }
        return null;
    }

    protected async onBadRequest(error) {
        try {
            const errMessage = await new Global.errorHandler().onBadRequest(error);
            this.response.writeHead(HTTP_STATUS_CODE.BadRequest, { [__ContentType]: MIME_TYPE.Html });
            this.response.end(errMessage);
        }
        catch (ex) {
            this.response.end(JSON.stringify(ex));
        }
    }

    protected async onForbiddenRequest() {
        try {
            const errMessage = await new Global.errorHandler().onForbiddenRequest();
            this.response.writeHead(HTTP_STATUS_CODE.Forbidden, { [__ContentType]: MIME_TYPE.Html });
            this.response.end(errMessage);
        }
        catch (err) {
            this.response.end(JSON.stringify(err));
        }
    }

    protected async onNotAcceptableRequest() {
        try {
            const errMessage = await new Global.errorHandler().onNotAcceptableRequest();
            this.response.writeHead(HTTP_STATUS_CODE.NotAcceptable, { [__ContentType]: MIME_TYPE.Html });
            this.response.end(errMessage);
        }
        catch (err) {
            this.response.end(JSON.stringify(err));
        }
    }

    protected async onNotFound() {
        try {
            const errMessage = await new Global.errorHandler().onNotFound(this.request.url);
            this.response.writeHead(HTTP_STATUS_CODE.NotFound, { [__ContentType]: MIME_TYPE.Html });
            this.response.end(errMessage);
        }
        catch (err) {
            this.response.end(JSON.stringify(err));
        }
    }

    protected async onMethodNotAllowed(allowedMethods: HTTP_METHOD[]) {
        try {
            const errMessage = await new Global.errorHandler().onMethodNotAllowed();
            this.response.setHeader("Allow", allowedMethods.join(","));
            this.response.writeHead(HTTP_STATUS_CODE.MethodNotAllowed, { [__ContentType]: MIME_TYPE.Html });
            this.response.end(errMessage);
        }
        catch (err) {
            this.response.end(JSON.stringify(err));
        }
    }

    protected async onErrorOccured(error) {
        if (typeof error === 'string') {
            error = {
                message: error
            } as IException;
        }

        try {
            const result = await new Global.errorHandler().onServerError(error);
            this.response.writeHead(HTTP_STATUS_CODE.InternalServerError, { [__ContentType]: MIME_TYPE.Html });
            this.response.end(result);
        }
        catch (err) {
            this.response.end(JSON.stringify(err));
        }
    }
}