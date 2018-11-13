import { Controller, action, HTTP_METHOD, declareController, htmlResult, textResult, viewResult } from "fortjs";
import * as fs from "fs";

@declareController()
export class UserController extends Controller {
    @action([HTTP_METHOD.POST])
    login() {
        const userId = this.body.userId;
        const pwd = this.body.password;
        if (userId != null && pwd != null) {
            this.session.set('userId', userId);
            return new Promise((resolve, reject) => {
                resolve(htmlResult(`<h1>Authenticated</h1>`));
            });
        }
        else {
            const result = textResult("Invalid credential");
            return new Promise((resolve, reject) => {
                resolve(result);
            });
        }
    }

    @action()
    authenticate() {
        this.session.set('userId', 123);
        return new Promise((resolve, reject) => {
            resolve(htmlResult("authenticated"));
        });
    }

    @action()
    file() {
        const filePath = this.query.file;
        console.log(filePath);
        fs.exists(filePath, (isExist) => {
            console.log(isExist);
        });
        return new Promise((resolve, reject) => {
            resolve(textResult("checking file"));
        });
    }

    @action()
    view() {
        return viewResult('index', { title: 'fort' });
    }
}