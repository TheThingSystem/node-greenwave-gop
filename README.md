node-greenwave-gop
==================

A node.js module to interface with the GOP service from Greenwave Reality.

Install
-------

    npm install gop

Read Carefully
----

This is an _unofficial_ implementation, based on the 
GreenWave Reality [Connected Lighting Solution](http://www.greenwavereality.com/solutions/connected-lighting-solution/)
as implemented in the [Connected by TCPi](http://www.tcpi.com/connected-by-tcp) product line.

No representation is made as to the fidelity of this implementation:
in other words, the people making the _lighting gateway_ are free to change the protocol at any time.
If that happens, please contact the maintainer of the repository to take a look.


Technical Notes
---------
The _lighting gateway_ advertises itself as "_gop._tcp" and speaks an HTTP-based protocol on port 80.
Requests are sent via POST, with the body containing a URL-encoded XML document.
Responses are also XML documents (minus the URL encoding, of course).

The protocol itself appears rich,
and this module implements only the smallest subset necessary to discovery, rename, and on/off/dim bulbs.


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
