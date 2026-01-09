// 判断是不是图片链接
export const isImageUrl = (url: any) => {
    if (typeof url !== 'string') return false;
    return url.startsWith('http') && (url.includes('images') || url.length < 2000); // 简单判断
};
export default isImageUrl;