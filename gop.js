// gop.js - reverse-engineered implementation of a mDNS service listed as "_gop._tcp" and advertised as "Greenwave GOP Service"

var deepEqual   = require('deep-equal')
  , Emitter     = require('events').EventEmitter
  , https       = require('https')
  , json2xml    = require('json2xml')
  , mdns        = require('mdns')
  , querystring = require('querystring')
  , ssdp        = require('node-ssdp')
  , url         = require('url')
  , util        = require('util')
  , uuid        = require('node-uuid')
  , xml2json    = require('xml2json').toJson
  ;


var DEFAULT_LOGGER = { error   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , warning : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , notice  : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , info    : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , debug   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     };


var Gop = function(options) {
  var self = this;

  if (!(self instanceof Gop)) return new Gop(options);

  self.options = options || {};
  self.logger = DEFAULT_LOGGER;
  self.controllers = {};

  mdns.createBrowser(mdns.tcp('gop')).on('serviceUp', function(service) {
    var controller, ipaddr, params;

    for (ipaddr in service.addresses) if ((service.addresses.hasOwnProperty(ipaddr)) && !!self.controllers[ipaddr]) return;
    service.event = 'up';
    self.logger.debug('_gop._tcp', service);

    params = { name    : service.name
             , host    : service.host
             , port    : service.port
             , path    : ((!!service.txtRecord) && service.txtRecord.path) || '/'
             , ipaddrs : service.addresses
             };
    controller = new Controller(params);
    for (ipaddr in service.addresses) if (service.addresses.hasOwnProperty(ipaddr)) self.controllers[ipaddr] = controller;

    controller.login(controller);
    self.emit('discover', controller);
  }).on('serviceDown', function(service) {
    self.logger.debug('_gop._tcp', { event: 'down', name: service.name, host: service.host });
  }).on('serviceChanged', function(service) {
    self.logger.debug('_gop._tcp', { event: 'changed', name: service.name, host: service.host });
  }).on('error', function(err) {
    self.logger.error('_gop._tcp', { event: 'mdns', diagnostic: err.message });
  }).start();

  new ssdp().on('response', function(msg /* , rinfo */) {
    var controller, i, info, j, location, lines, params;

    lines = msg.toString().split("\r\n");
    info = {};
    for (i = 1; i < lines.length; i++) {
      j = lines[i].indexOf(':');
      if (j <= 0) break;
      info[lines[i].substring(0, j)] = lines[i].substring(j + 1).trim();
    }

    if (info.ST !== 'urn:greenwavereality-com:service:gop:1') return;
    location = info.LOCATION || info.Location;
    if (!!self.controllers[location]) return;

    params = url.parse(location);
    params.ipaddrs = [ params.hostname ];
    controller = new Controller(params);
    self.controllers[location] = controller;

    controller.login(controller);
    self.emit('discover', controller);
  }).search('urn:greenwavereality-com:service:gop:1');
};
util.inherits(Gop, Emitter);


Gop.prototype.oneshot = function(bridge) {
  var params, self;

  params = url.parse(bridge);
  params.ipaddrs = [ params.hostname ];
  self = Controller(params);
  self.login(self);

  return self;
};

var Controller = function(params) {
  var path;

  var self = this;

  if (!(self instanceof Controller)) return new Controller(params);

  self.params = params;

  self.logger = DEFAULT_LOGGER;
  self.tag = self.params.host;

  path = params.path;
  if (path.lastIndexOf('/') !== (path.length - 1)) path += '/';
  self.options = url.parse('https://' + self.params.ipaddrs[0] + ':' + self.params.port + path + 'gwr/gop.php');
  self.options.agent = false;
  self.options.rejectUnauthorized = false;
  if (!self.params.email) self.params.email = uuid.v4();
  if (!self.params.password) self.params.password = self.params.email;

  self.timer = null;
};
util.inherits(Controller, Emitter);

Controller.prototype.login = function(self, oops) {
  self.roundtrip(self, 'POST', 'GWRLogin',
                 { gip: { version: 1, email: self.params.email, password: self.params.password }
                 }, function(err, result) {
    var rc;

    if (!!err) return self.logger.error(self.tag, { event: 'GWRLogin', diagnostic: err.message });

    if ((!result.results) || (!result.results.token)) {
      rc = result && result.errors && result.errors.rc;
      if (rc === '404') return self.emit('error', new Error('button not pushed'));

      if (!oops) oops = 0;
      self.logger.warning(self.tag, { event: 'login', retry: '60 seconds' });
      if (oops > 2) return self.emit('error', new Error('unable to login'));
      return setTimeout(function() { self.login(self, ++oops); }, 60 * 1000);
    }

     self.token = result.results.token;
     self.getGatewayInfo(self);
  });
};

Controller.prototype.getGatewayInfo = function(self, oops) {
  self.roundtrip(self, 'POST', 'GatewayGetInfo', { gip: { version: 1, token: self.token } },
                 function(err, result) {
    if (!!err) return self.logger.error(self.tag, { event: 'getGatewayInfo', diagnostic: err.message });

    if ((!result.results) || (!result.results.gateway)) {
      if (!oops) oops = 0;
      self.logger.warning(self.tag, { event: 'getGatewayInfo', retry: '60 seconds' });
      if (oops > 2) return self.emit('error', new Error('unable to get gateway information'));
      return setTimeout(function() { self.getGatewayInfo(self, ++oops); }, 60 * 1000);
    }

    self.gateway = result.results.gateway;
    self.getCarouselInfo(self);
  });
};

Controller.prototype.getCarouselInfo = function(self, oops) {
  self.roundtrip(self, 'POST', 'RoomGetCarousel',
                 { gip: { version: 1, token: self.token, fields: 'name,power,product,class,image,imageurl,control' } },
                 function(err, result) {
    var devices, i, j, room, rooms;

    if (!!err) return self.logger.error(self.tag, { event: 'RoomGetCarousel', diagnostic: err.message });

    if ((!result.results) || (!result.results.room)) {
      if (!oops) oops = 0;
      self.logger.warning(self.tag, { event: 'getCarouselInfo', retry: '60 seconds' });
      if (oops > 2) return self.emit('error', new Error('unable to get carousel information'));
      return setTimeout(function() { self.getCarouselInfo(self, ++oops); }, 60 * 1000);
    }

    rooms = util.isArray(result.results.room) ? result.results.room : [ result.results.room ];
    devices = {};
    for (i = 0; i < rooms.length; i++) {
      room = rooms[i];

      room.devices = util.isArray(room.device) ? room.device : [ room.device ];
      delete(room.device);

      for (j = 0; j < room.devices.length; j++) devices[room.devices[j].did] = room.devices[j];
    }

    self.timer = setTimeout(function() { self.getCarouselInfo(self); }, 30 * 1000);

    if ((!!self.rooms) && (deepEqual(self.rooms, rooms))) return;

    self.devices = devices;
    self.rooms = rooms;
    return self.emit('update', self);
  });
};

Controller.prototype.setBulbLevel = function(did, onoff, level) {
  var gip;

  var self = this;

  gip = { version: 1, token: self.token, did: did };
  if ((!onoff) && (!level)) {
    gip.value = 0;
  } else if ((onoff) && (!level)) {
    gip.value = 1;
  } else {
    gip.type = 'level';
    gip.val = level;
  }

  self.roundtrip(self, 'POST', 'DeviceSendCommand', { gip: gip }, function(err, result) {
    if (!!self.timer) clearTimeout(self.timer);
    self.timer = setTimeout(function() { self.getCarouselInfo(self); }, 0);

    if (!!err) return self.logger.error(self.tag, { event: 'DeviceSendCommand', diagnostic: err.message });

    if (!result.results) return self.logger.warning(self.tag, { event: 'DeviceSendCommand', diagnostic: 'failed' });

    if ((!!gip.type) && (onoff !== self.devices[did].state)) self.setBulbLevel(did, onoff);
  });
};

Controller.prototype.setBulbName = function(did, name) {
  var self = this;

  self.roundtrip(self, 'POST', 'DeviceSetInfo',
                 { gip: { version: 1, token: self.token, did: did, name: name } },
                 function(err, result) {
    if (!!self.timer) clearTimeout(self.timer);
    self.timer = setTimeout(function() { self.getCarouselInfo(self); }, 0);

    if (!!err) return self.logger.error(self.tag, { event: 'DeviceSetInfo', diagnostic: err.message });

    if (!result.results) self.logger.warning(self.tag, { event: 'DeviceSetInfo', diagnostic: 'failed' });
  });
};


Controller.prototype.roundtrip = function(self, method, cmd, data, cb) {
  var body;

  self.options.method = method || 'GET';
  self.options.headers = { Host : self.options.host };

  if (!!cmd) {
    body = querystring.stringify({ cmd: cmd, data: json2xml(data) });
    self.options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    self.options.headers['Content-Length'] = body.length;
  }

  https.request(self.options, function(response) {
    var content = '';

    response.setEncoding('utf8');
    response.on('data', function(chunk) {
      content += chunk.toString();
    }).on('end', function() {
      var errors, result, results;

      try {
        result = JSON.parse(xml2json(content, { coerce: false, sanitize: false }));
      } catch(ex) {
        return cb(ex);
      }
      if (!result.gip) return cb(new Error('invalid response'));

      if (result.gip.rc === '200') results = result.gip; else errors = result.gip;

      cb(null, { results: results, errors: errors });
    }).on('close', function() {
      self.logger.warning(self.tag, { event:'http', diagnostic: 'premature eof' });
      cb(new Error('premature eof'));
    });
  }).on('error', function(err) {
    cb(err);
  }).end(body);
};


module.exports = Gop;
