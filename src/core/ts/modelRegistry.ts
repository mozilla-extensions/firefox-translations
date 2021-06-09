export interface ModelRegistry {
  [languagePair: string]: {
    [type: string]: {
      name: string;
      size: number;
      estimatedCompressedSize: number;
      expectedSha256Hash: string;
    };
  };
}

export const modelRegistry: ModelRegistry = {
  esen: {
    lex: {
      name: "lex.50.50.esen.s2t.bin",
      size: 3860888,
      estimatedCompressedSize: 1978538,
      expectedSha256Hash:
        "f11a2c23ef85ab1fee1c412b908d69bc20d66fd59faa8f7da5a5f0347eddf969",
    },
    model: {
      name: "model.esen.intgemm.alphas.bin",
      size: 17140755,
      estimatedCompressedSize: 13215960,
      expectedSha256Hash:
        "4b6b7f451094aaa447d012658af158ffc708fc8842dde2f871a58404f5457fe0",
    },
    vocab: {
      name: "vocab.esen.spm",
      size: 825463,
      estimatedCompressedSize: 414566,
      expectedSha256Hash:
        "909b1eea1face0d7f90a474fe29a8c0fef8d104b6e41e65616f864c964ba8845",
    },
  },
  csen: {
    lex: {
      name: "lex.50.50.csen.s2t.bin",
      size: 4535788,
      estimatedCompressedSize: 2418488,
      expectedSha256Hash:
        "8228a3c3f7887759a62b7d7c674a7bef9b70161913f9b0939ab58f71186835c2",
    },
    model: {
      name: "model.csen.intgemm.alphas.bin",
      size: 17140756,
      estimatedCompressedSize: 13045032,
      expectedSha256Hash:
        "5b16661e2864dc50b2f4091a16bdd4ec8d8283e04271e602159ba348df5d6e2d",
    },
    vocab: {
      name: "vocab.csen.spm",
      size: 769763,
      estimatedCompressedSize: 366392,
      expectedSha256Hash:
        "f71cc5d045e479607078e079884f44032f5a0b82547fb96eefa29cd1eb47c6f3",
    },
  },
  eten: {
    lex: {
      name: "lex.50.50.eten.s2t.bin",
      size: 3974944,
      estimatedCompressedSize: 1920655,
      expectedSha256Hash:
        "6992bedc590e60e610a28129c80746fe5f33144a4520e2c5508d87db14ca54f8",
    },
    model: {
      name: "model.eten.intgemm.alphas.bin",
      size: 17140754,
      estimatedCompressedSize: 12222624,
      expectedSha256Hash:
        "aac98a2371e216ee2d4843cbe896c617f6687501e17225ac83482eba52fd0028",
    },
    vocab: {
      name: "vocab.eten.spm",
      size: 828426,
      estimatedCompressedSize: 416995,
      expectedSha256Hash:
        "e3b66bc141f6123cd40746e2fb9b8ee4f89cbf324ab27d6bbf3782e52f15fa2d",
    },
  },
  ende: {
    lex: {
      name: "lex.50.50.ende.s2t.bin",
      size: 3062492,
      estimatedCompressedSize: 1575385,
      expectedSha256Hash:
        "764797d075f0642c0b079cce6547348d65fe4e92ac69fa6a8605cd8b53dacb3f",
    },
    model: {
      name: "model.ende.intgemm.alphas.bin",
      size: 17140498,
      estimatedCompressedSize: 13207068,
      expectedSha256Hash:
        "f0946515c6645304f0706fa66a051c3b7b7c507f12d0c850f276c18165a10c14",
    },
    vocab: {
      name: "vocab.deen.spm",
      size: 797501,
      estimatedCompressedSize: 412505,
      expectedSha256Hash:
        "bc8f8229933d8294c727f3eab12f6f064e7082b929f2d29494c8a1e619ba174c",
    },
  },
  enes: {
    lex: {
      name: "lex.50.50.enes.s2t.bin",
      size: 3347104,
      estimatedCompressedSize: 1720700,
      expectedSha256Hash:
        "3a113d713dec3cf1d12bba5b138ae616e28bba4bbc7fe7fd39ba145e26b86d7f",
    },
    model: {
      name: "model.enes.intgemm.alphas.bin",
      size: 17140755,
      estimatedCompressedSize: 12602853,
      expectedSha256Hash:
        "fa7460037a3163e03fe1d23602f964bff2331da6ee813637e092ddf37156ef53",
    },
    vocab: {
      name: "vocab.esen.spm",
      size: 825463,
      estimatedCompressedSize: 414566,
      expectedSha256Hash:
        "909b1eea1face0d7f90a474fe29a8c0fef8d104b6e41e65616f864c964ba8845",
    },
  },
  encs: {
    lex: {
      name: "lex.50.50.encs.s2t.bin",
      size: 12996877,
      estimatedCompressedSize: 12976833,
      expectedSha256Hash:
        "9fcb2c558f39a2f276540a564f364d46a0943c85d44b0637ff1a6ee7d566b0ff",
    },
    model: {
      name: "model.encs.intgemm.alphas.bin",
      size: 17140755,
      estimatedCompressedSize: 12630325,
      expectedSha256Hash:
        "9a2fe0588bd972accfc801e2f31c945de0557804a91666ae5ab43b94fb74ac4b",
    },
    vocab: {
      name: "vocab.csen.spm",
      size: 825463,
      estimatedCompressedSize: 366392,
      expectedSha256Hash:
        "f71cc5d045e479607078e079884f44032f5a0b82547fb96eefa29cd1eb47c6f3",
    },
  },
  enet: {
    lex: {
      name: "lex.50.50.enet.s2t.bin",
      size: 2700780,
      estimatedCompressedSize: 1336443,
      expectedSha256Hash:
        "3d1b40ff43ebef82cf98d416a88a1ea19eb325a85785eef102f59878a63a829d",
    },
    model: {
      name: "model.enet.intgemm.alphas.bin",
      size: 17140754,
      estimatedCompressedSize: 12543318,
      expectedSha256Hash:
        "a28874a8b702a519a14dc71bcee726a5cb4b539eeaada2d06492f751469a1fd6",
    },
    vocab: {
      name: "vocab.eten.spm",
      size: 828426,
      estimatedCompressedSize: 416995,
      expectedSha256Hash:
        "e3b66bc141f6123cd40746e2fb9b8ee4f89cbf324ab27d6bbf3782e52f15fa2d",
    },
  },
};
