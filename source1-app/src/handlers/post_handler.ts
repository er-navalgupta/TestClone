import { ControllerHandler } from "./controller_handler";
import { promise } from "../helpers";
import { __ContentType } from "../constant";
import { MIME_TYPE } from "../enums";
import * as ContentType from "content-type";
import * as QueryString from 'querystring';
import * as Multiparty from "multiparty";
import { MultiPartParseResult } from "../types";
import { FileManager } from "../models";
import { Global } from "../global";


export class PostHandler extends ControllerHandler {
    protected body: any;
    protected file: FileManager = new FileManager();

    protected getPostRawData_() {
        const body = [];
        return promise((res, rej) => {
            this.request.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                const bodyBuffer = Buffer.concat(body);
                res(bodyBuffer);
            });
        });
    }

    private parseMultiPartData_(): Promise<MultiPartParseResult> {
        return new Promise((res, rej) => {
            new Multiparty.Form().parse(this.request, (err, fields, files) => {
                if (err) {
                    rej(err);
                }
                else {
                    const result: MultiPartParseResult = {
                        field: {},
                        file: {}
                    };
                    for (const field in fields) {
                        result.field[field] = fields[field].length === 1 ? fields[field][0] : fields[field];
                    }
                    for (const file in files) {
                        result.file[file] = files[file].length === 1 ? files[file][0] : files[file];
                    }
                    res(result);
                }
            });
        });
    }

    protected async parsePostData() {
        try {
            let postData;

            let contentType = this.request.headers[__ContentType] || this.request.headers["content-type"];
            if (contentType != null) {
                contentType = ContentType.parse(contentType as string).type;
            }
            if (contentType === MIME_TYPE.FormMultiPart) {
                const result = await this.parseMultiPartData_();
                postData = result.field;
                this.file.files = result.file;
            }
            else {
                const bodyBuffer = await this.getPostRawData_();
                const bodyDataAsString = bodyBuffer.toString();
                switch (contentType) {
                    case MIME_TYPE.Json:
                        try {
                            postData = JSON.parse(bodyDataAsString);
                        }
                        catch (ex) {
                            /* tslint:disable-next-line */
                            throw "Post data is invalid";
                        }
                        break;
                    case MIME_TYPE.Text:
                    case MIME_TYPE.Html:
                        postData = bodyDataAsString; break;
                    case MIME_TYPE.FormUrlEncoded:
                        postData = QueryString.parse(bodyDataAsString); break;
                    case MIME_TYPE.Xml:
                        postData = new (Global as any).xmlParser().parse(bodyDataAsString);
                        break;
                    default:
                        postData = {};
                }
            }

            return postData;
        }
        catch (ex) {
            return Promise.reject(ex);
        }
    }
}