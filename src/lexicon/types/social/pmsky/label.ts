/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

/** Replicates `com.atproto.label.defs#label, but as a concrete record type */
export interface Record {
  /** The AT Protocol version of the label object. */
  ver?: number
  /** DID of the actor who created this label. */
  src: string
  /** AT URI of the record, repository (account), or other resource that this label applies to. */
  uri: string
  /** Optionally, CID specifying the specific version of 'uri' resource this label applies to. */
  cid?: string
  /** The short string name of the value or type of this label. */
  val: string
  /** If true, this is a negation label, overwriting a previous label. */
  neg?: boolean
  /** Timestamp when this label was created. */
  cts: string
  /** Timestamp at which this label expires (no longer applies). */
  exp?: string
  /** Signature of dag-cbor encoded label. */
  sig?: Uint8Array
  [k: string]: unknown
}

export function isRecord(v: unknown): v is Record {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'social.pmsky.label#main' || v.$type === 'social.pmsky.label')
  )
}

export function validateRecord(v: unknown): ValidationResult {
  return lexicons.validate('social.pmsky.label#main', v)
}
