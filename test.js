var Gop = require('./gop')
  ;

new Gop().on('discover', function(controller) {
  console.log('discover: ' + controller.tag);

  controller.on('update', function() {
    var d, device;

    console.log('update: ' + this.tag);
    for (d in this.devices) if (this.devices.hasOwnProperty(d)) {
      device = this.devices[d];

      console.log('  device '  + device.did + ': ' + device.name);
      console.log('    classid=' + device.classid + ' subclassid=' + device.subclassid + ' colorid=' + device.colorid);
      console.log('    state='   + device.state   + ' level=' + device.level    + ' known=' + device.known);
      console.log('    type='    + device.type    + ' min='   + device.rangemin + ' max='   + device.rangemax);
      console.log('    product id=' + device.productid + ' brand=' + device.prodbrand + ' model=' + device.prodmodel
                  + ' type=' + device.prodtype + ' prodtypeid=' + device.prodtypeid);

      controller.setBulbLevel(device.did, false, 25);
    }
  }).on('error', function(err) {
    console.log(this.tag + ': ' + err.message);
  });
}).on('error', function(err) {
  console.log('oops: ' + err.message);
}).logger.debug = function() {};
