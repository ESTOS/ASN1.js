import { BaseBlockJson } from "./BaseBlock";
import { BaseStringBlockParams } from "./BaseStringBlock";
import { LocalUtf8StringValueBlockParams, LocalUtf8StringValueBlock, LocalUtf8StringValueBlockJson } from "./internals/LocalUtf8StringValueBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export interface Utf8StringParams extends BaseStringBlockParams, LocalUtf8StringValueBlockParams { }
export type Utf8StringJson = BaseBlockJson<LocalUtf8StringValueBlockJson>;

export class Utf8String extends LocalUtf8StringValueBlock {

  static {
    typeStore.Utf8String = this;
  }

  public static override NAME = "UTF8String";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.Utf8String};

  constructor(parameters: Utf8StringParams = {}) {
    Utf8String.mergeIDBlock(parameters, Utf8String.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   *
   * @param obj The object we want to match against the type of this class
   * @returns true if obj is of the same type as our class
   */
  public static typeGuard(obj: unknown | undefined): obj is Utf8String {
    return this.matches(obj);
  }

}
