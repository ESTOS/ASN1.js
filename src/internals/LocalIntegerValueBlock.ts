/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as pvutils from "pvutils";
import { HexBlockJson, HexBlockParams, HexBlock } from "../HexBlock.ts";
import { ValueBlock, ValueBlockJson, ValueBlockParams } from "../ValueBlock.ts";
import { powers2, digitsString } from "./constants.ts";

function viewAdd(first: Uint8Array, second: Uint8Array): Uint8Array {
  //#region Initial variables
  const c = new Uint8Array([0]);

  const firstView = new Uint8Array(first);
  const secondView = new Uint8Array(second);

  let firstViewCopy = firstView.slice(0);
  const firstViewCopyLength = firstViewCopy.length - 1;
  const secondViewCopy = secondView.slice(0);
  const secondViewCopyLength = secondViewCopy.length - 1;

  let value = 0;

  const max = (secondViewCopyLength < firstViewCopyLength) ? firstViewCopyLength : secondViewCopyLength;

  let counter = 0;
  //#endregion
  for (let i = max; i >= 0; i--, counter++) {
    switch (true) {
      case (counter < secondViewCopy.length):
        value = firstViewCopy[firstViewCopyLength - counter] + secondViewCopy[secondViewCopyLength - counter] + c[0];
        break;
      default:
        value = firstViewCopy[firstViewCopyLength - counter] + c[0];
    }

    c[0] = value / 10;

    switch (true) {
      case (counter >= firstViewCopy.length):
        firstViewCopy = pvutils.utilConcatView(new Uint8Array([value % 10]), firstViewCopy);
        break;
      default:
        firstViewCopy[firstViewCopyLength - counter] = value % 10;
    }
  }

  if (c[0] > 0)
    firstViewCopy = pvutils.utilConcatView(c, firstViewCopy);

  return firstViewCopy;
}

function power2(n: number): Uint8Array {
  if (n >= powers2.length) {
    for (let p = powers2.length; p <= n; p++) {
      const c = new Uint8Array([0]);
      let digits = (powers2[p - 1]).slice(0);

      for (let i = (digits.length - 1); i >= 0; i--) {
        const newValue = new Uint8Array([(digits[i] << 1) + c[0]]);
        c[0] = newValue[0] / 10;
        digits[i] = newValue[0] % 10;
      }

      if (c[0] > 0)
        digits = pvutils.utilConcatView(c, digits);

      powers2.push(digits);
    }
  }

  return powers2[n];
}

function viewSub(first: Uint8Array, second: Uint8Array): Uint8Array {
  //#region Initial variables
  let b = 0;

  const firstView = new Uint8Array(first);
  const secondView = new Uint8Array(second);

  const firstViewCopy = firstView.slice(0);
  const firstViewCopyLength = firstViewCopy.length - 1;
  const secondViewCopy = secondView.slice(0);
  const secondViewCopyLength = secondViewCopy.length - 1;

  let value;

  let counter = 0;
  //#endregion
  for (let i = secondViewCopyLength; i >= 0; i--, counter++) {
    value = firstViewCopy[firstViewCopyLength - counter] - secondViewCopy[secondViewCopyLength - counter] - b;

    switch (true) {
      case (value < 0):
        b = 1;
        firstViewCopy[firstViewCopyLength - counter] = value + 10;
        break;
      default:
        b = 0;
        firstViewCopy[firstViewCopyLength - counter] = value;
    }
  }

  if (b > 0) {
    for (let i = (firstViewCopyLength - secondViewCopyLength + 1); i >= 0; i--, counter++) {
      value = firstViewCopy[firstViewCopyLength - counter] - b;

      if (value < 0) {
        b = 1;
        firstViewCopy[firstViewCopyLength - counter] = value + 10;
      }
      else {
        b = 0;
        firstViewCopy[firstViewCopyLength - counter] = value;
        break;
      }
    }
  }

  return firstViewCopy.slice();
}

export interface ILocalIntegerValueBlock {
  value: number;
}

export interface LocalIntegerValueBlockParams extends HexBlockParams, ValueBlockParams, Partial<ILocalIntegerValueBlock> { }

export interface LocalIntegerValueBlockJson extends HexBlockJson, ValueBlockJson {
  valueDec: number;
}

export class LocalIntegerValueBlock extends HexBlock(ValueBlock) {
  protected setValueHex(): void {
    this.isHexOnly = false;
    if (this.valueHexView.length > 0)
      this._value = pvutils.utilDecodeTC.call(this);
    else
      this._value = 0;
  }

  public static override NAME = "IntegerValueBlock";

  static {
    Object.defineProperty(this.prototype, "valueHex", {
      set: function (this: LocalIntegerValueBlock, v: ArrayBuffer) {
        this.valueHexView = new Uint8Array(v);

        this.setValueHex();
      },
      get: function (this: LocalIntegerValueBlock) {
        return this.valueHexView.slice().buffer;
      },
    });
  }

  private _value = 0;

  constructor({
    value,
    ...parameters
  }: LocalIntegerValueBlockParams = {}) {
    super(parameters);

    if (parameters.valueHex) {
      this.setValueHex();
    }

    if (value !== undefined) {
      this.value = value;
    }
  }

  public set value(v: number) {
    this._value = v;

    this.isHexOnly = false;
    this.valueHexView = new Uint8Array(pvutils.utilEncodeTC(v));
  }

  public get value(): number {
    return this._value;
  }

  public override fromBER(inputBuffer: ArrayBuffer, inputOffset: number, inputLength: number): number {
    const resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
    if (resultOffset === -1) {
      return resultOffset;
    }

    this.setValueHex();

    return resultOffset;
  }

  public override toBER(sizeOnly?: boolean): ArrayBuffer {
    return sizeOnly
      ? new ArrayBuffer(this.valueHexView.length)
      : this.valueHexView.slice().buffer;
  }

  public override toJSON(): LocalIntegerValueBlockJson {
    return {
      ...super.toJSON(),
      valueDec: this.value,
    };
  }

  public override toString(): string {
    //#region Initial variables
    const firstBit = (this.valueHexView.length * 8) - 1;

    let digits = new Uint8Array((this.valueHexView.length * 8) / 3);
    let bitNumber = 0;
    let currentByte;

    const asn1View = this.valueHexView;

    let result = "";

    let flag = false;
    //#endregion
    //#region Calculate number
    for (let byteNumber = (asn1View.byteLength - 1); byteNumber >= 0; byteNumber--) {
      currentByte = asn1View[byteNumber];

      for (let i = 0; i < 8; i++) {
        if ((currentByte & 1) === 1) {
          switch (bitNumber) {
            case firstBit:
              digits = viewSub(power2(bitNumber), digits);
              result = "-";
              break;
            default:
              digits = viewAdd(digits, power2(bitNumber));
          }
        }

        bitNumber++;
        currentByte >>= 1;
      }
    }
    //#endregion
    //#region Print number
    for (let i = 0; i < digits.length; i++) {
      if (digits[i])
        flag = true;

      if (flag)
        result += digitsString.charAt(digits[i]);
    }

    if (flag === false)
      result += digitsString.charAt(0);
    //#endregion

    return result;
  }

}

export interface LocalIntegerValueBlock {
  /**
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueBeforeDecode: ArrayBuffer;
  /**
   * Binary data in ArrayBuffer representation
   *
   * @deprecated since version 3.0.0
   */
  // @ts-ignore
  valueHex: ArrayBuffer;
}
