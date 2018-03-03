'use babel';
import nodeUuid from 'node-uuid';
import base32 from 'hi-base32';

export default class Helpers {
  // generate shorten uuid
  static shortUuid() {
    let uuid16bytes = nodeUuid.v4('binary');
    let uuidBase32 = base32.encode(uuid16bytes);
    let shortUuid = uuidBase32.substring(0, 26).toLowerCase();
    return shortUuid;
  }

  // strip invalid filename characters
  static stripInvalidFilenameChars(filename) {
    // Windows only TODO: support other platforms
    return filename.replace(/[\\/:"*?<>|]+/g, "");
  }
}
