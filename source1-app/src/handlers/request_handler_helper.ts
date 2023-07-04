import { HTTP_STATUS_CODE, MIME_TYPE, HTTP_METHOD } from "../enums";
import { __ContentType, __SetCookie } from "../constant";
import { FortGlobal } from "../fort_global";
import * as Negotiator from "negotiator";
import { IComponentProp, IException } from "../interfaces";
import { textResult, getResultBasedOnMiMe } from "../helpers";
import { HttpResult, HttpFormatResult } from "../types";



export class RequestHandlerHelper {
    protected componentProps: IComponentProp;

    protected controllerResult: HttpResult | HttpFormatResult = {} as any;

    get request() {
        return this.componentProps.request;
    }

    get response() {
        return this.componentProps.response;
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

    protected onBadRequest(error) {
        return new FortGlobal.errorHandler().onBadRequest(error).then(data => {
            return this.onResultFromError_(data);
        });
    }

    protected onForbiddenRequest() {
        return new FortGlobal.errorHandler().onForbiddenRequest().then(data => {
            return this.onResultFromError_(data);
        });
    }

    protected onNotAcceptableRequest() {
        return new FortGlobal.errorHandler().onNotAcceptableRequest().then(data => {
            return this.onResultFromError_(data);
        });
    }

    protected onNotFound() {
        return new FortGlobal.errorHandler().onNotFound(this.request.url).then(data => {
            return this.onResultFromError_(data);
        });
    }

    protected onMethodNotAllowed(allowedMethods: HTTP_METHOD[]) {
        return new FortGlobal.errorHandler().onMethodNotAllowed().then(data => {
            this.response.setHeader("Allow", allowedMethods.join(","));
            return this.onResultFromError_(data);
        });
    }

    // it won't execute wallOutgoing as if there is some issue in wallOutgoing
    // then it would become an infinite loop
    // treat it as someone comes to your fort & they start doing things 
    // which was not supposed to be done
    // then you don't follow regular rules but just throw them from anywhere
    protected onErrorOccured(error) {
        if (typeof error === 'string') {
            error = {
                message: error
            } as IException;
        }
        return new FortGlobal.errorHandler().onServerError(error).then(data => {
            this.controllerResult = data;
            return this.returnResultFromError_();
        }).catch(ex => {
            const response = {
                message: ex.message,
                stack: ex.stack,
                type: ex.type
            };
            this.controllerResult = JSON.stringify(response) as any;
            return this.returnResultFromError_();
        });
    }

    protected onRequestOptions(allowedMethods: HTTP_METHOD[]) {
        this.response.setHeader("Allow", allowedMethods.join(","));
        return this.onResultFromError_(textResult(""));
    }

    private onResultFromError_(result: HttpResult | HttpFormatResult) {
        this.controllerResult = result;
        this.returnResultFromError_();
    }

    private returnResultFromError_() {
        const result = this.controllerResult;
        (this.componentProps.cookie['responseCookie_']).forEach(value => {
            this.response.setHeader(__SetCookie, value);
        });

        if ((result as HttpFormatResult).responseFormat == null) {
            const contentType = (result as HttpResult).contentType || MIME_TYPE.Text;
            const negotiateMimeType = this.getContentTypeFromNegotiation(contentType) as MIME_TYPE;
            if (negotiateMimeType != null) {
                this.endResponse_(negotiateMimeType);
            }
            else {
                this.endResponse_(contentType);
            }
        }
        else {
            return this.handleFormatResult_(true);
        }
    }

    protected handleFormatResult_(shouldSendFirstMatch = false) {
        const negotiateMimeType = this.getContentTypeFromNegotiationHavingMultipleTypes(Object.keys((this.controllerResult as HttpFormatResult).responseFormat) as MIME_TYPE[]);
        let key = Object.keys((this.controllerResult as HttpFormatResult).responseFormat).find(qry => qry === negotiateMimeType);
        if (key != null) {
            (this.controllerResult as HttpResult).responseData = (this.controllerResult as HttpFormatResult).responseFormat[key]();
            this.endResponse_(negotiateMimeType);
        }
        else if (shouldSendFirstMatch === true) {
            key = Object.keys((this.controllerResult as HttpFormatResult).responseFormat)[0];
            (this.controllerResult as HttpResult).responseData = (this.controllerResult as HttpFormatResult).responseFormat[key]();
            this.endResponse_(negotiateMimeType);
        }
        else {
            return this.onNotAcceptableRequest();
        }
    }

    protected endResponse_(negotiateMimeType: MIME_TYPE) {

        const data = getResultBasedOnMiMe(negotiateMimeType,
            (this.controllerResult as HttpResult).responseData
            , (type: MIME_TYPE) => {
                negotiateMimeType = type;
            }
        );

        if (this.response.headersSent) {
            console.trace("Request is finished, but triggered again");
            return;
        }

        this.response.writeHead(this.controllerResult.statusCode || HTTP_STATUS_CODE.Ok,
            { [__ContentType]: negotiateMimeType });
        this.response.end(data);
    }

}