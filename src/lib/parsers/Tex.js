// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'kaitai-struct/KaitaiStream'], factory);
  } else if (typeof exports === 'object' && exports !== null && typeof exports.nodeType !== 'number') {
    factory(exports, require('kaitai-struct/KaitaiStream'));
  } else {
    factory(root.Tex || (root.Tex = {}), root.KaitaiStream);
  }
})(typeof self !== 'undefined' ? self : this, function (Tex_, KaitaiStream) {
var Tex = (function() {
  function Tex(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  Tex.prototype._read = function() {
    this.hdr = new Header(this._io, this, this._root);
    this.bdy = new Body(this._io, this, this._root);
  }

  var Body = Tex.Body = (function() {
    function Body(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root;

      this._read();
    }
    Body.prototype._read = function() {
      this.data = [];
      var i = 0;
      while (!this._io.isEof()) {
        this.data.push(this._io.readBytes(1));
        i++;
      }
    }

    return Body;
  })();

  var Header = Tex.Header = (function() {
    Header.Attribute = Object.freeze({
      DISCARD_PER_FRAME: 1,
      DISCARD_PER_MAP: 2,
      MANAGED: 4,
      USER_MANAGED: 8,
      CPU_READ: 16,
      LOCATION_MAIN: 32,
      NO_GPU_READ: 64,
      ALIGNED_SIZE: 128,
      EDGE_CULLING: 256,
      LOCATION_ONION: 512,
      READ_WRITE: 1024,
      IMMUTABLE: 2048,
      TEXTURE_RENDER_TARGET: 1048576,
      TEXTURE_DEPTH_STENCIL: 2097152,
      TEXTURE_TYPE_1D: 4194304,
      TEXTURE_TYPE_2D: 8388608,
      TEXTURE_TYPE_3D: 16777216,
      TEXTURE_TYPE_CUBE: 33554432,
      TEXTURE_TYPE_MASK: 62914560,
      TEXTURE_SWIZZLE: 67108864,
      TEXTURE_NO_TILED: 134217728,
      TEXTURE_NO_SWIZZLE: 2147483648,

      1: "DISCARD_PER_FRAME",
      2: "DISCARD_PER_MAP",
      4: "MANAGED",
      8: "USER_MANAGED",
      16: "CPU_READ",
      32: "LOCATION_MAIN",
      64: "NO_GPU_READ",
      128: "ALIGNED_SIZE",
      256: "EDGE_CULLING",
      512: "LOCATION_ONION",
      1024: "READ_WRITE",
      2048: "IMMUTABLE",
      1048576: "TEXTURE_RENDER_TARGET",
      2097152: "TEXTURE_DEPTH_STENCIL",
      4194304: "TEXTURE_TYPE_1D",
      8388608: "TEXTURE_TYPE_2D",
      16777216: "TEXTURE_TYPE_3D",
      33554432: "TEXTURE_TYPE_CUBE",
      62914560: "TEXTURE_TYPE_MASK",
      67108864: "TEXTURE_SWIZZLE",
      134217728: "TEXTURE_NO_TILED",
      2147483648: "TEXTURE_NO_SWIZZLE",
    });

    Header.TextureFormat = Object.freeze({
      ENUM_SHIFT: 0,
      TYPE_INTEGER: 1,
      TYPE_FLOAT: 2,
      TYPE_DXT: 3,
      BPP_SHIFT: 4,
      TYPE_SPECIAL: 5,
      TYPE_BC57: 6,
      COMPONENT_SHIFT: 8,
      TYPE_SHIFT: 12,
      ENUM_MASK: 15,
      BPP_MASK: 240,
      COMPONENT_MASK: 3840,
      L8: 4400,
      A8: 4401,
      B4G4R4A4: 5184,
      B5G5R5A1: 5185,
      B8G8R8A8: 5200,
      B8G8R8X8: 5201,
      R32F: 8528,
      R16G16F: 8784,
      R32G32F: 8800,
      R16G16B16A16F: 9312,
      R32G32B32A32F: 9328,
      DXT1: 13344,
      DXT3: 13360,
      DXT5: 13361,
      D16: 16704,
      D24S8: 16976,
      NULL1: 20736,
      SHADOW16: 20800,
      SHADOW24: 20816,
      ATI1: 24864,
      ATI2: 25136,
      BC6H: 25392,
      BC7: 25650,
      TYPE_MASK: 61440,

      0: "ENUM_SHIFT",
      1: "TYPE_INTEGER",
      2: "TYPE_FLOAT",
      3: "TYPE_DXT",
      4: "BPP_SHIFT",
      5: "TYPE_SPECIAL",
      6: "TYPE_BC57",
      8: "COMPONENT_SHIFT",
      12: "TYPE_SHIFT",
      15: "ENUM_MASK",
      240: "BPP_MASK",
      3840: "COMPONENT_MASK",
      4400: "L8",
      4401: "A8",
      5184: "B4G4R4A4",
      5185: "B5G5R5A1",
      5200: "B8G8R8A8",
      5201: "B8G8R8X8",
      8528: "R32F",
      8784: "R16G16F",
      8800: "R32G32F",
      9312: "R16G16B16A16F",
      9328: "R32G32B32A32F",
      13344: "DXT1",
      13360: "DXT3",
      13361: "DXT5",
      16704: "D16",
      16976: "D24S8",
      20736: "NULL1",
      20800: "SHADOW16",
      20816: "SHADOW24",
      24864: "ATI1",
      25136: "ATI2",
      25392: "BC6H",
      25650: "BC7",
      61440: "TYPE_MASK",
    });

    function Header(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root;

      this._read();
    }
    Header.prototype._read = function() {
      this.type = this._io.readU4le();
      this.format = this._io.readU4le();
      this.width = this._io.readU2le();
      this.height = this._io.readU2le();
      this.depth = this._io.readU2le();
      this.mipLevels = this._io.readU2le();
      this.lodOffset3 = [];
      for (var i = 0; i < 3; i++) {
        this.lodOffset3.push(this._io.readU4le());
      }
      this.offsetToSurface13 = [];
      for (var i = 0; i < 13; i++) {
        this.offsetToSurface13.push(this._io.readU4le());
      }
    }

    /**
     * is always u4[1]=0, u4[2]=1, u4[3]=2; this 
     */

    /**
     * starts with 0x50, mipmaps offset, so ffxiv knows where to look for each mipmap. offset varies by mipmap1 width and length, and whether compressed or not.
     */

    return Header;
  })();

  return Tex;
})();
Tex_.Tex = Tex;
});
