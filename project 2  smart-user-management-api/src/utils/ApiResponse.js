/**
 * Reusable success response shape:
 * { success: true, message: string, data: any, meta?: object }
 */
class ApiResponse {
  constructor(statusCode, message = 'Success', data = {}, meta = undefined) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }

  send(res, statusCode = 200) {
    return res.status(statusCode).json(this);
  }
}

module.exports = ApiResponse;
