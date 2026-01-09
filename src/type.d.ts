declare const process: {
    env: {
        API_URL: string;
        [key: string]: any;
    }
};

declare module "*.svg" {
    const src: string;
    export default src;
}

declare module "*.png" {
    const src: string;
    export default src;
}