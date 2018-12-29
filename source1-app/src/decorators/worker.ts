import { HTTP_METHOD } from "../enums";
import { RouteHandler } from "../handlers/route_handler";
import { RouteActionInfo } from "../types/route_action_info";

export const worker = (allowedMethods?: HTTP_METHOD[]): MethodDecorator => {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        const className = (target.constructor.name as string);
        const actionInfo: RouteActionInfo = {
            workerName: methodName,
            methodsAllowed: allowedMethods == null ? [
                HTTP_METHOD.Delete, HTTP_METHOD.Get, HTTP_METHOD.Post, HTTP_METHOD.Patch, HTTP_METHOD.Put
            ] : allowedMethods,
            guards: [],
            pattern: `/${methodName.toLowerCase()}`
        };
        RouteHandler.addWorker(actionInfo, className);
    };
};
