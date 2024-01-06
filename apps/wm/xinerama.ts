/**
 * This is an extension for node-x11, using what seem to be standard conventions for extensions.
 * If node-x11 adds Xinerama support, this could be removed.
 */

import { IXDisplay, XBuffer, XCbWithErr, XineramaScreenInfo, XXineramaExtension } from "@bond-wm/shared";

export function requireExt(display: IXDisplay, extCallback: XCbWithErr<[ext: XXineramaExtension | null]>) {
  const X = display.client;

  X.QueryExtension<XXineramaExtension>("XINERAMA", (err, ext) => {
    if (!ext.present) {
      return extCallback(new Error("xinerama extension not available"), null);
    }

    ext.QueryVersion = (clientMaj: number, clientMin: number, callback) => {
      X.seq_num++;
      X.pack_stream.pack("CCSCCxx", [ext.majorOpcode, 0, 2, clientMaj, clientMin]);
      X.replies[X.seq_num] = [
        function (buf: XBuffer) {
          const res = buf.unpack("SSLLLLL");
          return res.slice(0, 2); // Remove unused values
        },
        callback,
      ];
      X.pack_stream.flush();
    };

    ext.IsActive = (callback) => {
      X.seq_num++;
      X.pack_stream.pack("CCS", [ext.majorOpcode, 4, 1]);
      X.replies[X.seq_num] = [
        function (buf: XBuffer) {
          const res = buf.unpack("LLLLLL");
          return res[0] === 1;
        },
        callback,
      ];
      X.pack_stream.flush();
    };

    ext.QueryScreens = (callback: XCbWithErr<[info: XineramaScreenInfo[]]>) => {
      X.seq_num++;
      X.pack_stream.pack("CCS", [ext.majorOpcode, 5, 1]);
      X.replies[X.seq_num] = [
        function (buf: XBuffer) {
          const res = buf.unpack("LLLLLL");
          const count = res[0];

          const infos: XineramaScreenInfo[] = [];
          for (let i = 0; i < count; i++) {
            const res = buf.unpack("ssSS", 6 * 4 + i * 8);
            infos.push({
              x: res[0],
              y: res[1],
              width: res[2],
              height: res[3],
            });
          }
          return infos;
        },
        callback,
      ];
      X.pack_stream.flush();
    };

    ext.QueryVersion(1, 1, (err, vers: [number, number]) => {
      if (err) {
        extCallback(err, null);
        return;
      }

      ext.major = vers[0];
      ext.minor = vers[1];
      extCallback(null, ext);
    });
  });
}
