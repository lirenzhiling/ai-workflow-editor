// src/utils/style.ts

/**
 * 把 rem 转换成 具体的像素数字
 * param rem rem 数值
 * return 像素数值
 */
export const remToPx = (rem: number): number => {
    const rootFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize
    );

    return rem * rootFontSize;
};
export default remToPx;