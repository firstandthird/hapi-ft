var url = require('url');
var Handlebars = require('handlebars');

module.exports = function (type, filename, version) {
  if (!filename) {
    return;
  }

  var cdn = this._server.app.config.assets.host || '';
  version = (typeof version === 'string') ? version : this._server.app.config.assets.version;

  var file;

  if (type == 'image' || type == 'image-path') {
    file = filename;
  } else {
    file = this._server.methods.getAsset(filename, type);
  }

  var filePath = url.resolve(cdn, this._server.app.config.assets.path) + '/' + file;

  if (version) {
    filePath += '?v=' + version;
  }

  var out = '';
  if (type == 'css') {
    out = '<link rel="stylesheet" href="'+filePath+'"/>';
  } else if (type == 'js') {
    out = '<script src="'+filePath+'"></script>';
  } else if (type == 'image') {
    out = '<img src="'+filePath+'"/>';
  } else if (type == 'image-path') {
    out = filePath;
  }
  
  return new Handlebars.SafeString(out);
};
