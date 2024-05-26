import http from 'http';
import https from 'https';

class HttpClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(method, path, data = null, headers = {}) {
    const url = new URL(path, this.baseURL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    return new Promise((resolve, reject) => {
      const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
          };
          resolve(response);
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async get(path, headers = {}) {
    return this.request('GET', path, null, headers);
  }

  async post(path, data, headers = {}) {
    return this.request('POST', path, data, headers);
  }

  async put(path, data, headers = {}) {
    return this.request('PUT', path, data, headers);
  }

  async delete(path, headers = {}) {
    return this.request('DELETE', path, null, headers);
  }
}

export default HttpClient;