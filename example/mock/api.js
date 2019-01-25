export default {
  // supported values are Object and Array
  'GET /api/users': { users: [1, 2] },

  // GET and POST can be omitted
  '/api/users/1': { id: 1 },

  // support for custom functions, APIs refer to express@4
  'POST /api/users/create': (req, res) => { res.end('OK'); },
};
