/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { LexiconDoc, Lexicons } from '@atproto/lexicon'

export const schemaDict = {
  AppBskyActorProfile: {
    lexicon: 1,
    id: 'app.bsky.actor.profile',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of a Bluesky account profile.',
        key: 'literal:self',
        record: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              maxGraphemes: 64,
              maxLength: 640,
            },
            description: {
              type: 'string',
              description: 'Free-form profile description text.',
              maxGraphemes: 256,
              maxLength: 2560,
            },
            avatar: {
              type: 'blob',
              description:
                "Small image to be displayed next to posts from account. AKA, 'profile picture'",
              accept: ['image/png', 'image/jpeg'],
              maxSize: 1000000,
            },
            banner: {
              type: 'blob',
              description:
                'Larger horizontal image to display behind profile view.',
              accept: ['image/png', 'image/jpeg'],
              maxSize: 1000000,
            },
            labels: {
              type: 'union',
              description:
                'Self-label values, specific to the Bluesky application, on the overall account.',
              refs: ['lex:com.atproto.label.defs#selfLabels'],
            },
            joinedViaStarterPack: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            pinnedPost: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  ComAtprotoLabelDefs: {
    lexicon: 1,
    id: 'com.atproto.label.defs',
    defs: {
      label: {
        type: 'object',
        description:
          'Metadata tag on an atproto resource (eg, repo or record).',
        required: ['src', 'uri', 'val', 'cts'],
        properties: {
          ver: {
            type: 'integer',
            description: 'The AT Protocol version of the label object.',
          },
          src: {
            type: 'string',
            format: 'did',
            description: 'DID of the actor who created this label.',
          },
          uri: {
            type: 'string',
            format: 'uri',
            description:
              'AT URI of the record, repository (account), or other resource that this label applies to.',
          },
          cid: {
            type: 'string',
            format: 'cid',
            description:
              "Optionally, CID specifying the specific version of 'uri' resource this label applies to.",
          },
          val: {
            type: 'string',
            maxLength: 128,
            description:
              'The short string name of the value or type of this label.',
          },
          neg: {
            type: 'boolean',
            description:
              'If true, this is a negation label, overwriting a previous label.',
          },
          cts: {
            type: 'string',
            format: 'datetime',
            description: 'Timestamp when this label was created.',
          },
          exp: {
            type: 'string',
            format: 'datetime',
            description:
              'Timestamp at which this label expires (no longer applies).',
          },
          sig: {
            type: 'bytes',
            description: 'Signature of dag-cbor encoded label.',
          },
        },
      },
      selfLabels: {
        type: 'object',
        description:
          'Metadata tags on an atproto record, published by the author within the record.',
        required: ['values'],
        properties: {
          values: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:com.atproto.label.defs#selfLabel',
            },
            maxLength: 10,
          },
        },
      },
      selfLabel: {
        type: 'object',
        description:
          'Metadata tag on an atproto record, published by the author within the record. Note that schemas should use #selfLabels, not #selfLabel.',
        required: ['val'],
        properties: {
          val: {
            type: 'string',
            maxLength: 128,
            description:
              'The short string name of the value or type of this label.',
          },
        },
      },
      labelValueDefinition: {
        type: 'object',
        description:
          'Declares a label value and its expected interpretations and behaviors.',
        required: ['identifier', 'severity', 'blurs', 'locales'],
        properties: {
          identifier: {
            type: 'string',
            description:
              "The value of the label being defined. Must only include lowercase ascii and the '-' character ([a-z-]+).",
            maxLength: 100,
            maxGraphemes: 100,
          },
          severity: {
            type: 'string',
            description:
              "How should a client visually convey this label? 'inform' means neutral and informational; 'alert' means negative and warning; 'none' means show nothing.",
            knownValues: ['inform', 'alert', 'none'],
          },
          blurs: {
            type: 'string',
            description:
              "What should this label hide in the UI, if applied? 'content' hides all of the target; 'media' hides the images/video/audio; 'none' hides nothing.",
            knownValues: ['content', 'media', 'none'],
          },
          defaultSetting: {
            type: 'string',
            description: 'The default setting for this label.',
            knownValues: ['ignore', 'warn', 'hide'],
            default: 'warn',
          },
          adultOnly: {
            type: 'boolean',
            description:
              'Does the user need to have adult content enabled in order to configure this label?',
          },
          locales: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:com.atproto.label.defs#labelValueDefinitionStrings',
            },
          },
        },
      },
      labelValueDefinitionStrings: {
        type: 'object',
        description:
          'Strings which describe the label in the UI, localized into a specific language.',
        required: ['lang', 'name', 'description'],
        properties: {
          lang: {
            type: 'string',
            description:
              'The code of the language these strings are written in.',
            format: 'language',
          },
          name: {
            type: 'string',
            description: 'A short human-readable name for the label.',
            maxGraphemes: 64,
            maxLength: 640,
          },
          description: {
            type: 'string',
            description:
              'A longer description of what the label means and why it might be applied.',
            maxGraphemes: 10000,
            maxLength: 100000,
          },
        },
      },
      labelValue: {
        type: 'string',
        knownValues: [
          '!hide',
          '!no-promote',
          '!warn',
          '!no-unauthenticated',
          'dmca-violation',
          'doxxing',
          'porn',
          'sexual',
          'nudity',
          'nsfl',
          'gore',
        ],
      },
    },
  },
  SocialPmskyLabel: {
    lexicon: 1,
    id: 'social.pmsky.label',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          description:
            'Replicates `com.atproto.label.defs#label, but as a concrete record type',
          required: ['src', 'uri', 'val', 'cts'],
          properties: {
            ver: {
              type: 'integer',
              description: 'The AT Protocol version of the label object.',
            },
            src: {
              type: 'string',
              format: 'did',
              description: 'DID of the actor who created this label.',
            },
            uri: {
              type: 'string',
              format: 'uri',
              description:
                'AT URI of the record, repository (account), or other resource that this label applies to.',
            },
            cid: {
              type: 'string',
              format: 'cid',
              description:
                "Optionally, CID specifying the specific version of 'uri' resource this label applies to.",
            },
            val: {
              type: 'string',
              maxLength: 128,
              description:
                'The short string name of the value or type of this label.',
            },
            neg: {
              type: 'boolean',
              description:
                'If true, this is a negation label, overwriting a previous label.',
            },
            cts: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp when this label was created.',
            },
            exp: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp at which this label expires (no longer applies).',
            },
            sig: {
              type: 'bytes',
              description: 'Signature of dag-cbor encoded label.',
            },
          },
        },
      },
    },
  },
  SocialPmskyProposal: {
    lexicon: 1,
    id: 'social.pmsky.proposal',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          description:
            "A proposed moderation action (e.g. adding a label or annotation to a post). Refers to some other resource via URI (e.g. an atproto post). Superset of 'com.atproto.proposal.defs#label.",
          required: ['typ', 'src', 'uri', 'val', 'cts'],
          properties: {
            ver: {
              type: 'integer',
              description: 'The AT Protocol version of the proposal object.',
            },
            typ: {
              type: 'string',
              description:
                "The type of moderation action being proposed. Currently expected values are 'allowed_user' or 'label'",
            },
            src: {
              type: 'string',
              format: 'did',
              description: 'DID of the actor who created this proposal.',
            },
            uri: {
              type: 'string',
              format: 'uri',
              description:
                'AT URI of the record, repository (account), or other resource that this proposal applies to.',
            },
            cid: {
              type: 'string',
              format: 'cid',
              description:
                "Optionally, CID specifying the specific version of 'uri' resource this proposal applies to.",
            },
            val: {
              type: 'string',
              maxLength: 128,
              description:
                "For 'label' proposals, the short string name of the value of the proposed label.",
            },
            note: {
              type: 'string',
              description:
                "For 'label' proposals where 'val' is 'needs-context', the full text of any proposed annotation (e.g. community note) to be shown below the post.",
            },
            reasons: {
              type: 'array',
              items: {
                type: 'string',
              },
              description:
                'An optional array of predefined reasons justifying the moderation action.',
            },
            aid: {
              type: 'string',
              description:
                'The persistent, anonymous identifier for the user creating the proposal.',
            },
            cts: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp when this proposal was created.',
            },
            sig: {
              type: 'bytes',
              description: 'Signature of dag-cbor encoded proposal.',
            },
          },
        },
      },
    },
  },
  ComAtprotoRepoStrongRef: {
    lexicon: 1,
    id: 'com.atproto.repo.strongRef',
    description: 'A URI with a content-hash fingerprint.',
    defs: {
      main: {
        type: 'object',
        required: ['uri', 'cid'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          cid: {
            type: 'string',
            format: 'cid',
          },
        },
      },
    },
  },
  SocialPmskyVote: {
    lexicon: 1,
    id: 'social.pmsky.vote',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          description:
            "A vote record, representing a user's approval or disapproval of the referenced resource. The resource my be a proposal, a post, a web page, or anything that can be agreed or disagreed with.",
          properties: {
            src: {
              type: 'string',
              format: 'did',
              description:
                'the account creating the vote, not necessarily the same as the user who voted',
            },
            uri: {
              type: 'string',
              format: 'uri',
              description:
                'AT URI of the record, repository (account), or other resource that this vote applies to.',
            },
            cid: {
              type: 'string',
              format: 'cid',
              description:
                "Optionally, CID specifying the specific version of 'uri' resource this vote applies to.",
            },
            val: {
              type: 'integer',
              description:
                "The value of the vote. The exact meaning depends on what is being voted on, but generally '+1' means 'approval', -1 means 'disapproval', and 0 indicates 'neutrality'.",
            },
            reasons: {
              type: 'array',
              items: {
                type: 'string',
              },
              description:
                'An optional array of predefined reasons justifying the vote.',
            },
            aid: {
              type: 'string',
              description:
                'The persistent, anonymous identifier for the user casting the vote.',
            },
            cts: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp when this vote was created.',
            },
            sig: {
              type: 'bytes',
              description: 'Signature of dag-cbor encoded vote.',
            },
          },
          required: ['src', 'uri', 'val', 'cts'],
        },
      },
    },
  },
}
export const schemas: LexiconDoc[] = Object.values(schemaDict) as LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)
export const ids = {
  AppBskyActorProfile: 'app.bsky.actor.profile',
  ComAtprotoLabelDefs: 'com.atproto.label.defs',
  SocialPmskyLabel: 'social.pmsky.label',
  SocialPmskyProposal: 'social.pmsky.proposal',
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
  SocialPmskyVote: 'social.pmsky.vote',
}
