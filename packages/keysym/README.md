# Keysym

This library converts among X11 keysyms, unicodes, and string names in node.js.

Why would anybody want to do that? Why indeed, dear reader. Why indeed.

**electron-wm note**

This is a local fork of the npm `keysym` to remove use of Node `fs` APIs and `__dirname`.

## Methods

- fromKeysym - look up a record from an integral keysym
- fromUnicode - look up a record from its integral unicode position
- fromName - look up a record by name

You can also get at all the records at `require('keysym').records`.

## Record Format

Records are just hashes with fields: keysym, unicode, status, ane name.
These fields come directly from
[keysyms.txt](http://www.cl.cam.ac.uk/~mgk25/ucs/keysyms.txt),
except keysym and unicode are converted from hexadecimal strings to integers.

# Example

## Look up keysym records from a unicode position

    var ks = require('keysym');
    console.dir(ks.fromUnicode(8))

Output:
[ { keysym: 65288
, unicode: 8
, status: 'f'
, names: [ 'BackSpace' ]
}
]

# Installation

To install with [npm](http://github.com/isaacs/npm):

    npm install keysym

To run the tests with [expresso](http://github.com/visionmedia/expresso):

    expresso

# Credits

This module is basically just a thin wrapper around
[a public domain keysym dataset](http://www.cl.cam.ac.uk/~mgk25/ucs)
compiled by
[Markus G. Kuhn](http://www.cl.cam.ac.uk/~mgk25/).

Specifically, it's from [this file](http://www.cl.cam.ac.uk/~mgk25/ucs/keysyms.txt).
