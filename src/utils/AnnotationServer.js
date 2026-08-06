const makeRequest = (headers, annotation, method, path) => {
  const request = {
    method: method.toUpperCase(),
    headers,
  };

  if (request.method !== 'GET') {
    request.body = typeof annotation === 'string' ? annotation : JSON.stringify(annotation);
  }

  return fetch(path, request).then((response) => {
    if (!response.ok) console.error(response);
    return response;
  });
};

const createAnnotationServer = ({ token, host = 'https://readux.io', onPending, onSettled } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRFToken': token,
  };

  const mutate = async (fn) => {
    onPending?.();
    try {
      return await fn();
    } finally {
      onSettled?.();
    }
  };

  const get = async (path) => {
    const response = await makeRequest(headers, {}, 'get', path);
    return response.json();
  };

  const create = (annotation, path = '/annotations-crud/') => mutate(async () => {
    annotation.id = annotation.id.replace('#', '');
    const response = await makeRequest(headers, annotation, 'post', path);
    return response.json();
  });

  const update = (annotation, path = '/annotations-crud/') => mutate(async () => {
    annotation.id = annotation.id.replace('#', '');
    const response = await makeRequest(headers, annotation, 'put', path);
    return response.json();
  });

  const del = (annotation, path = '/annotations-crud/') => mutate(async () => {
    annotation.id = annotation.id.replace('#', '');
    annotation.contentOverlay = undefined;
    await makeRequest(headers, annotation, 'delete', path);
    annotation.id = `#${annotation.id}`;
  });

  return { get, create, update, delete: del };
};

export default createAnnotationServer;
