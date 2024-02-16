/**
 * Utility type to infer the element type of an array
 */
export type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[] ? ElementType : never
