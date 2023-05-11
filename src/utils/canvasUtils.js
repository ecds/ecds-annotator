/* eslint-disable import/prefer-default-export */
export const getCanvasPid = (uri) => {
  const parts = uri.split('/').reverse();

  if (parts[0] === 'canvas') {
    return parts[1];
  }

  return parts[0];
};
