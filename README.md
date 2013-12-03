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


### Discover

  var gop = new Gop().on('discover', function(controller) {
    controller.on('update', function() {
      var d, device, i, r, room;

      for (r in this.rooms) if (this.rooms.hasOwnProperty(r)) {
        room = this.rooms[r];

        for (d in room.devices) if (room.devices.hasOwnProperty(d)) {
        device = room.devices[d];

          console.log('    device '  + device.did + ': ' + device.name);          

          controller.setBulbLevel(device.did,   0); // off
          controller.setBulbLevel(device.did, 100); // on

          if (device.typecontroller.setBulbLevel(device.did,  50); // if 
        }
      }
    }).on('error', function(err) {

  // emitted when a background task fails...

    });
  }.on('error', function(err) {
    console.log('oops: ' + err.message);
  });
