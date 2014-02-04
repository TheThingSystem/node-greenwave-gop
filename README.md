node-greenwave-gop
==================

A node.js module to interface with the GOP service from Greenwave Reality.


Install
-------

    npm install greenwave-gop


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

    var Gop = require('greenwave-gop');


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


License
=======

[MIT](http://en.wikipedia.org/wiki/MIT_License) license. Freely have you received, freely give.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
