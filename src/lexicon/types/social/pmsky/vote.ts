/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

/** a vote record, representing a user's agreement or disagreement with the referenced record, be it a label, post, or user. */
export interface Record {
  /** the account creating the vote, not necessarily the same as the user who voted */
  src: string
  /** AT URI of the record, repository (account), or other resource that this label applies to. */
  uri: string
  /** Optionally, CID specifying the specific version of 'uri' resource this label applies to. */
  cid?: string
  /** The value of the vote, either +1 or -1 */
  val: number
  /** Timestamp when this label was created. */
  cts: string
  /** Signature of dag-cbor encoded label. */
  sig?: Uint8Array
  [k: string]: unknown
}

export function isRecord(v: unknown): v is Record {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'social.pmsky.vote#main' || v.$type === 'social.pmsky.vote')
  )
}

export function validateRecord(v: unknown): ValidationResult {
  return lexicons.validate('social.pmsky.vote#main', v)
}
