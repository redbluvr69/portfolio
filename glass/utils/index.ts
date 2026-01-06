export function computeGaussianKernelByRadius(radius: number) {
  const sigma = radius / 3.0;
  const kernel = [];
  let sum = 0;
  for (let i = 0; i <= radius; i++) {
    const weight = Math.exp(-0.5 * (i * i) / (sigma * sigma));
    kernel.push(weight);
    sum += i === 0 ? weight : weight * 2;
  }
  return kernel.map(w => w / sum); // 归一化
}

export function isChineseLanguage() {
  return navigator.language.startsWith('zh');
}

export function isUzbekLanguage() {
  return navigator.language.startsWith('uz');
}

export function capitalize(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}
