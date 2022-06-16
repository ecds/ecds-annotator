class AnnotationServer {
  constructor(options={}) {
    this.endpoint = options.host || 'https://readux.io';
    this.headers = {
      'Content-Type': 'application/json',
      'X-CSRFToken': options.token
    }
  }

  async makeRequest(annotation, method, path) {
    const url = path.startsWith('http') ? path : `${this.host}${path}`;
    const request = {
      method: method.toUpperCase(),
      headers: this.headers
    };

    if (request.method !== 'GET') {
      request.body = JSON.stringify(annotation);
    }

    const response = await fetch(
      path,
      request
    );

    if (response.ok) {
      return response;
    } else {
      // error
    }

    return response;
  }

  async get(path) {
    const response = await this.makeRequest({}, 'get', path);
    const data = await response.json();
    return data;
  }

  async create(annotation, path='/annotations-crud/') {
    annotation.id = annotation.id.replace('#', '');
    const response =  await this.makeRequest(annotation, 'post', path);
  }

  async update(annotation, path='/annotations-crud/') {
    annotation.id = annotation.id.replace('#', '');
    const response =  await this.makeRequest(annotation, 'put', path);
  }

  async delete(annotation, path='/annotations-crud/') {
    annotation.id = annotation.id.replace('#', '');
    const response =  await this.makeRequest(annotation, 'delete', path);
  }

}

export default AnnotationServer;
