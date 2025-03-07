/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

/** Some proposal that refers to another ATproto record.  Similar to `com.atproto.proposal.defs#label, but as a concrete record type. */
export interface Record {
  /** The AT Protocol version of the proposal object. */
  ver?: number
  /** the type of proposal, currently expected values are 'allowed_user' or 'post_proposal' */
  typ: string
  /** DID of the actor who created this proposal. */
  src: string
  /** AT URI of the record, repository (account), or other resource that this proposal applies to. */
  uri: string
  /** Optionally, CID specifying the specific version of 'uri' resource this proposal applies to. */
  cid?: string
  /** The short string name of the value or type of this proposal. */
  val: string
  /** If true, this is a negation of a proposal, overwriting a previous proposal. */
  neg?: boolean
  /** Timestamp when this proposal was created. */
  cts: string
  /** Timestamp at which this proposal expires (no longer applies). */
  exp?: string
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
