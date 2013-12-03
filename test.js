var Gop = require('./gop')
  ;

new Gop().on('discover', function(controller) {
var didP = false;
  console.log('discover: ' + controller.tag);

  controller.on('update', function() {
    var d, device, i, r, room;

    console.log('update: ' + this.tag);
    i = 0;
    for (r in this.rooms) if (this.rooms.hasOwnProperty(r)) {
      room = this.rooms[r];
      console.log('  room #' + room.rid + ': ' + room.name);
      for (d in room.devices) if (room.devices.hasOwnProperty(d)) {
        device = room.devices[d];

        console.log('    device '  + device.did + ': ' + device.name);
        console.log('      classid=' + device.classid + ' subclassid=' + device.subclassid + ' colorid=' + device.colorid);
        console.log('      state='   + device.state   + ' level=' + device.level    + ' known=' + device.known);
        console.log('      type='    + device.type    + ' min='   + device.rangemin + ' max='   + device.rangemax);
        console.log('      product id=' + device.productid + ' brand=' + device.prodbrand + ' model=' + device.prodmodel
                    + ' type=' + device.prodtype + ' prodtypeid=' + device.prodtypeid);
        if (didP) continue;

        controller.setBulbLevel(device.did, 0);
        controller.setBulbName(device.did, 'LED #' + i);
        i++;
      }
    }
    didP = true;
  }).on('error', function(err) {
    console.log('controller: ' + err.message);
  });
}).on('error', function(err) {
  console.log('oops: ' + err.message);
}).logger.debug = function() {};
