/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

/** A proposed moderation action (e.g. adding a label or annotation to a post). Refers to some other resource via URI (e.g. an atproto post). Superset of 'com.atproto.proposal.defs#label. */
export interface Record {
  /** The AT Protocol version of the proposal object. */
  ver?: number
  /** The type of moderation action being proposed. Currently expected values are 'allowed_user' or 'label' */
  typ: string
  /** DID of the actor who created this proposal. */
  src: string
  /** AT URI of the record, repository (account), or other resource that this proposal applies to. */
  uri: string
  /** Optionally, CID specifying the specific version of 'uri' resource this proposal applies to. */
  cid?: string
  /** For 'label' proposals, the short string name of the value of the proposed label. */
  val: string
  /** For 'label' proposals where 'val' is 'needs-context', the full text of any proposed annotation (e.g. community note) to be shown below the post. */
  note?: string
  /** An optional array of predefined reasons justifying the moderation action. */
  reasons?: string[]
  /** The persistent, anonymous identifier for the user creating the proposal. */
  aid?: string
  /** Timestamp when this proposal was created. */
  cts: string
  /** Signature of dag-cbor encoded proposal. */
  sig?: Uint8Array
  [k: string]: unknown
}

export function isRecord(v: unknown): v is Record {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'social.pmsky.proposal#main' ||
      v.$type === 'social.pmsky.proposal')
  )
}

export function validateRecord(v: unknown): ValidationResult {
  return lexicons.validate('social.pmsky.proposal#main', v)
}
