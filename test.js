var Gop = require('./gop')
  ;

var update = function(controller) {
  var d, device;

  console.log('update: ' + controller.tag);
  for (d in controller.devices) if (controller.devices.hasOwnProperty(d)) {
    device = controller.devices[d];

    console.log('  device '  + device.did + ': ' + device.name);
    console.log('    classid=' + device.classid + ' subclassid=' + device.subclassid + ' colorid=' + device.colorid);
    console.log('    state='   + device.state   + ' level=' + device.level    + ' known=' + device.known);
    console.log('    type='    + device.type    + ' min='   + device.rangemin + ' max='   + device.rangemax);
    console.log('    product id=' + device.productid + ' brand=' + device.prodbrand + ' model=' + device.prodmodel
                + ' type=' + device.prodtype + ' prodtypeid=' + device.prodtypeid);

    controller.setBulbLevel(device.did, false, 25);
  }
};

new Gop().on('discover', function(controller) {
  console.log('discover: ' + controller.tag);

  controller.on('update', update).on('error', function(err) {
    console.log(controller.tag + ': ' + err.message);
  });
}).on('error', function(err) {
  console.log('oops: ' + err.message);
}).logger.debug = function() {};

new Gop().oneshot('https://192.168.1.70:443').on('update', update).on('error', function(err) {
  console.log('oops: ' + err.message);
});

