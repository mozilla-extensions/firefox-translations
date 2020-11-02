export class Translator {
    originLanguage: string;
    targetLanguage: string;
    delay: number;

    constructor(originLanague: string, targetLanguage: string) {
        this.originLanguage = "English";
        this.targetLanguage = "German";
        this.delay = 3000;
    }

    translate(text: string) {
        const promise = new Promise<string>((resolve, reject) => {
            setTimeout(() => resolve(text.split("").reverse().join("")), this.delay);
        });

        return promise;
    }

    setDelay(milliseconds: number) {
        this.delay = milliseconds;
    }

    getOriginLanguage() {
        return this.originLanguage;
    }

    getTargetLanguage() {
        return this.targetLanguage;
    }

    setOriginLanguage(language: string) {
        this.originLanguage = language;
    }

    setTargetLanguage(language: string) {
        this.targetLanguage = language;
    }
}