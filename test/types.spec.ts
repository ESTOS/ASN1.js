import * as assert from "assert";
import * as pvtsutils from "pvtsutils";
import * as asn1js from "../src";

context("ASN types", () => {

  context("Boolean", () => {

    it("empty constructor", () => {
      const asn = new asn1js.Boolean();
      assert.strictEqual(asn.getValue(), false);
      assert.strictEqual(asn.toString("hex"), "010100");
    });

    it("toBER/fromBER", () => {
      const testBER = pvtsutils.Convert.FromHex("0101ff");
      const testValue = true;

      const asn = new asn1js.Boolean({
        value: true,
      });
      const ber = asn.toBER();
      assert.strictEqual(pvtsutils.Convert.ToHex(ber), pvtsutils.Convert.ToHex(testBER));

      const asnParsed = asn1js.fromBER(ber);
      assert.ok(asnParsed.result instanceof asn1js.Boolean);
      assert.ok(asn1js.Boolean.typeGuard(asnParsed.result));
      assert.strictEqual(asnParsed.result.getValue(), testValue);
    });

    it("encode parsed value without changes", () => {
      const testBER = pvtsutils.Convert.FromHex("010101");

      const asn = asn1js.fromBER(testBER);
      assert.ok(asn.result instanceof asn1js.Boolean);
      assert.strictEqual(asn.result.getValue(), true);

      const ber = asn.result.toBER();
      assert.strictEqual(pvtsutils.Convert.ToHex(ber), "010101");
    });

    it("from valueHex", () => {
      const asn = new asn1js.Boolean({
        valueHex: new Uint8Array([0x01]),
      });

      assert.strictEqual(asn.valueBlock.value, true);
    });

    it("toJSON", () => {
      const asn = new asn1js.Boolean({ value: true });
      const json = asn.toJSON();
      assert.deepStrictEqual(json.valueBlock, {
        blockLength: 0,
        blockName: "BooleanValueBlock",
        error: "",
        isHexOnly: false,
        value: true,
        valueBeforeDecode: "",
        valueHex: "ff",
        warnings: [],
      });
    });

    it("change value", () => {
      const asn = new asn1js.Boolean();
      asn.setValue(true);
      assert.strictEqual(asn.toString("hex"), "0101ff");
    });

  });

  context("BmpString", () => {

    it("toBER/fromBER", () => {
      const testBER = pvtsutils.Convert.FromHex("1e2400740065007300740020006d006500730073006100670065002004420435043a04410442");
      const testValue = "test message текст";

      const asn = new asn1js.BmpString({
        value: testValue,
      });
      const ber = asn.toBER();
      assert.strictEqual(pvtsutils.Convert.ToHex(ber), pvtsutils.Convert.ToHex(testBER));

      const asnParsed = asn1js.fromBER(ber);
      assert.ok(asn1js.BmpString.typeGuard(asnParsed.result));
      assert.ok(asnParsed.result instanceof asn1js.BmpString);
      assert.strictEqual(asnParsed.result.valueBlock.value, testValue);
    });

  });

  context("BitString", () => {
    it("parse zero-length", () => {
      const asn = asn1js.fromBER(pvtsutils.Convert.FromHex("0300"));
      assert.ok(asn.result instanceof asn1js.BitString);
      assert.ok(asn1js.BitString.typeGuard(asn.result));
    });
    it("incorrect unused bits", () => {
      const asn = asn1js.fromBER(pvtsutils.Convert.FromHex("030208ff"));
      assert.strictEqual(asn.offset, -1);
      assert.strictEqual(asn.result.error, "Unused bits for BitString must be in range 0-7");
    });
    it("incorrect unused bits in constructed BitString", () => {
      const asn = asn1js.fromBER(pvtsutils.Convert.FromHex("230403020800"));
      assert.strictEqual(asn.offset, -1);
      assert.strictEqual(asn.result.error, "Unused bits for BitString must be in range 0-7");
    });
    context("toBER", () => {

      it("default", () => {
        const asn = new asn1js.BitString();
        assert.strictEqual(asn.toString("hex"), "0300");
      });

      it("primitive", () => {
        const asn = new asn1js.BitString({
          unusedBits: 1,
          valueHex: new Uint8Array([0x80]),
        });
        assert.strictEqual(asn.toString(), "BIT STRING : 1000000");
        assert.strictEqual(asn.toString("hex"), "03020180");
      });

      it("constructed", () => {
        const asn = new asn1js.BitString({
          value: [
            new asn1js.BitString({
              valueHex: new Uint8Array([0x01])
            }),
            new asn1js.BitString({
              valueHex: new Uint8Array([0x02])
            }),
          ],
        });
        assert.strictEqual(asn.toString("hex"), "23080302000103020002");
      });

      it("constructed indefinite form", () => {
        const asn = new asn1js.BitString({
          isIndefiniteForm: true,
          value: [
            new asn1js.BitString({
              valueHex: new Uint8Array([0x01])
            }),
            new asn1js.BitString({
              valueHex: new Uint8Array([0x02])
            }),
          ],
        });
        assert.strictEqual(asn.toString("hex"), "238003020001030200020000");
      });

    });

  });

  context("Integer", () => {

    it("from number", () => {
      const asn = new asn1js.Integer({
        value: 97196,
      });

      assert.strictEqual(asn.valueBlock.toString(), "97196");
      assert.strictEqual(asn.toString(), "INTEGER : 97196");
      assert.strictEqual(asn.toString("hex"), "0203017bac");

      const asn2 = asn1js.fromBER(asn.toBER());
      assert.ok(asn2.result instanceof asn1js.Integer);
      assert.ok(asn1js.Integer.typeGuard(asn2.result));
      assert.strictEqual(asn2.result.valueBlock.value, 97196);
    });

    it("from valueHex", () => {
      const asn = new asn1js.Integer({
        valueHex: new Uint8Array([0x01, 0x7b, 0xac]),
      });

      assert.strictEqual(asn.valueBlock.isHexOnly, false);
      assert.strictEqual(asn.valueBlock.value, 97196);
      assert.strictEqual(asn.valueBlock.toString(), "97196");
      assert.strictEqual(asn.toString(), "INTEGER : 97196");
      assert.strictEqual(asn.toString("hex"), "0203017bac");

      const asn2 = asn1js.fromBER(asn.toBER());
      assert.ok(asn2.result instanceof asn1js.Integer);
      assert.strictEqual(asn2.result.valueBlock.value, 97196);
    });

    it("toString positive", () => {
      const asn = new asn1js.Integer({
        valueHex: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      });

      assert.strictEqual(asn.valueBlock.toString(), "18591708106338011145");
      assert.strictEqual(asn.toString(), "INTEGER : 18591708106338011145");
      assert.strictEqual(asn.toString("hex"), "0209010203040506070809");
    });

    it("toString negative", () => {
      const asn = new asn1js.Integer({
        valueHex: new Uint8Array([0x81, 2, 3, 4, 5, 6, 7, 8]),
      });

      assert.strictEqual(asn.valueBlock.toString(), "-9150748177064392952");
      assert.strictEqual(asn.toString(), "INTEGER : -9150748177064392952");
      assert.strictEqual(asn.toString("hex"), "02088102030405060708");
    });

    context("convert to/from BigInt", () => {
      it("positive", () => {
        const num = BigInt("18591708106338011145");
        const asn = asn1js.Integer.fromBigInt(num);
        assert.strictEqual(asn.toString("hex"), "0209010203040506070809");
        assert.strictEqual(asn.toBigInt(), num);
      });
      it("negative", () => {
        const num = BigInt("-9150748177064392952");
        const asn = asn1js.Integer.fromBigInt(num);
        assert.strictEqual(asn.toString("hex"), "02088102030405060708");
        assert.strictEqual(asn.toBigInt(), num);
      });
    });

    context("convert to/from DER", () => {
      it("positive", () => {
        const asn = asn1js.Integer.fromBigInt("18591708106338011145");

        const der = asn.convertToDER();
        assert.strictEqual(der.toString("hex"), "0209010203040506070809");

        const fromDer = der.convertFromDER();
        assert.strictEqual(fromDer.toString("hex"), "0209010203040506070809");
      });
      it("negative", () => {
        const asn = asn1js.Integer.fromBigInt("-9150748177064392952");

        const der = asn.convertToDER();
        assert.strictEqual(der.toString("hex"), "0209008102030405060708");

        const fromDer = der.convertFromDER();
        assert.strictEqual(fromDer.toString("hex"), "02088102030405060708");
      });
    });

  });

  context("CharacterString", () => {
    it("to/from BER", () => {
      const testString = "some string";
      const asn = new asn1js.CharacterString({
        value: testString,
      });
      assert.ok(asn1js.CharacterString.typeGuard(asn));
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), "1d0b736f6d6520737472696e67");
      assert.strictEqual(asn.toString(), `CharacterString : '${testString}'`);
    });
  });

  context("UniversalString", () => {
    it("to/from BER", () => {
      const testString = "My test text";
      const testHex = "1c300000004d0000007900000020000000740000006500000073000000740000002000000074000000650000007800000074";

      const asn = new asn1js.UniversalString({
        value: testString,
      });
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), testHex);
      assert.strictEqual(asn.toString(), `UniversalString : '${testString}'`);

      const parsedAsn = asn1js.fromBER(pvtsutils.Convert.FromHex(testHex));
      assert.ok(asn1js.UniversalString.typeGuard(parsedAsn.result));
      assert.ok(parsedAsn.result instanceof asn1js.UniversalString);
      assert.strictEqual(parsedAsn.result.getValue(), testString);
    });
  });

  context("Utf8String", () => {
    it("to/from BER", () => {
      const testString = "My test текст";
      const testHex = "0c124d79207465737420d182d0b5d0bad181d182";

      const asn = new asn1js.Utf8String({
        value: testString,
      });
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), testHex);
      assert.strictEqual(asn.toString(), `UTF8String : '${testString}'`);

      const parsedAsn = asn1js.fromBER(pvtsutils.Convert.FromHex(testHex));
      assert.ok(asn1js.Utf8String.typeGuard(parsedAsn.result));
      assert.ok(parsedAsn.result instanceof asn1js.Utf8String);
      assert.strictEqual(parsedAsn.result.getValue(), testString);
    });
  });

  context("DATE", () => {
    it("to/from BER", () => {
      const testString = "2000-01-02";
      const asn = new asn1js.DATE({
        value: testString,
      });
      assert.ok(asn1js.DATE.typeGuard(asn));
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), "1f1f0a323030302d30312d3032");
      assert.strictEqual(asn.toString(), `DATE : '${testString}'`);
    });
  });

  context("DateTime", () => {
    it("to/from BER", () => {
      const testString = "2000-01-02 12:00";
      const asn = new asn1js.DateTime({
        value: testString,
      });
      assert.ok(asn1js.DateTime.typeGuard(asn));
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), "1f2110323030302d30312d30322031323a3030");
      assert.strictEqual(asn.toString(), `DateTime : '${testString}'`);
    });
  });

  context("Duration", () => {
    it("to/from BER", () => {
      const testString = "1000";
      const asn = new asn1js.Duration({
        value: testString,
      });
      assert.ok(asn1js.Duration.typeGuard(asn));
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), "1f220431303030");
      assert.strictEqual(asn.toString(), `Duration : '${testString}'`);
    });
  });

  context("GeneralString", () => {
    it("to/from BER", () => {
      const testString = "some text";
      const asn = new asn1js.GeneralString({
        value: testString,
      });
      assert.ok(asn1js.GeneralString.typeGuard(asn));
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), "1b09736f6d652074657874");
      assert.strictEqual(asn.toString(), `GeneralString : '${testString}'`);
    });
  });

  context("GeneralizedTime", () => {
    it("to/from BER", () => {
      const value = new Date("2000-01-02T12:11:10.100Z");
      const asn = new asn1js.GeneralizedTime({
        valueDate: value,
      });
      assert.ok(asn.getValue().startsWith, "2000");
      assert.strictEqual(asn.toString("hex"), "181332303030303130323132313131302e3130305a");
      assert.ok(asn.toString("ascii").startsWith("GeneralizedTime : 2000"));
      assert.ok(asn.toString().startsWith, "2000");
      assert.ok(asn1js.GeneralizedTime.typeGuard(asn));
    });

    context("fromString", () => {
      it("YYYYMMDD", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "20000102",
        });
        assert.strictEqual(asn.toString("hex"), "18083230303030313032");
      });
      it("YYYYMMDD with fraction", () => {
        assert.throws(() => {
          new asn1js.GeneralizedTime({
            value: "20000102.100",
          });
        });
      });
      it("YYYYMMDD wrong", () => {
        assert.throws(() => {
          new asn1js.GeneralizedTime({
            value: "!0000102",
          });
        });
      });
      it("YYYYMMDDHH", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "2000010212",
        });
        assert.strictEqual(asn.toString("hex"), "180a32303030303130323132");
      });
      it("YYYYMMDDHH with fraction", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "2000010212.100",
        });
        assert.strictEqual(asn.toString("hex"), "180e323030303031303231322e313030");
      });
      it("YYYYMMDDHH wrong", () => {
        assert.throws(() => {
          new asn1js.GeneralizedTime({
            value: "!000010212",
          });
        });
      });
      it("YYYYMMDDHHMM", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "200001021201",
        });
        assert.strictEqual(asn.toString("hex"), "180c323030303031303231323031");
      });
      it("YYYYMMDDHHMM with fraction", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "200001021201.100",
        });
        assert.strictEqual(asn.toString("hex"), "18103230303030313032313230312e313030");
      });
      it("YYYYMMDDHHMM wrong", () => {
        assert.throws(() => {
          new asn1js.GeneralizedTime({
            value: "!200001021201",
          });
        });
      });
      it("YYYYMMDDHHMMSS", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "20000102120102",
        });
        assert.strictEqual(asn.toString("hex"), "180e3230303030313032313230313032");
      });
      it("YYYYMMDDHHMMSS with fraction", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "20000102120102.100",
        });
        assert.strictEqual(asn.toString("hex"), "181232303030303130323132303130322e313030");
      });
      it("YYYYMMDDHHMMSS wrong", () => {
        assert.throws(() => {
          new asn1js.GeneralizedTime({
            value: "!20000102120102",
          });
        });
      });
      it("incorrect string size", () => {
        assert.throws(() => {
          new asn1js.GeneralizedTime({
            value: "2",
          });
        });
      });
      it("ISO string", () => {
        const asn = new asn1js.GeneralizedTime({
          value: "20000102120102.100Z",
        });
        assert.strictEqual(asn.toString("hex"), "181332303030303130323132303130322e3130305a");
      });
    });
  });

  context("GraphicString", () => {
    it("to/from BER", () => {
      const testString = "some text";
      const asn = new asn1js.GraphicString({
        value: testString,
      });
      assert.ok(asn1js.GraphicString.typeGuard(asn));
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), "1909736f6d652074657874");
      assert.strictEqual(asn.toString(), `GraphicString : '${testString}'`);
    });
  });

  context("NumericString", () => {
    it("to/from BER", () => {
      const testString = "1234567890";
      const asn = new asn1js.NumericString({
        value: testString,
      });
      assert.ok(asn1js.NumericString.typeGuard(asn));
      assert.strictEqual(asn.getValue(), testString);
      assert.strictEqual(asn.toString("hex"), "120a31323334353637383930");
      assert.strictEqual(asn.toString(), `NumericString : '${testString}'`);
    });
  });

  context("RawData", () => {
    it("to/from BER", () => {
      const value = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
      const asn = new asn1js.RawData({
        data: value,
      });
      assert.strictEqual(pvtsutils.Convert.ToHex(asn.dataView), "01020304050607080900");
      assert.strictEqual(pvtsutils.Convert.ToHex(asn.toBER()), "01020304050607080900");

      const rawFromBER = new asn1js.RawData();
      rawFromBER.fromBER(value, 0, value.byteLength);
      assert.strictEqual(pvtsutils.Convert.ToHex(rawFromBER.toBER()), "01020304050607080900");
    });
  });

  context("ObjectIdentifier", () => {
    context("to/from BER", () => {
      it("starts with 0", () => {
        const value = "0.2.3.4.5";
        const asn = new asn1js.ObjectIdentifier({
          value,
        });
        assert.ok(asn1js.ObjectIdentifier.typeGuard(asn));
        assert.strictEqual(asn.toString("hex"), "060402030405");
        assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : 0.2.3.4.5");
      });
      it("starts with 1", () => {
        const value = "1.2.3.4.5";
        const asn = new asn1js.ObjectIdentifier({
          value,
        });

        assert.strictEqual(asn.toString("hex"), "06042a030405");
        assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : 1.2.3.4.5");
      });
      it("starts with 2", () => {
        const value = "2.2.3.4.5";
        const asn = new asn1js.ObjectIdentifier({
          value,
        });

        assert.strictEqual(asn.toString("hex"), "060452030405");
        assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : 2.2.3.4.5");
      });
      it("starts with incorrect value", () => {
        const value = "wrong data";
        const asn = new asn1js.ObjectIdentifier({
          value,
        });

        assert.strictEqual(asn.toString("hex"), "0600");
        assert.strictEqual(asn.toString("ascii"), "OBJECT IDENTIFIER : empty");
      });
    });
    it("to JSON", () => {
      const value = "1.2.3.4.5";
      const asn = new asn1js.ObjectIdentifier({
        value,
      });

      assert.strictEqual(asn.toJSON().value, "1.2.3.4.5");
    });
  });

  context("RelativeObjectIdentifier", () => {
    context("to/from BER", () => {
      it("correct value", () => {
        const value = "12345.1234.123.12.1";
        const asn = new asn1js.RelativeObjectIdentifier({
          value,
        });

        assert.ok(asn1js.RelativeObjectIdentifier.typeGuard(asn));
        assert.strictEqual(asn.toString("hex"), "0d07e03989527b0c01");
        assert.strictEqual(asn.toString("ascii"), `RelativeObjectIdentifier : ${value}`);

        const parsedAsn = asn1js.fromBER(asn.toBER());
        assert.ok(parsedAsn.result instanceof asn1js.RelativeObjectIdentifier);
        assert.strictEqual(parsedAsn.result.getValue(), asn.getValue());
      });
      it("incorrect value", () => {
        const value = "wrong data";
        const asn = new asn1js.RelativeObjectIdentifier({
          value,
        });

        assert.strictEqual(asn.toString("hex"), "0d00");
        assert.strictEqual(asn.toString("ascii"), "RelativeObjectIdentifier : empty");
      });
    });
    it("to JSON", () => {
      const value = "12345.2.3.4.5";
      const asn = new asn1js.RelativeObjectIdentifier({
        value,
      });

      assert.strictEqual(asn.toJSON().value, "12345.2.3.4.5");
    });
  });

  context("OctetString", () => {
    it("parse zero-length", () => {
      const asn = asn1js.fromBER(pvtsutils.Convert.FromHex("0400"));
      assert.ok(asn1js.OctetString.typeGuard(asn.result));
      assert.ok(asn.result instanceof asn1js.OctetString);
    });
    context("to BER", () => {

      it("default", () => {
        const asn = new asn1js.OctetString();
        assert.strictEqual(asn.toString("hex"), "0400");
      });

      it("primitive", () => {
        const asn = new asn1js.OctetString({
          valueHex: new Uint8Array([1, 2, 3, 4, 5]),
        });
        assert.strictEqual(asn.toString(), "OCTET STRING : 0102030405");
        assert.strictEqual(asn.toString("hex"), "04050102030405");
      });

      it("constructed", () => {
        const asn = new asn1js.OctetString({
          value: [
            new asn1js.OctetString({
              valueHex: new Uint8Array([0x01])
            }),
            new asn1js.OctetString({
              valueHex: new Uint8Array([0x02])
            }),
          ],
        });
        assert.strictEqual(asn.toString("hex"), "2406040101040102");
      });

      it("constructed indefinite form", () => {
        const asn = new asn1js.OctetString({
          isIndefiniteForm: true,
          value: [
            new asn1js.OctetString({
              valueHex: new Uint8Array([0x01])
            }),
            new asn1js.OctetString({
              valueHex: new Uint8Array([0x02])
            }),
          ],
        });
        assert.strictEqual(asn.toString("hex"), "24800401010401020000");
      });

    });

  });

  context("Enumerated", () => {
    it("typeguard", () => {
      const asn = new asn1js.Enumerated();
      assert.ok(asn1js.Enumerated.typeGuard(asn));
    });
  });

  context("EndOfContent", () => {
    it("typeguard", () => {
      const asn = new asn1js.EndOfContent();
      assert.ok(asn1js.EndOfContent.typeGuard(asn));
    });
  });

  context("IA5String", () => {
    it("typeguard", () => {
      const asn = new asn1js.IA5String();
      assert.ok(asn1js.IA5String.typeGuard(asn));
    });
  });

  context("Null", () => {
    it("typeguard", () => {
      const asn = new asn1js.Null();
      assert.ok(asn1js.Null.typeGuard(asn));
    });
  });

context("PrintableString", () => {
    it("typeguard", () => {
      const asn = new asn1js.PrintableString();
      assert.ok(asn1js.PrintableString.typeGuard(asn));
    });
  });

  context("Real", () => {
    it("typeguard", () => {
      const asn = new asn1js.Real();
      assert.ok(asn1js.Real.typeGuard(asn));
    });
  });

  context("Set", () => {
    it("typeguard", () => {
      const asn = new asn1js.Set();
      assert.ok(asn1js.Set.typeGuard(asn));
    });
  });

  context("TeletexString", () => {
    it("typeguard", () => {
      const asn = new asn1js.TeletexString();
      assert.ok(asn1js.TeletexString.typeGuard(asn));
    });
  });

  context("UTCTime", () => {
    it("typeguard", () => {
      const asn = new asn1js.UTCTime();
      assert.ok(asn1js.UTCTime.typeGuard(asn));
    });
  });

context("VideotexString", () => {
    it("typeguard", () => {
      const asn = new asn1js.VideotexString();
      assert.ok(asn1js.VideotexString.typeGuard(asn));
    });
  });

context("VisibleString", () => {
    it("typeguard", () => {
      const asn = new asn1js.VisibleString();
      assert.ok(asn1js.VisibleString.typeGuard(asn));
    });
  });

});
