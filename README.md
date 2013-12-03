node-greenwave-gop
==================

A node.js module to interface with the GOP service from Greenwave Reality.

Install
-------

    npm install gop

API
---

### Load

    var Gop = require('gop');


### Discover and Update

  var gop = new Gop().on('discover', function(controller) {
    controller.on('update', function() {
      var d, device;

      for (d in this.devices) if (this.devices.hasOwnProperty(d)) {
        device = this.devices[d];

        console.log('    device '  + device.did + ': ' + device.name);          

        controller.setBulbLevel(device.did, false); // off
        controller.setBulbLevel(device.did, true);  // on

        if (device.type === 'multilevel') controller.setBulbLevel(device.did, true, 50);
      }
    }).on('error', function(err) {
      console.log(this.tag + ': ' + err.message);
    });
  }).on('error', function(err) {
    console.log('oops: ' + err.message);
  });
