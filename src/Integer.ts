import * as pvtsutils from "pvtsutils";
import { BaseBlock, BaseBlockJson, BaseBlockParams } from "./BaseBlock";
import { LocalIntegerValueBlockParams, LocalIntegerValueBlock, LocalIntegerValueBlockJson } from "./internals/LocalIntegerValueBlock";
import { assertBigInt } from "./internals/utils";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";
import { ViewWriter } from "./ViewWriter";

export interface IntegerParams extends BaseBlockParams, LocalIntegerValueBlockParams { }
export type IntegerJson = BaseBlockJson<LocalIntegerValueBlockJson>;

export class Integer extends BaseBlock<LocalIntegerValueBlock, LocalIntegerValueBlockJson> {

  static {
    typeStore.Integer = this;
  }

  public static override NAME = "INTEGER";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Integer};

  constructor(parameters: IntegerParams = {}) {
    Integer.mergeIDBlock(parameters, Integer.defaultIDs);
    super(parameters, LocalIntegerValueBlock);
  }

  public getValue(): number {
    return this.valueBlock.value;
  }

  public setValue(value: number): void {
    this.valueBlock.value = value;
  }

  /**
   * Converts Integer into BigInt
   * @throws Throws Error if BigInt is not supported
   * @since 3.0.0
   */
  public toBigInt(): bigint {
    assertBigInt();

    return BigInt(this.valueBlock.toString());
  }

  /**
   * Creates Integer from BigInt value
   * @param value BigInt value
   * @returns ASN.1 Integer
   * @throws Throws Error if BigInt is not supported
   * @since 3.0.0
   */
  public static fromBigInt(value: number | string | bigint | boolean): Integer {
    assertBigInt();

    const bigIntValue = BigInt(value);
    const writer = new ViewWriter();

    const hex = bigIntValue.toString(16).replace(/^-/, "");
    const view = new Uint8Array(pvtsutils.Convert.FromHex(hex));

    if (bigIntValue < 0) {
      /** a negative number */
      const first = new Uint8Array(view.length + (view[0] & 0x80 ? 1 : 0));
      first[0] |= 0x80;

      const firstInt = BigInt(`0x${pvtsutils.Convert.ToHex(first)}`);
      const secondInt = firstInt + bigIntValue;
      const second = pvtsutils.BufferSourceConverter.toUint8Array(pvtsutils.Convert.FromHex(secondInt.toString(16)));
      second[0] |= 0x80;

      writer.write(second);
    } else {
      /** a positive number */
      if (view[0] & 0x80) {
        writer.write(new Uint8Array([0]));
      }
      writer.write(view);
    }

    const res = new Integer({
      valueHex: writer.final(),
    });

    return res;
  }

  public convertToDER(): Integer {
    const integer = new Integer({ valueHex: this.valueBlock.valueHexView });

    integer.valueBlock.toDER();

    return integer;
  }

  /**
   * Convert current Integer value from DER to BER format
   * @returns
   */
  public convertFromDER(): Integer {
    return new Integer({
      valueHex: this.valueBlock.valueHexView[0] === 0
        ? this.valueBlock.valueHexView.subarray(1)
        : this.valueBlock.valueHexView,
    });
  }

  protected override onAsciiEncoding(): string {
    return `${(this.constructor as typeof Integer).NAME} : ${this.valueBlock.toString()}`;
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   *
   * @param obj The object we want to match against the type of this class
   * @returns true if obj is of the same type as our class
   */
  public static typeGuard(obj: unknown | undefined): obj is Integer {
    return this.matches(obj);
  }

}
