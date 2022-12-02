import { LocalSimpleStringBlockParams, LocalSimpleStringBlock, LocalSimpleStringBlockJson } from "./internals/LocalSimpleStringBlock";
import { ETagClass, EUniversalTagNumber, typeStore } from "./TypeStore";

export type TeletexStringParams = LocalSimpleStringBlockParams;
export type TeletexStringJson = LocalSimpleStringBlockJson;

export class TeletexString extends LocalSimpleStringBlock {

  static {
    typeStore.TeletexString = this;
  }

  public static override NAME = "TeletexString";
  public static override defaultIDs = {tagClass: ETagClass.UNIVERSAL, tagNumber: EUniversalTagNumber.TeletexString};

  constructor(parameters: TeletexStringParams = {}) {
    TeletexString.mergeIDBlock(parameters, TeletexString.defaultIDs);
    super(parameters);
  }

  /**
   * A typeguard that allows to validate if a certain asn1.js object is of our type
   *
   * @param obj The object we want to match against the type of this class
   * @returns true if obj is of the same type as our class
   */
  public static typeGuard(obj: unknown | undefined): obj is TeletexString {
    return this.matches(obj);
  }

}
