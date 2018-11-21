import { MIME_TYPE } from "../enums";

export function getMimeTypeFromExtension(ext: string): MIME_TYPE {
    switch (ext) {
        case ".html":
            return MIME_TYPE.Html;
        case ".css":
            return MIME_TYPE.Css;
        case ".js":
            return MIME_TYPE.Js;
        case ".png":
            return MIME_TYPE.Png;
        case ".woff":
            return MIME_TYPE.Woff;
        case ".woff2":
            return MIME_TYPE.Woff2;
        case ".json":
            return MIME_TYPE.Json;
        case ".txt":
            return MIME_TYPE.Text;
        case ".jpg":
        case ".jpeg":
            return MIME_TYPE.Jpeg;
        case ".rtf":
            return MIME_TYPE.Rtf;
        case ".ttf":
            return MIME_TYPE.Ttf;
        case ".swf":
            return MIME_TYPE.Swf;
        case ".Svg":
            return MIME_TYPE.Svg;
        case ".pdf":
            return MIME_TYPE.Pdf;
        case ".xml":
            return MIME_TYPE.Xml;
        case ".csv":
            return MIME_TYPE.Csv;
        case ".xls":
            return MIME_TYPE.Xls;
        case ".xlsx":
            return MIME_TYPE.Xlsx;
        default:
            return "application/octet-stream" as MIME_TYPE;
    }
}