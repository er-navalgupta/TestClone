import { Controller, http, cacheFor, HTTP_METHOD, textResult, jsonResult, route, HTTP_STATUS_CODE } from "fortjs";

export class CacheController extends Controller {

    @http.post("/add")
    async cacheDataManually() {
        const { key, value, expiry } = this.body;
        await this.cache.set(key, value, expiry);
        return textResult("Ok");
    }

    @http.post("/get")
    async getCacheData() {
        const { key } = this.body;
        const value = await this.cache.get(key);
        return jsonResult({
            value: value && value.data
        });
    }

    @http.post("/delete")
    async deleteCache() {
        const { key } = this.body;
        const value = await this.cache.delete(key);
        return jsonResult({
            data: value
        });
    }

    fruits = ['Apple', 'Mango', 'Banana'];

    @cacheFor(1)
    @http.get("/fruits")
    async getFruits() {
        return jsonResult({
            data: this.fruits
        })
    }

    @http.get("/fruits-without-cache")
    async getFruitsWithoutCache() {
        return jsonResult({
            data: this.fruits
        })
    }

    @cacheFor(1)
    @http.post("/fruits")
    async addFruits() {
        const { fruits } = this.body;
        this.fruits = fruits;
        return jsonResult({
            data: this.fruits
        })
    }
}