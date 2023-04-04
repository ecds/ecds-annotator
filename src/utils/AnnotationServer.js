class AnnotationServer {
  constructor(options={}) {
    this.endpoint = options.host || 'https://readux.io';
    this.headers = {
      'Content-Type': 'application/json',
      'X-CSRFToken': options.token
    }
  }

  async makeRequest(annotation, method, path) {
    console.log("🚀 ~ file: AnnotationServer.js:11 ~ AnnotationServer ~ makeRequest ~ annotation:", annotation)
    const url = path.startsWith('http') ? path : `${this.host}${path}`;
    const request = {
      method: method.toUpperCase(),
      headers: this.headers
    };

    if (request.method !== 'GET') {
      request.body = typeof(annotation) === 'string' ? annotation : JSON.stringify(annotation);
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
    annotation.id = `#${annotation.id}`;
  }

  async update(annotation, path='/annotations-crud/') {
    annotation.id = annotation.id.replace('#', '');
    const response =  await this.makeRequest(annotation, 'put', path);
    annotation.id = `#${annotation.id}`;
  }

  async delete(annotation, path='/annotations-crud/') {
    annotation.id = annotation.id.replace('#', '');
    annotation.contentOverlay = undefined;
    const response =  await this.makeRequest(annotation, 'delete', path);
    annotation.id = `#${annotation.id}`;
  }

}

export default AnnotationServer;
