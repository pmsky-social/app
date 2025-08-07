/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

/** A vote record, representing a user's approval or disapproval of the referenced resource. The resource my be a proposal, a post, a web page, or anything that can be agreed or disagreed with. */
export interface Record {
  /** the account creating the vote, not necessarily the same as the user who voted */
  src: string
  /** AT URI of the record, repository (account), or other resource that this vote applies to. */
  uri: string
  /** Optionally, CID specifying the specific version of 'uri' resource this vote applies to. */
  cid?: string
  /** The value of the vote. The exact meaning depends on what is being voted on, but generally '+1' means 'approval', -1 means 'disapproval', and 0 indicates 'neutrality'. */
  val: number
  /** An optional array of predefined reasons justifying the vote. */
  reasons?: string[]
  /** The persistent, anonymous identifier for the user casting the vote. */
  aid?: string
  /** Timestamp when this vote was created. */
  cts: string
  /** Signature of dag-cbor encoded vote. */
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
