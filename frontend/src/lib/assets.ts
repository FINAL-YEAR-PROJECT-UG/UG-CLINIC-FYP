// Utility function to handle image imports from Assets folder
export const getImageSrc = (image: any): string => {
  if (typeof image === 'string') return image;
  if (image.src) return image.src;
  return image;
};
